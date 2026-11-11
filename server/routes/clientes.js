const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { clients } = require('../db/fallbackData');
const { registrarOperacion } = require('./auditoria');
const { generateOtpCode, generateVerificationToken, buildVerificationUrl, sendVerificationEmail } = require('../utils/mailer');

// Helper: excluir registros genéricos sin registro ("Consumidor Final")
function isRegisteredClient(c) {
  if (!c) return false;
  if (c.id_cliente === 1) return false;
  if (c.numero_identificacion === '0000000000') return false;
  const full = `${c.nombres || ''} ${c.apellidos || ''}`.toLowerCase();
  if (full.includes('consumidor final') || full.includes('sin registro')) return false;
  return true;
}

// 1. GET /api/clientes - Listar clientes con filtros opcionales (solo clientes registrados)
router.get('/', async (req, res) => {
  const { estado, q } = req.query;

  try {
    let query = `SELECT * FROM clientes WHERE id_cliente <> 1 AND numero_identificacion <> '0000000000' AND LOWER(nombres) <> 'consumidor'`;
    const params = [];

    if (estado && estado.toUpperCase() !== 'TODOS') {
      params.push(estado.toUpperCase());
      query += ` AND estado = $${params.length}`;
    }

    if (q && q.trim()) {
      params.push(`%${q.trim().toLowerCase()}%`);
      query += ` AND (LOWER(nombres) LIKE $${params.length} OR LOWER(COALESCE(apellidos, '')) LIKE $${params.length} OR numero_identificacion LIKE $${params.length} OR LOWER(COALESCE(correo, '')) LIKE $${params.length})`;
    }

    query += ' ORDER BY id_cliente ASC';

    const result = await pool.query(query, params);
    const rows = result.rows.filter(isRegisteredClient).map(r => ({
      ...r,
      correo_verificado: Boolean(r.correo_verificado),
      verificationUrl: r.token_verificacion ? buildVerificationUrl('cliente', r.token_verificacion) : null
    }));
    return res.json(rows);
  } catch (err) {
    // Fallback in-memory
    let filtered = clients.filter(isRegisteredClient);
    if (estado && estado.toUpperCase() !== 'TODOS') {
      filtered = filtered.filter(c => (c.estado || 'ACTIVO').toUpperCase() === estado.toUpperCase());
    }
    if (q && q.trim()) {
      const term = q.trim().toLowerCase();
      filtered = filtered.filter(c =>
        (c.nombres && c.nombres.toLowerCase().includes(term)) ||
        (c.apellidos && c.apellidos.toLowerCase().includes(term)) ||
        (c.numero_identificacion && c.numero_identificacion.includes(term)) ||
        (c.correo && c.correo.toLowerCase().includes(term))
      );
    }
    return res.json(filtered.map(c => ({
      ...c,
      correo_verificado: Boolean(c.correo_verificado),
      verificationUrl: c.token_verificacion ? buildVerificationUrl('cliente', c.token_verificacion) : null
    })));
  }
});

// 2. GET /api/clientes/:id - Consultar cliente específico
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM clientes WHERE id_cliente = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    const client = clients.find(c => c.id_cliente === parseInt(id));
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
    return res.json(client);
  }
});

// 3. POST /api/clientes - Registrar cliente
router.post('/', async (req, res) => {
  const {
    tipo_identificacion,
    numero_identificacion,
    nombres,
    apellidos,
    telefono,
    correo,
    direccion,
    estado = 'ACTIVO',
    id_usuario = 1
  } = req.body;

  if (!tipo_identificacion || !numero_identificacion || !nombres) {
    return res.status(400).json({ error: 'Tipo de identificación, número y nombres son obligatorios' });
  }

  if (!correo || !correo.trim().includes('@')) {
    return res.status(400).json({ error: 'El correo electrónico válido es obligatorio para verificar el registro del cliente' });
  }

  const token = generateVerificationToken('cli');
  const otp = generateOtpCode();
  const cleanEmail = correo.trim().toLowerCase();

  try {
    const result = await pool.query(
      `INSERT INTO clientes (tipo_identificacion, numero_identificacion, nombres, apellidos, telefono, correo, direccion, correo_verificado, token_verificacion, codigo_otp, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, $8, $9, $10) RETURNING *`,
      [
        tipo_identificacion,
        numero_identificacion.trim(),
        nombres.trim(),
        apellidos ? apellidos.trim() : '',
        telefono ? telefono.trim() : '',
        cleanEmail,
        direccion ? direccion.trim() : '',
        token,
        otp,
        estado.toUpperCase()
      ]
    );

    const newClient = result.rows[0];
    const mailInfo = await sendVerificationEmail({
      to: cleanEmail,
      nombre: `${newClient.nombres} ${newClient.apellidos || ''}`.trim(),
      tipo: 'cliente',
      token,
      codigo_otp: otp,
    });

    newClient.verificationUrl = mailInfo.verificationUrl;
    newClient.previewUrl = mailInfo.previewUrl;
    newClient.mailMode = mailInfo.mode;
    newClient.codigo_otp = otp;

    // Audit log
    await registrarOperacion({
      id_usuario,
      operacion: 'CREAR',
      tabla_afectada: 'clientes',
      id_registro_afectado: newClient.id_cliente,
      descripcion: `Registro de cliente ${newClient.nombres} ${newClient.apellidos || ''} (${newClient.tipo_identificacion}: ${newClient.numero_identificacion}) - Verificación enviada a ${cleanEmail}`,
      datos_nuevos: newClient
    });

    return res.status(201).json(newClient);
  } catch (err) {
    const newClient = {
      id_cliente: clients.length > 0 ? Math.max(...clients.map(c => c.id_cliente)) + 1 : 2,
      tipo_identificacion,
      numero_identificacion: numero_identificacion.trim(),
      nombres: nombres.trim(),
      apellidos: apellidos ? apellidos.trim() : '',
      telefono: telefono ? telefono.trim() : '',
      correo: cleanEmail,
      direccion: direccion ? direccion.trim() : '',
      correo_verificado: false,
      token_verificacion: token,
      codigo_otp: otp,
      fecha_verificacion: null,
      estado: estado.toUpperCase(),
      fecha_registro: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString()
    };

    clients.push(newClient);

    const mailInfo = await sendVerificationEmail({
      to: cleanEmail,
      nombre: `${newClient.nombres} ${newClient.apellidos || ''}`.trim(),
      tipo: 'cliente',
      token,
      codigo_otp: otp,
    });

    // Audit log
    await registrarOperacion({
      id_usuario,
      operacion: 'CREAR',
      tabla_afectada: 'clientes',
      id_registro_afectado: newClient.id_cliente,
      descripcion: `Registro de cliente ${newClient.nombres} ${newClient.apellidos || ''} (${newClient.tipo_identificacion}: ${newClient.numero_identificacion}) - Verificación enviada a ${cleanEmail}`,
      datos_nuevos: newClient
    });

    return res.status(201).json({
      ...newClient,
      verificationUrl: mailInfo.verificationUrl,
      previewUrl: mailInfo.previewUrl,
      mailMode: mailInfo.mode,
      codigo_otp: otp,
    });
  }
});

// 4. PUT /api/clientes/:id - Modificar cliente
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    tipo_identificacion,
    numero_identificacion,
    nombres,
    apellidos,
    telefono,
    correo,
    direccion,
    estado,
    id_usuario = 1
  } = req.body;

  if (!nombres) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }

  try {
    const prevRes = await pool.query('SELECT correo FROM clientes WHERE id_cliente = $1', [id]);
    if (prevRes.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    const prevEmail = (prevRes.rows[0].correo || '').trim().toLowerCase();
    const nextEmail = correo ? correo.trim().toLowerCase() : prevEmail;
    const emailChanged = Boolean(correo && nextEmail && nextEmail !== prevEmail);
    const newToken = emailChanged ? generateVerificationToken('cli') : null;

    const result = await pool.query(
      `UPDATE clientes
       SET tipo_identificacion = COALESCE($1, tipo_identificacion),
           numero_identificacion = COALESCE($2, numero_identificacion),
           nombres = $3,
           apellidos = COALESCE($4, apellidos),
           telefono = COALESCE($5, telefono),
           correo = COALESCE($6, correo),
           direccion = COALESCE($7, direccion),
           estado = COALESCE($8, estado),
           correo_verificado = CASE WHEN $10::boolean THEN FALSE ELSE correo_verificado END,
           token_verificacion = CASE WHEN $10::boolean THEN $11 ELSE token_verificacion END,
           fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id_cliente = $9
       RETURNING *`,
      [
        tipo_identificacion,
        numero_identificacion ? numero_identificacion.trim() : null,
        nombres.trim(),
        apellidos ? apellidos.trim() : '',
        telefono ? telefono.trim() : '',
        nextEmail,
        direccion ? direccion.trim() : '',
        estado ? estado.toUpperCase() : null,
        id,
        emailChanged,
        newToken
      ]
    );

    const updated = result.rows[0];
    if (emailChanged) {
      const mailInfo = await sendVerificationEmail({
        to: nextEmail,
        nombre: `${updated.nombres} ${updated.apellidos || ''}`.trim(),
        tipo: 'cliente',
        token: newToken,
      });
      updated.verificationUrl = mailInfo.verificationUrl;
    }

    // Audit log
    await registrarOperacion({
      id_usuario,
      operacion: 'MODIFICAR',
      tabla_afectada: 'clientes',
      id_registro_afectado: parseInt(id),
      descripcion: `Modificación de datos de cliente #${id}: ${updated.nombres} ${updated.apellidos || ''}`,
      datos_nuevos: updated
    });

    return res.json(updated);
  } catch (err) {
    const idx = clients.findIndex(c => c.id_cliente === parseInt(id));
    if (idx === -1) return res.status(404).json({ error: 'Cliente no encontrado' });

    const prev = { ...clients[idx] };
    const prevEmail = (prev.correo || '').trim().toLowerCase();
    const nextEmail = correo !== undefined ? correo.trim().toLowerCase() : prevEmail;
    const emailChanged = Boolean(correo !== undefined && nextEmail && nextEmail !== prevEmail);
    const newToken = emailChanged ? generateVerificationToken('cli') : prev.token_verificacion;

    clients[idx] = {
      ...clients[idx],
      ...(tipo_identificacion && { tipo_identificacion }),
      ...(numero_identificacion && { numero_identificacion: numero_identificacion.trim() }),
      nombres: nombres.trim(),
      ...(apellidos !== undefined && { apellidos: apellidos.trim() }),
      ...(telefono !== undefined && { telefono: telefono.trim() }),
      ...(correo !== undefined && { correo: nextEmail }),
      ...(direccion !== undefined && { direccion: direccion.trim() }),
      ...(estado && { estado: estado.toUpperCase() }),
      ...(emailChanged && { correo_verificado: false, token_verificacion: newToken, fecha_verificacion: null })
    };

    if (emailChanged) {
      const mailInfo = await sendVerificationEmail({
        to: nextEmail,
        nombre: `${clients[idx].nombres} ${clients[idx].apellidos || ''}`.trim(),
        tipo: 'cliente',
        token: newToken,
      });
      clients[idx].verificationUrl = mailInfo.verificationUrl;
    }

    // Audit log
    await registrarOperacion({
      id_usuario,
      operacion: 'MODIFICAR',
      tabla_afectada: 'clientes',
      id_registro_afectado: parseInt(id),
      descripcion: `Modificación de datos de cliente #${id}: ${clients[idx].nombres} ${clients[idx].apellidos || ''}`,
      datos_anteriores: prev,
      datos_nuevos: clients[idx]
    });

    return res.json(clients[idx]);
  }
});

// 5. PATCH /api/clientes/:id/estado - Desactivar / Activar cliente
router.patch('/:id/estado', async (req, res) => {
  const { id } = req.params;
  const { estado, id_usuario = 1 } = req.body;

  if (!estado || !['ACTIVO', 'INACTIVO'].includes(estado.toUpperCase())) {
    return res.status(400).json({ error: 'Estado debe ser ACTIVO o INACTIVO' });
  }

  const targetEstado = estado.toUpperCase();

  try {
    const result = await pool.query(
      `UPDATE clientes SET estado = $1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_cliente = $2 RETURNING *`,
      [targetEstado, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const updated = result.rows[0];

    // Audit log
    await registrarOperacion({
      id_usuario,
      operacion: targetEstado === 'ACTIVO' ? 'MODIFICAR' : 'DESACTIVAR',
      tabla_afectada: 'clientes',
      id_registro_afectado: parseInt(id),
      descripcion: `Cambio de estado de cliente #${id} (${updated.nombres}) a ${targetEstado}`,
      datos_nuevos: { estado: targetEstado }
    });

    return res.json({
      success: true,
      message: `Cliente ${targetEstado.toLowerCase()} correctamente`,
      cliente: updated
    });
  } catch (err) {
    const client = clients.find(c => c.id_cliente === parseInt(id));
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });

    client.estado = targetEstado;

    // Audit log
    await registrarOperacion({
      id_usuario,
      operacion: targetEstado === 'ACTIVO' ? 'MODIFICAR' : 'DESACTIVAR',
      tabla_afectada: 'clientes',
      id_registro_afectado: parseInt(id),
      descripcion: `Cambio de estado de cliente #${id} (${client.nombres}) a ${targetEstado}`,
      datos_nuevos: { estado: targetEstado }
    });

    return res.json({
      success: true,
      message: `Cliente ${targetEstado.toLowerCase()} correctamente`,
      cliente: client
    });
  }
});

// 6. DELETE /api/clientes/:id - Eliminar cliente permanentemente
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { id_usuario = 1 } = req.body || {};

  try {
    // Permitir desvincular ventas históricas si el cliente tenía facturas previas para no bloquear el borrado
    await pool.query('ALTER TABLE ventas ALTER COLUMN id_cliente DROP NOT NULL').catch(() => {});
    await pool.query('UPDATE ventas SET id_cliente = NULL WHERE id_cliente = $1', [id]).catch(() => {});

    const result = await pool.query(
      'DELETE FROM clientes WHERE id_cliente = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const deleted = result.rows[0];

    // Sincronizar también en memoria si existía
    const memIdx = clients.findIndex(c => c.id_cliente === parseInt(id, 10));
    if (memIdx !== -1) clients.splice(memIdx, 1);

    await registrarOperacion({
      id_usuario,
      operacion: 'ELIMINAR',
      tabla_afectada: 'clientes',
      id_registro_afectado: parseInt(id, 10),
      descripcion: `Eliminación definitiva de cliente #${id}: ${deleted.nombres} ${deleted.apellidos || ''} (${deleted.tipo_identificacion}: ${deleted.numero_identificacion})`,
      datos_anteriores: deleted
    });

    return res.json({
      success: true,
      message: `Cliente "${deleted.nombres}" eliminado correctamente`,
      cliente: deleted
    });
  } catch (err) {
    const idx = clients.findIndex(c => c.id_cliente === parseInt(id, 10));
    if (idx === -1) return res.status(404).json({ error: 'Cliente no encontrado' });

    const [deleted] = clients.splice(idx, 1);

    await registrarOperacion({
      id_usuario,
      operacion: 'ELIMINAR',
      tabla_afectada: 'clientes',
      id_registro_afectado: parseInt(id, 10),
      descripcion: `Eliminación definitiva de cliente #${id}: ${deleted.nombres} ${deleted.apellidos || ''}`,
      datos_anteriores: deleted
    });

    return res.json({
      success: true,
      message: `Cliente "${deleted.nombres}" eliminado correctamente`,
      cliente: deleted
    });
  }
});

module.exports = router;

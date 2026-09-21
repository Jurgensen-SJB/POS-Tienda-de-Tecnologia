const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { clients } = require('../db/fallbackData');
const { registrarOperacion } = require('./auditoria');

// 1. GET /api/clientes - Listar clientes con filtros opcionales
router.get('/', async (req, res) => {
  const { estado, q } = req.query;

  try {
    let query = 'SELECT * FROM clientes WHERE 1=1';
    const params = [];

    if (estado && estado.toUpperCase() !== 'TODOS') {
      params.push(estado.toUpperCase());
      query += ` AND estado = $${params.length}`;
    }

    if (q && q.trim()) {
      params.push(`%${q.trim().toLowerCase()}%`);
      query += ` AND (LOWER(nombres) LIKE $${params.length} OR LOWER(COALESCE(apellidos, '')) LIKE $${params.length} OR numero_identificacion LIKE $${params.length})`;
    }

    query += ' ORDER BY id_cliente ASC';

    const result = await pool.query(query, params);
    return res.json(result.rows);
  } catch (err) {
    // Fallback in-memory
    let filtered = [...clients];
    if (estado && estado.toUpperCase() !== 'TODOS') {
      filtered = filtered.filter(c => (c.estado || 'ACTIVO').toUpperCase() === estado.toUpperCase());
    }
    if (q && q.trim()) {
      const term = q.trim().toLowerCase();
      filtered = filtered.filter(c =>
        (c.nombres && c.nombres.toLowerCase().includes(term)) ||
        (c.apellidos && c.apellidos.toLowerCase().includes(term)) ||
        (c.numero_identificacion && c.numero_identificacion.includes(term))
      );
    }
    return res.json(filtered);
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
    estado = 'ACTIVO'
  } = req.body;

  if (!tipo_identificacion || !numero_identificacion || !nombres) {
    return res.status(400).json({ error: 'Tipo de identificación, número y nombres son obligatorios' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO clientes (tipo_identificacion, numero_identificacion, nombres, apellidos, telefono, correo, direccion, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        tipo_identificacion,
        numero_identificacion.trim(),
        nombres.trim(),
        apellidos ? apellidos.trim() : '',
        telefono ? telefono.trim() : '',
        correo ? correo.trim() : '',
        direccion ? direccion.trim() : '',
        estado.toUpperCase()
      ]
    );

    const newClient = result.rows[0];

    // Audit log
    await registrarOperacion({
      operacion: 'CREAR',
      tabla_afectada: 'clientes',
      id_registro_afectado: newClient.id_cliente,
      descripcion: `Registro de cliente ${newClient.nombres} ${newClient.apellidos || ''} (${newClient.tipo_identificacion}: ${newClient.numero_identificacion})`,
      datos_nuevos: newClient
    });

    return res.status(201).json(newClient);
  } catch (err) {
    const newClient = {
      id_cliente: clients.length > 0 ? Math.max(...clients.map(c => c.id_cliente)) + 1 : 1,
      tipo_identificacion,
      numero_identificacion: numero_identificacion.trim(),
      nombres: nombres.trim(),
      apellidos: apellidos ? apellidos.trim() : '',
      telefono: telefono ? telefono.trim() : '',
      correo: correo ? correo.trim() : '',
      direccion: direccion ? direccion.trim() : '',
      estado: estado.toUpperCase()
    };

    clients.push(newClient);

    // Audit log
    await registrarOperacion({
      operacion: 'CREAR',
      tabla_afectada: 'clientes',
      id_registro_afectado: newClient.id_cliente,
      descripcion: `Registro de cliente ${newClient.nombres} ${newClient.apellidos || ''} (${newClient.tipo_identificacion}: ${newClient.numero_identificacion})`,
      datos_nuevos: newClient
    });

    return res.status(201).json(newClient);
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
    estado
  } = req.body;

  if (!nombres) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }

  try {
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
           fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id_cliente = $9
       RETURNING *`,
      [
        tipo_identificacion,
        numero_identificacion ? numero_identificacion.trim() : null,
        nombres.trim(),
        apellidos ? apellidos.trim() : '',
        telefono ? telefono.trim() : '',
        correo ? correo.trim() : '',
        direccion ? direccion.trim() : '',
        estado ? estado.toUpperCase() : null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const updated = result.rows[0];

    // Audit log
    await registrarOperacion({
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
    clients[idx] = {
      ...clients[idx],
      ...(tipo_identificacion && { tipo_identificacion }),
      ...(numero_identificacion && { numero_identificacion: numero_identificacion.trim() }),
      nombres: nombres.trim(),
      ...(apellidos !== undefined && { apellidos: apellidos.trim() }),
      ...(telefono !== undefined && { telefono: telefono.trim() }),
      ...(correo !== undefined && { correo: correo.trim() }),
      ...(direccion !== undefined && { direccion: direccion.trim() }),
      ...(estado && { estado: estado.toUpperCase() })
    };

    // Audit log
    await registrarOperacion({
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
  const { estado } = req.body;

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

module.exports = router;

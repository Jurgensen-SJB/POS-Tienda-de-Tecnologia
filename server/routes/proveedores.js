const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { providers } = require('../db/fallbackData');
const { registrarOperacion } = require('./auditoria');

// 1. GET /api/proveedores - Listar con filtros opcionales
router.get('/', async (req, res) => {
  const { estado, q } = req.query;
  try {
    let query = 'SELECT * FROM proveedores WHERE 1=1';
    const params = [];

    if (estado && estado.toUpperCase() !== 'TODOS') {
      params.push(estado.toUpperCase());
      query += ` AND estado = $${params.length}`;
    }

    if (q && q.trim()) {
      params.push(`%${q.trim().toLowerCase()}%`);
      query += ` AND (LOWER(nombre) LIKE $${params.length} OR LOWER(identificacion) LIKE $${params.length} OR LOWER(correo) LIKE $${params.length})`;
    }

    query += ' ORDER BY id_proveedor ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    let filtered = [...providers];
    if (estado && estado.toUpperCase() !== 'TODOS') {
      filtered = filtered.filter(p => (p.estado || 'ACTIVO').toUpperCase() === estado.toUpperCase());
    }
    if (q && q.trim()) {
      const term = q.trim().toLowerCase();
      filtered = filtered.filter(p =>
        (p.nombre && p.nombre.toLowerCase().includes(term)) ||
        (p.identificacion && p.identificacion.toLowerCase().includes(term))
      );
    }
    res.json(filtered);
  }
});

// 2. GET /api/proveedores/:id - Consultar proveedor
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM proveedores WHERE id_proveedor = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Proveedor no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    const prov = providers.find(p => p.id_proveedor === parseInt(id));
    if (!prov) return res.status(404).json({ error: 'Proveedor no encontrado' });
    res.json(prov);
  }
});

// 3. POST /api/proveedores - Registrar proveedor
router.post('/', async (req, res) => {
  const { nombre, identificacion, telefono, correo, direccion, id_usuario = 1 } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre del proveedor es requerido' });

  try {
    const result = await pool.query(
      `INSERT INTO proveedores (nombre, identificacion, telefono, correo, direccion)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nombre.trim(), identificacion || '', telefono || '', correo || '', direccion || '']
    );
    const newProv = result.rows[0];

    await registrarOperacion({
      id_usuario,
      operacion: 'CREAR',
      tabla_afectada: 'proveedores',
      id_registro_afectado: newProv.id_proveedor,
      descripcion: `Registro de proveedor: ${newProv.nombre} (${newProv.identificacion || 'Sin RUC'})`,
      datos_nuevos: newProv
    });

    res.status(201).json(newProv);
  } catch (err) {
    const newProv = {
      id_proveedor: providers.length > 0 ? Math.max(...providers.map(p => p.id_proveedor)) + 1 : 1,
      nombre: nombre.trim(), identificacion: identificacion || '',
      telefono: telefono || '', correo: correo || '', direccion: direccion || '', estado: 'ACTIVO'
    };
    providers.push(newProv);
    res.status(201).json(newProv);
  }
});

// 4. PUT /api/proveedores/:id - Modificar proveedor
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, identificacion, telefono, correo, direccion, id_usuario = 1 } = req.body;

  try {
    const result = await pool.query(
      `UPDATE proveedores
       SET nombre = COALESCE($1, nombre),
           identificacion = COALESCE($2, identificacion),
           telefono = COALESCE($3, telefono),
           correo = COALESCE($4, correo),
           direccion = COALESCE($5, direccion),
           fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id_proveedor = $6 RETURNING *`,
      [
        nombre ? nombre.trim() : null,
        identificacion !== undefined ? identificacion : null,
        telefono !== undefined ? telefono : null,
        correo !== undefined ? correo : null,
        direccion !== undefined ? direccion : null,
        parseInt(id)
      ]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Proveedor no encontrado' });
    const updated = result.rows[0];

    await registrarOperacion({
      id_usuario,
      operacion: 'MODIFICAR',
      tabla_afectada: 'proveedores',
      id_registro_afectado: parseInt(id),
      descripcion: `Modificación de datos del proveedor #${id}: ${updated.nombre}`,
      datos_nuevos: updated
    });

    res.json(updated);
  } catch (err) {
    const prov = providers.find(p => p.id_proveedor === parseInt(id));
    if (!prov) return res.status(404).json({ error: 'Proveedor no encontrado' });
    if (nombre) prov.nombre = nombre.trim();
    if (identificacion !== undefined) prov.identificacion = identificacion;
    if (telefono !== undefined) prov.telefono = telefono;
    if (correo !== undefined) prov.correo = correo;
    if (direccion !== undefined) prov.direccion = direccion;
    res.json(prov);
  }
});

// 5. PATCH /api/proveedores/:id/estado - Activar/Desactivar
router.patch('/:id/estado', async (req, res) => {
  const { id } = req.params;
  const { estado, id_usuario = 1 } = req.body;
  const nuevoEstado = estado ? estado.toUpperCase() : null;

  if (!nuevoEstado || !['ACTIVO', 'INACTIVO'].includes(nuevoEstado)) {
    return res.status(400).json({ error: 'Estado inválido. Debe ser ACTIVO o INACTIVO' });
  }

  try {
    const result = await pool.query(
      `UPDATE proveedores SET estado = $1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_proveedor = $2 RETURNING *`,
      [nuevoEstado, parseInt(id)]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Proveedor no encontrado' });
    const updated = result.rows[0];

    await registrarOperacion({
      id_usuario,
      operacion: nuevoEstado === 'INACTIVO' ? 'DESACTIVAR' : 'ACTIVAR',
      tabla_afectada: 'proveedores',
      id_registro_afectado: parseInt(id),
      descripcion: `Proveedor #${id} ${updated.nombre} cambiado a estado ${nuevoEstado}`,
      datos_nuevos: updated
    });

    res.json(updated);
  } catch (err) {
    const prov = providers.find(p => p.id_proveedor === parseInt(id));
    if (!prov) return res.status(404).json({ error: 'Proveedor no encontrado' });
    prov.estado = nuevoEstado;
    res.json(prov);
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { registrarOperacion } = require('./auditoria');

// Fallback payment methods if database is disconnected
const fallbackPaymentMethods = [
  { id_forma_pago: 1, nombre: 'Efectivo', descripcion: 'Pago en efectivo con cálculo de cambio', estado: 'ACTIVO' },
  { id_forma_pago: 2, nombre: 'Tarjeta POS', descripcion: 'Tarjeta de débito o crédito / Terminal POS', estado: 'ACTIVO' },
  { id_forma_pago: 3, nombre: 'QR / Transferencia', descripcion: 'Transferencia bancaria o billetera digital', estado: 'ACTIVO' }
];

// 1. GET /api/formas-pago - List all payment methods
router.get('/', async (req, res) => {
  const { estado } = req.query;
  try {
    let query = 'SELECT * FROM formas_pago';
    const params = [];
    if (estado && estado.toUpperCase() !== 'TODOS') {
      params.push(estado.toUpperCase());
      query += ' WHERE estado = $1';
    }
    query += ' ORDER BY id_forma_pago ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    let list = [...fallbackPaymentMethods];
    if (estado && estado.toUpperCase() !== 'TODOS') {
      list = list.filter(fp => fp.estado === estado.toUpperCase());
    }
    res.json(list);
  }
});

// 2. GET /api/formas-pago/:id - Get single payment method
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM formas_pago WHERE id_forma_pago = $1', [parseInt(id)]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Forma de pago no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    const fp = fallbackPaymentMethods.find(f => f.id_forma_pago === parseInt(id));
    if (!fp) return res.status(404).json({ error: 'Forma de pago no encontrada' });
    res.json(fp);
  }
});

// 3. POST /api/formas-pago - Create new payment method
router.post('/', async (req, res) => {
  const { nombre, descripcion, estado = 'ACTIVO', id_usuario = 1 } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del método de pago es obligatorio' });
  }

  try {
    const checkRes = await pool.query('SELECT * FROM formas_pago WHERE LOWER(nombre) = LOWER($1)', [nombre.trim()]);
    if (checkRes.rows.length > 0) {
      return res.status(409).json({ error: `La forma de pago "${nombre}" ya existe` });
    }

    const insertRes = await pool.query(
      `INSERT INTO formas_pago (nombre, descripcion, estado)
       VALUES ($1, $2, $3) RETURNING *`,
      [nombre.trim(), descripcion?.trim() || null, estado.toUpperCase()]
    );
    const newFp = insertRes.rows[0];

    await registrarOperacion({
      id_usuario,
      operacion: 'CREAR',
      tabla_afectada: 'formas_pago',
      id_registro_afectado: newFp.id_forma_pago,
      descripcion: `Creación de método de pago: ${newFp.nombre}`,
      datos_nuevos: newFp
    });

    res.status(201).json(newFp);
  } catch (err) {
    const newId = fallbackPaymentMethods.length + 1;
    const item = { id_forma_pago: newId, nombre: nombre.trim(), descripcion: descripcion?.trim() || '', estado: estado.toUpperCase() };
    fallbackPaymentMethods.push(item);
    res.status(201).json(item);
  }
});

// 4. PUT /api/formas-pago/:id - Update payment method
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, estado, id_usuario = 1 } = req.body;

  try {
    const updateRes = await pool.query(
      `UPDATE formas_pago
       SET nombre = COALESCE($1, nombre),
           descripcion = COALESCE($2, descripcion),
           estado = COALESCE($3, estado)
       WHERE id_forma_pago = $4
       RETURNING *`,
      [nombre?.trim(), descripcion?.trim(), estado?.toUpperCase(), parseInt(id)]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'Forma de pago no encontrada' });
    }

    const updated = updateRes.rows[0];
    await registrarOperacion({
      id_usuario,
      operacion: 'EDITAR',
      tabla_afectada: 'formas_pago',
      id_registro_afectado: updated.id_forma_pago,
      descripcion: `Actualización de método de pago: ${updated.nombre}`,
      datos_nuevos: updated
    });

    res.json(updated);
  } catch (err) {
    const idx = fallbackPaymentMethods.findIndex(f => f.id_forma_pago === parseInt(id));
    if (idx === -1) return res.status(404).json({ error: 'Forma de pago no encontrada' });
    fallbackPaymentMethods[idx] = {
      ...fallbackPaymentMethods[idx],
      ...(nombre ? { nombre: nombre.trim() } : {}),
      ...(descripcion !== undefined ? { descripcion: descripcion.trim() } : {}),
      ...(estado ? { estado: estado.toUpperCase() } : {})
    };
    res.json(fallbackPaymentMethods[idx]);
  }
});

// 5. PATCH /api/formas-pago/:id/estado - Toggle active / inactive
router.patch('/:id/estado', async (req, res) => {
  const { id } = req.params;
  const { estado, id_usuario = 1 } = req.body;

  if (!estado || !['ACTIVO', 'INACTIVO'].includes(estado.toUpperCase())) {
    return res.status(400).json({ error: 'Estado debe ser ACTIVO o INACTIVO' });
  }

  try {
    const result = await pool.query(
      'UPDATE formas_pago SET estado = $1 WHERE id_forma_pago = $2 RETURNING *',
      [estado.toUpperCase(), parseInt(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Forma de pago no encontrada' });
    }

    const updated = result.rows[0];
    await registrarOperacion({
      id_usuario,
      operacion: 'CAMBIO_ESTADO',
      tabla_afectada: 'formas_pago',
      id_registro_afectado: updated.id_forma_pago,
      descripcion: `Cambio de estado método de pago ${updated.nombre} a ${updated.estado}`,
      datos_nuevos: { estado: updated.estado }
    });

    res.json(updated);
  } catch (err) {
    const fp = fallbackPaymentMethods.find(f => f.id_forma_pago === parseInt(id));
    if (!fp) return res.status(404).json({ error: 'Forma de pago no encontrada' });
    fp.estado = estado.toUpperCase();
    res.json(fp);
  }
});

module.exports = router;

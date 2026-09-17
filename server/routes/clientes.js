const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { clients } = require('../db/fallbackData');

// GET /api/clientes
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clientes WHERE estado = $1 ORDER BY id_cliente ASC', ['ACTIVO']);
    res.json(result.rows);
  } catch (err) {
    res.json(clients);
  }
});

// POST /api/clientes
router.post('/', async (req, res) => {
  const { tipo_identificacion, numero_identificacion, nombres, apellidos, telefono, correo, direccion } = req.body;

  if (!tipo_identificacion || !numero_identificacion || !nombres) {
    return res.status(400).json({ error: 'Tipo de doc, número y nombres son requeridos' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO clientes (tipo_identificacion, numero_identificacion, nombres, apellidos, telefono, correo, direccion)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [tipo_identificacion, numero_identificacion, nombres, apellidos || '', telefono || '', correo || '', direccion || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    const newClient = {
      id_cliente: clients.length + 1,
      tipo_identificacion,
      numero_identificacion,
      nombres,
      apellidos: apellidos || '',
      telefono: telefono || '',
      correo: correo || '',
      direccion: direccion || ''
    };
    clients.push(newClient);
    res.status(201).json(newClient);
  }
});

module.exports = router;

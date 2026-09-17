const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { providers } = require('../db/fallbackData');

// GET /api/proveedores
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM proveedores WHERE estado = $1 ORDER BY id_proveedor ASC', ['ACTIVO']);
    res.json(result.rows);
  } catch (err) {
    res.json(providers);
  }
});

// POST /api/proveedores
router.post('/', async (req, res) => {
  const { nombre, identificacion, telefono, correo, direccion } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre es requerido' });

  try {
    const result = await pool.query(
      `INSERT INTO proveedores (nombre, identificacion, telefono, correo, direccion)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nombre, identificacion || '', telefono || '', correo || '', direccion || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    const newProv = { id_proveedor: providers.length + 1, nombre, identificacion, telefono, correo, direccion, estado: 'ACTIVO' };
    providers.push(newProv);
    res.status(201).json(newProv);
  }
});

module.exports = router;

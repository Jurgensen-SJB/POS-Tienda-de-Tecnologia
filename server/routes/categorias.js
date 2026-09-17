const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { categories } = require('../db/fallbackData');

// GET /api/categorias
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categorias WHERE estado = $1 ORDER BY id_categoria ASC', ['ACTIVO']);
    res.json(result.rows);
  } catch (err) {
    // Fallback in-memory
    res.json(categories);
  }
});

// POST /api/categorias
router.post('/', async (req, res) => {
  const { nombre, descripcion } = req.body;
  if (!nombre) {
    return res.status(400).json({ error: 'Nombre es requerido' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO categorias (nombre, descripcion) VALUES ($1, $2) RETURNING *',
      [nombre, descripcion || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    const newCat = { id_categoria: categories.length + 1, nombre, descripcion };
    categories.push(newCat);
    res.status(201).json(newCat);
  }
});

module.exports = router;

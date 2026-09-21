const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { categories } = require('../db/fallbackData');
const { registrarOperacion } = require('./auditoria');

// 1. GET /api/categorias - Listar categorías con conteo de productos y filtros
router.get('/', async (req, res) => {
  const { estado, q } = req.query;
  try {
    let query = `
      SELECT c.*, COUNT(p.id_producto)::int as total_productos
      FROM categorias c
      LEFT JOIN productos p ON p.id_categoria = c.id_categoria
      WHERE 1=1
    `;
    const params = [];

    if (estado && estado.toUpperCase() !== 'TODOS') {
      params.push(estado.toUpperCase());
      query += ` AND c.estado = $${params.length}`;
    }

    if (q && q.trim()) {
      params.push(`%${q.trim().toLowerCase()}%`);
      query += ` AND (LOWER(c.nombre) LIKE $${params.length} OR LOWER(c.descripcion) LIKE $${params.length})`;
    }

    query += ' GROUP BY c.id_categoria ORDER BY c.id_categoria ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    let filtered = [...categories];
    if (estado && estado.toUpperCase() !== 'TODOS') {
      filtered = filtered.filter(c => (c.estado || 'ACTIVO').toUpperCase() === estado.toUpperCase());
    }
    if (q && q.trim()) {
      const term = q.trim().toLowerCase();
      filtered = filtered.filter(c =>
        (c.nombre && c.nombre.toLowerCase().includes(term)) ||
        (c.descripcion && c.descripcion.toLowerCase().includes(term))
      );
    }
    res.json(filtered.map(c => ({ ...c, total_productos: 0 })));
  }
});

// 2. GET /api/categorias/:id - Consultar categoría específica
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT c.*, COUNT(p.id_producto)::int as total_productos
       FROM categorias c
       LEFT JOIN productos p ON p.id_categoria = c.id_categoria
       WHERE c.id_categoria = $1
       GROUP BY c.id_categoria`,
      [parseInt(id)]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    const cat = categories.find(c => c.id_categoria === parseInt(id));
    if (!cat) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json({ ...cat, total_productos: 0 });
  }
});

// 3. POST /api/categorias - Registrar categoría
router.post('/', async (req, res) => {
  const { nombre, descripcion } = req.body;
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre de la categoría es requerido' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO categorias (nombre, descripcion) VALUES ($1, $2) RETURNING *',
      [nombre.trim(), descripcion ? descripcion.trim() : '']
    );
    const newCat = result.rows[0];

    await registrarOperacion({
      operacion: 'CREAR',
      tabla_afectada: 'categorias',
      id_registro_afectado: newCat.id_categoria,
      descripcion: `Creación de categoría: ${newCat.nombre}`,
      datos_nuevos: newCat
    });

    res.status(201).json({ ...newCat, total_productos: 0 });
  } catch (err) {
    const newCat = {
      id_categoria: categories.length > 0 ? Math.max(...categories.map(c => c.id_categoria)) + 1 : 1,
      nombre: nombre.trim(),
      descripcion: descripcion || '',
      estado: 'ACTIVO',
      total_productos: 0
    };
    categories.push(newCat);
    res.status(201).json(newCat);
  }
});

// 4. PUT /api/categorias/:id - Modificar categoría
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre de la categoría es requerido' });
  }

  try {
    const result = await pool.query(
      `UPDATE categorias
       SET nombre = $1,
           descripcion = COALESCE($2, descripcion)
       WHERE id_categoria = $3 RETURNING *`,
      [nombre.trim(), descripcion !== undefined ? descripcion.trim() : null, parseInt(id)]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Categoría no encontrada' });
    const updated = result.rows[0];

    await registrarOperacion({
      operacion: 'MODIFICAR',
      tabla_afectada: 'categorias',
      id_registro_afectado: parseInt(id),
      descripcion: `Modificación de categoría #${id}: ${updated.nombre}`,
      datos_nuevos: updated
    });

    res.json(updated);
  } catch (err) {
    const cat = categories.find(c => c.id_categoria === parseInt(id));
    if (!cat) return res.status(404).json({ error: 'Categoría no encontrada' });
    cat.nombre = nombre.trim();
    if (descripcion !== undefined) cat.descripcion = descripcion;
    res.json(cat);
  }
});

// 5. PATCH /api/categorias/:id/estado - Desactivar / Activar categoría
router.patch('/:id/estado', async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  const nuevoEstado = estado ? estado.toUpperCase() : null;

  if (!nuevoEstado || !['ACTIVO', 'INACTIVO'].includes(nuevoEstado)) {
    return res.status(400).json({ error: 'Estado inválido. Debe ser ACTIVO o INACTIVO' });
  }

  try {
    const result = await pool.query(
      'UPDATE categorias SET estado = $1 WHERE id_categoria = $2 RETURNING *',
      [nuevoEstado, parseInt(id)]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Categoría no encontrada' });
    const updated = result.rows[0];

    await registrarOperacion({
      operacion: nuevoEstado === 'INACTIVO' ? 'DESACTIVAR' : 'ACTIVAR',
      tabla_afectada: 'categorias',
      id_registro_afectado: parseInt(id),
      descripcion: `Categoría #${id} "${updated.nombre}" cambiada a estado ${nuevoEstado}`,
      datos_nuevos: updated
    });

    res.json(updated);
  } catch (err) {
    const cat = categories.find(c => c.id_categoria === parseInt(id));
    if (!cat) return res.status(404).json({ error: 'Categoría no encontrada' });
    cat.estado = nuevoEstado;
    res.json(cat);
  }
});

module.exports = router;


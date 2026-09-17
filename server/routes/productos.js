const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { products, categories } = require('../db/fallbackData');

// GET /api/productos - List all products with category name and current stock
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id_producto,
        p.codigo,
        p.nombre,
        p.descripcion,
        p.precio_venta,
        p.stock_minimo,
        p.id_categoria,
        p.imagen_url,
        p.estado,
        c.nombre AS categoria_nombre,
        COALESCE(i.cantidad_actual, 0) AS stock
      FROM productos p
      LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
      LEFT JOIN inventario i ON p.id_producto = i.id_producto
      WHERE p.estado = 'ACTIVO'
      ORDER BY p.id_producto ASC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.json(products);
  }
});

// GET /api/productos/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT 
        p.*,
        c.nombre AS categoria_nombre,
        COALESCE(i.cantidad_actual, 0) AS stock
      FROM productos p
      LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
      LEFT JOIN inventario i ON p.id_producto = i.id_producto
      WHERE p.id_producto = $1
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    const prod = products.find(p => p.id_producto === parseInt(id) || p.codigo === id);
    if (!prod) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(prod);
  }
});

// POST /api/productos - Create product
router.post('/', async (req, res) => {
  const { codigo, nombre, descripcion, precio_venta, stock_minimo, id_categoria, imagen_url, stock_inicial } = req.body;
  
  if (!codigo || !nombre || !precio_venta || !id_categoria) {
    return res.status(400).json({ error: 'Faltan campos obligatorios (código, nombre, precio, categoría)' });
  }

  const client = await pool.connect().catch(() => null);
  if (client) {
    try {
      await client.query('BEGIN');
      const prodRes = await client.query(
        `INSERT INTO productos (codigo, nombre, descripcion, precio_venta, stock_minimo, id_categoria, imagen_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [codigo, nombre, descripcion || '', parseFloat(precio_venta), parseInt(stock_minimo || 5), parseInt(id_categoria), imagen_url || '']
      );
      const newProduct = prodRes.rows[0];

      const initialStock = parseInt(stock_inicial || 0);
      await client.query(
        `INSERT INTO inventario (id_producto, cantidad_actual) VALUES ($1, $2)`,
        [newProduct.id_producto, initialStock]
      );

      await client.query('COMMIT');
      newProduct.stock = initialStock;
      return res.status(201).json(newProduct);
    } catch (dbErr) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('DB error creating product:', dbErr.message);
    } finally {
      client.release();
    }
  }

  // Fallback
  const cat = categories.find(c => c.id_categoria === parseInt(id_categoria));
  const newProduct = {
    id_producto: products.length + 1,
    codigo,
    nombre,
    descripcion: descripcion || '',
    precio_venta: parseFloat(precio_venta),
    stock_minimo: parseInt(stock_minimo || 5),
    id_categoria: parseInt(id_categoria),
    categoria_nombre: cat ? cat.nombre : 'General',
    imagen_url: imagen_url || 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=360&auto=format&fit=crop&q=80',
    stock: parseInt(stock_inicial || 0),
    estado: 'ACTIVO'
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// PUT /api/productos/:id - Update product
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, precio_venta, id_categoria, stock_minimo, imagen_url, stock } = req.body;

  try {
    await pool.query(
      `UPDATE productos 
       SET nombre = COALESCE($1, nombre),
           precio_venta = COALESCE($2, precio_venta),
           id_categoria = COALESCE($3, id_categoria),
           stock_minimo = COALESCE($4, stock_minimo),
           imagen_url = COALESCE($5, imagen_url),
           fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id_producto = $6`,
      [nombre, precio_venta, id_categoria, stock_minimo, imagen_url, id]
    );

    if (stock !== undefined) {
      await pool.query(
        `UPDATE inventario SET cantidad_actual = $1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_producto = $2`,
        [stock, id]
      );
    }

    const updated = await pool.query(
      `SELECT p.*, c.nombre AS categoria_nombre, COALESCE(i.cantidad_actual, 0) AS stock
       FROM productos p
       LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
       LEFT JOIN inventario i ON p.id_producto = i.id_producto
       WHERE p.id_producto = $1`,
      [id]
    );

    res.json(updated.rows[0] || { message: 'Producto actualizado exitosamente' });
  } catch (err) {
    const prod = products.find(p => p.id_producto === parseInt(id));
    if (prod) {
      if (nombre) prod.nombre = nombre;
      if (precio_venta !== undefined) prod.precio_venta = parseFloat(precio_venta);
      if (id_categoria) {
        prod.id_categoria = parseInt(id_categoria);
        const cat = categories.find(c => c.id_categoria === parseInt(id_categoria));
        if (cat) prod.categoria_nombre = cat.nombre;
      }
      if (stock !== undefined) prod.stock = parseInt(stock);
      if (stock_minimo !== undefined) prod.stock_minimo = parseInt(stock_minimo);
      if (imagen_url) prod.imagen_url = imagen_url;
      return res.json(prod);
    }
    res.status(404).json({ error: 'Producto no encontrado' });
  }
});

// DELETE /api/productos/:id - Soft delete (deactivate) or remove product
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Soft delete so historical invoices remain valid
    await pool.query("UPDATE productos SET estado = 'INACTIVO' WHERE id_producto = $1", [id]);
    res.json({ message: 'Producto eliminado exitosamente', id_producto: parseInt(id) });
  } catch (err) {
    const index = products.findIndex(p => p.id_producto === parseInt(id));
    if (index !== -1) {
      products.splice(index, 1);
      return res.json({ message: 'Producto eliminado exitosamente', id_producto: parseInt(id) });
    }
    res.status(404).json({ error: 'Producto no encontrado' });
  }
});

module.exports = router;

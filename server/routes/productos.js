const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { products, categories } = require('../db/fallbackData');
const { registrarOperacion } = require('./auditoria');

// 1. GET /api/productos - List all products with category name and stock
router.get('/', async (req, res) => {
  const { estado, q } = req.query;

  try {
    let query = `
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
      WHERE 1=1
    `;
    const params = [];

    if (estado && estado.toUpperCase() !== 'TODOS') {
      params.push(estado.toUpperCase());
      query += ` AND p.estado = $${params.length}`;
    }

    if (q && q.trim()) {
      params.push(`%${q.trim().toLowerCase()}%`);
      query += ` AND (LOWER(p.nombre) LIKE $${params.length} OR LOWER(p.codigo) LIKE $${params.length} OR LOWER(c.nombre) LIKE $${params.length})`;
    }

    query += ' ORDER BY p.id_producto ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    // Fallback in-memory
    let filtered = [...products];
    if (estado && estado.toUpperCase() !== 'TODOS') {
      filtered = filtered.filter(p => (p.estado || 'ACTIVO').toUpperCase() === estado.toUpperCase());
    }
    if (q && q.trim()) {
      const term = q.trim().toLowerCase();
      filtered = filtered.filter(p =>
        (p.nombre && p.nombre.toLowerCase().includes(term)) ||
        (p.codigo && p.codigo.toLowerCase().includes(term)) ||
        (p.categoria_nombre && p.categoria_nombre.toLowerCase().includes(term))
      );
    }
    res.json(filtered);
  }
});

// 2. GET /api/productos/:id - Consultar producto específico
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

// 3. POST /api/productos - Registrar producto
router.post('/', async (req, res) => {
  const {
    codigo,
    nombre,
    descripcion,
    precio_venta,
    stock_minimo,
    id_categoria,
    imagen_url,
    stock_inicial,
    costo,
    estado = 'ACTIVO'
  } = req.body;
  
  if (!codigo || !nombre || !precio_venta || !id_categoria) {
    return res.status(400).json({ error: 'Faltan campos obligatorios (código, nombre, precio, categoría)' });
  }

  const client = await pool.connect().catch(() => null);
  if (client) {
    try {
      await client.query('BEGIN');
      const prodRes = await client.query(
        `INSERT INTO productos (codigo, nombre, descripcion, precio_venta, stock_minimo, id_categoria, imagen_url, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          codigo.trim(),
          nombre.trim(),
          descripcion || '',
          parseFloat(precio_venta),
          parseInt(stock_minimo || 5),
          parseInt(id_categoria),
          imagen_url || '',
          estado.toUpperCase()
        ]
      );
      const newProduct = prodRes.rows[0];

      const initialStock = parseInt(stock_inicial || 0);
      await client.query(
        `INSERT INTO inventario (id_producto, cantidad_actual) VALUES ($1, $2)`,
        [newProduct.id_producto, initialStock]
      );

      await client.query('COMMIT');
      newProduct.stock = initialStock;

      // Audit log
      await registrarOperacion({
        operacion: 'CREAR',
        tabla_afectada: 'productos',
        id_registro_afectado: newProduct.id_producto,
        descripcion: `Registro de producto ${newProduct.nombre} (${newProduct.codigo}) a $${parseFloat(newProduct.precio_venta).toFixed(2)}`,
        datos_nuevos: newProduct
      });

      return res.status(201).json(newProduct);
    } catch (dbErr) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('DB error creating product:', dbErr.message);
    } finally {
      client.release();
    }
  }

  // Fallback in-memory
  const cat = categories.find(c => c.id_categoria === parseInt(id_categoria));
  const newProduct = {
    id_producto: products.length > 0 ? Math.max(...products.map(p => p.id_producto)) + 1 : 1,
    codigo: codigo.trim(),
    nombre: nombre.trim(),
    descripcion: descripcion || '',
    precio_venta: parseFloat(precio_venta),
    costo: parseFloat(costo || 0),
    stock_minimo: parseInt(stock_minimo || 5),
    id_categoria: parseInt(id_categoria),
    categoria_nombre: cat ? cat.nombre : 'General',
    imagen_url: imagen_url || 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=360&auto=format&fit=crop&q=80',
    stock: parseInt(stock_inicial || 0),
    estado: estado.toUpperCase()
  };

  products.push(newProduct);

  // Audit log
  await registrarOperacion({
    operacion: 'CREAR',
    tabla_afectada: 'productos',
    id_registro_afectado: newProduct.id_producto,
    descripcion: `Registro de producto ${newProduct.nombre} (${newProduct.codigo}) a $${parseFloat(newProduct.precio_venta).toFixed(2)}`,
    datos_nuevos: newProduct
  });

  res.status(201).json(newProduct);
});

// 4. PUT /api/productos/:id - Modificar producto
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, precio_venta, id_categoria, stock_minimo, imagen_url, stock, descripcion, costo, estado } = req.body;

  try {
    await pool.query(
      `UPDATE productos 
       SET nombre = COALESCE($1, nombre),
           precio_venta = COALESCE($2, precio_venta),
           id_categoria = COALESCE($3, id_categoria),
           stock_minimo = COALESCE($4, stock_minimo),
           imagen_url = COALESCE($5, imagen_url),
           descripcion = COALESCE($6, descripcion),
           estado = COALESCE($7, estado),
           fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id_producto = $8`,
      [
        nombre ? nombre.trim() : null,
        precio_venta !== undefined && precio_venta !== null ? parseFloat(precio_venta) : null,
        id_categoria ? parseInt(id_categoria) : null,
        stock_minimo !== undefined && stock_minimo !== null ? parseInt(stock_minimo) : null,
        imagen_url !== undefined ? imagen_url : null,
        descripcion !== undefined ? descripcion : null,
        estado ? estado.toUpperCase() : null,
        parseInt(id)
      ]
    );

    if (stock !== undefined) {
      await pool.query(
        `UPDATE inventario SET cantidad_actual = $1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_producto = $2`,
        [parseInt(stock), id]
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

    const resultProd = updated.rows[0] || { id_producto: parseInt(id), nombre };

    // Audit log
    await registrarOperacion({
      operacion: 'MODIFICAR',
      tabla_afectada: 'productos',
      id_registro_afectado: parseInt(id),
      descripcion: `Modificación de datos de producto #${id}: ${resultProd.nombre || nombre}`,
      datos_nuevos: resultProd
    });

    res.json(resultProd);
  } catch (err) {
    const prod = products.find(p => p.id_producto === parseInt(id));
    if (prod) {
      const prev = { ...prod };
      if (nombre) prod.nombre = nombre.trim();
      if (precio_venta !== undefined) prod.precio_venta = parseFloat(precio_venta);
      if (id_categoria) {
        prod.id_categoria = parseInt(id_categoria);
        const cat = categories.find(c => c.id_categoria === parseInt(id_categoria));
        if (cat) prod.categoria_nombre = cat.nombre;
      }
      if (stock !== undefined) prod.stock = parseInt(stock);
      if (stock_minimo !== undefined) prod.stock_minimo = parseInt(stock_minimo);
      if (imagen_url) prod.imagen_url = imagen_url;
      if (descripcion !== undefined) prod.descripcion = descripcion;
      if (costo !== undefined) prod.costo = parseFloat(costo);
      if (estado) prod.estado = estado.toUpperCase();

      // Audit log
      await registrarOperacion({
        operacion: 'MODIFICAR',
        tabla_afectada: 'productos',
        id_registro_afectado: parseInt(id),
        descripcion: `Modificación de datos de producto #${id}: ${prod.nombre}`,
        datos_anteriores: prev,
        datos_nuevos: prod
      });

      return res.json(prod);
    }
    res.status(404).json({ error: 'Producto no encontrado' });
  }
});

// 5. PATCH /api/productos/:id/estado - Desactivar / Activar producto
router.patch('/:id/estado', async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  if (!estado || !['ACTIVO', 'INACTIVO'].includes(estado.toUpperCase())) {
    return res.status(400).json({ error: 'Estado debe ser ACTIVO o INACTIVO' });
  }

  const targetEstado = estado.toUpperCase();

  try {
    const result = await pool.query(
      `UPDATE productos SET estado = $1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_producto = $2 RETURNING *`,
      [targetEstado, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const updated = result.rows[0];

    // Audit log
    await registrarOperacion({
      operacion: targetEstado === 'ACTIVO' ? 'MODIFICAR' : 'DESACTIVAR',
      tabla_afectada: 'productos',
      id_registro_afectado: parseInt(id),
      descripcion: `Cambio de estado de producto #${id} (${updated.nombre}) a ${targetEstado}`,
      datos_nuevos: { estado: targetEstado }
    });

    return res.json({
      success: true,
      message: `Producto ${targetEstado.toLowerCase()} exitosamente`,
      producto: updated
    });
  } catch (err) {
    const prod = products.find(p => p.id_producto === parseInt(id));
    if (!prod) return res.status(404).json({ error: 'Producto no encontrado' });

    prod.estado = targetEstado;

    // Audit log
    await registrarOperacion({
      operacion: targetEstado === 'ACTIVO' ? 'MODIFICAR' : 'DESACTIVAR',
      tabla_afectada: 'productos',
      id_registro_afectado: parseInt(id),
      descripcion: `Cambio de estado de producto #${id} (${prod.nombre}) a ${targetEstado}`,
      datos_nuevos: { estado: targetEstado }
    });

    return res.json({
      success: true,
      message: `Producto ${targetEstado.toLowerCase()} exitosamente`,
      producto: prod
    });
  }
});

// 6. DELETE /api/productos/:id - Soft delete (desactivar)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE productos SET estado = 'INACTIVO', fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_producto = $1", [id]);
    await registrarOperacion({
      operacion: 'DESACTIVAR',
      tabla_afectada: 'productos',
      id_registro_afectado: parseInt(id),
      descripcion: `Desactivación de producto #${id}`,
      datos_nuevos: { estado: 'INACTIVO' }
    });
    res.json({ message: 'Producto desactivado exitosamente', id_producto: parseInt(id) });
  } catch (err) {
    const prod = products.find(p => p.id_producto === parseInt(id));
    if (prod) {
      prod.estado = 'INACTIVO';
      await registrarOperacion({
        operacion: 'DESACTIVAR',
        tabla_afectada: 'productos',
        id_registro_afectado: parseInt(id),
        descripcion: `Desactivación de producto #${id} (${prod.nombre})`,
        datos_nuevos: { estado: 'INACTIVO' }
      });
      return res.json({ message: 'Producto desactivado exitosamente', id_producto: parseInt(id) });
    }
    res.status(404).json({ error: 'Producto no encontrado' });
  }
});

module.exports = router;

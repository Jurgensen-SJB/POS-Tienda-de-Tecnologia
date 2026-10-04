const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { products } = require('../db/fallbackData');
const { registrarOperacion } = require('./auditoria');

// Movimientos en memoria para modo offline / fallback
const movimientosFallback = [
  {
    id_movimiento: 1,
    id_producto: 1,
    producto_nombre: 'iPhone 15 Pro 256GB',
    codigo_sku: 'TEK-A001',
    categoria: 'Smartphones',
    id_usuario: 1,
    usuario_nombre: 'Elena Morales',
    tipo_movimiento: 'SALIDA',
    cantidad: 1,
    existencia_anterior: 25,
    existencia_nueva: 24,
    origen: 'VENTA',
    id_referencia: 1,
    fecha_movimiento: '2026-10-04 14:22:00',
    observacion: 'Venta #FAC-00892 en POS'
  },
  {
    id_movimiento: 2,
    id_producto: 3,
    producto_nombre: 'MacBook Air M3 13"',
    codigo_sku: 'TEK-A003',
    categoria: 'Laptops',
    id_usuario: 3,
    usuario_nombre: 'Camila Valenzuela',
    tipo_movimiento: 'ENTRADA',
    cantidad: 1,
    existencia_anterior: 8,
    existencia_nueva: 9,
    origen: 'DEVOLUCION',
    id_referencia: 2,
    fecha_movimiento: '2026-10-04 13:58:00',
    observacion: 'Reversión por anulación de Factura FAC-002339'
  },
  {
    id_movimiento: 3,
    id_producto: 4,
    producto_nombre: 'iPad Air 11" M2 WiFi',
    codigo_sku: 'TEK-A004',
    categoria: 'Tablets',
    id_usuario: 1,
    usuario_nombre: 'Elena Morales',
    tipo_movimiento: 'ENTRADA',
    cantidad: 10,
    existencia_anterior: 5,
    existencia_nueva: 15,
    origen: 'COMPRA',
    id_referencia: 1,
    fecha_movimiento: '2026-09-28 11:30:00',
    observacion: 'Recepción de compra proveedor Apple Premium'
  }
];

// 1. GET /api/inventario/movimientos - Historial detallado de entradas y salidas (Kardex)
router.get('/movimientos', async (req, res) => {
  const { id_producto, tipo, origen, q, limit = 100 } = req.query;

  try {
    let query = `
      SELECT 
        m.id_movimiento,
        m.id_producto,
        p.nombre AS producto_nombre,
        p.codigo AS codigo_sku,
        p.imagen_url,
        cat.nombre AS categoria,
        m.id_usuario,
        COALESCE(CONCAT(e.nombres, ' ', e.apellidos), u.nombre_usuario, 'Sistema') AS usuario_nombre,
        m.tipo_movimiento,
        m.cantidad,
        m.existencia_anterior,
        m.existencia_nueva,
        m.origen,
        m.id_referencia,
        m.fecha_movimiento,
        m.observacion
      FROM movimientos_inventario m
      JOIN productos p ON m.id_producto = p.id_producto
      LEFT JOIN categorias cat ON p.id_categoria = cat.id_categoria
      LEFT JOIN usuarios u ON m.id_usuario = u.id_usuario
      LEFT JOIN empleados e ON u.id_empleado = e.id_empleado
      WHERE 1=1
    `;
    const params = [];

    if (id_producto) {
      params.push(parseInt(id_producto));
      query += ` AND m.id_producto = $${params.length}`;
    }

    if (tipo && tipo !== 'TODOS') {
      params.push(tipo.toUpperCase());
      query += ` AND m.tipo_movimiento = $${params.length}`;
    }

    if (origen && origen !== 'TODOS') {
      params.push(origen.toUpperCase());
      query += ` AND m.origen = $${params.length}`;
    }

    if (q) {
      params.push(`%${q.toLowerCase()}%`);
      query += ` AND (LOWER(p.nombre) LIKE $${params.length} OR LOWER(p.codigo) LIKE $${params.length} OR LOWER(m.observacion) LIKE $${params.length})`;
    }

    query += ` ORDER BY m.id_movimiento DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);
    if (result.rows.length > 0) {
      return res.json(result.rows);
    }
    return res.json(movimientosFallback);
  } catch (err) {
    console.error('Error fetching inventory movements:', err.message);
    res.json(movimientosFallback);
  }
});

// 2. GET /api/inventario/alertas - Alertas dinámicas de stock bajo / crítico
router.get('/alertas', async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id_producto,
        p.codigo,
        p.nombre,
        p.imagen_url,
        c.nombre AS categoria,
        COALESCE(i.cantidad_actual, 0) AS stock_actual,
        COALESCE(p.stock_minimo, 5) AS stock_minimo,
        (COALESCE(p.stock_minimo, 5) - COALESCE(i.cantidad_actual, 0)) AS deficit,
        CASE 
          WHEN COALESCE(i.cantidad_actual, 0) = 0 THEN 'AGOTADO'
          WHEN COALESCE(i.cantidad_actual, 0) <= COALESCE(p.stock_minimo, 5) THEN 'BAJO'
          ELSE 'NORMAL'
        END AS nivel_alerta
      FROM productos p
      LEFT JOIN inventario i ON p.id_producto = i.id_producto
      LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
      WHERE p.estado = 'ACTIVO' AND COALESCE(i.cantidad_actual, 0) <= COALESCE(p.stock_minimo, 5)
      ORDER BY COALESCE(i.cantidad_actual, 0) ASC, p.nombre ASC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    const fallbackAlerts = products
      .filter(p => (p.stock !== undefined ? p.stock : 0) <= (p.stock_minimo || 5))
      .map(p => ({
        id_producto: p.id_producto,
        codigo: p.codigo,
        nombre: p.nombre,
        imagen_url: p.imagen_url,
        categoria: p.categoria_nombre,
        stock_actual: p.stock,
        stock_minimo: p.stock_minimo || 5,
        deficit: (p.stock_minimo || 5) - p.stock,
        nivel_alerta: p.stock === 0 ? 'AGOTADO' : 'BAJO'
      }));
    res.json(fallbackAlerts);
  }
});

// 3. POST /api/inventario/ajuste - Registrar ajuste de existencias
router.post('/ajuste', async (req, res) => {
  const { id_producto, tipo_movimiento, cantidad, observacion, id_usuario = 1 } = req.body;

  if (!id_producto || !tipo_movimiento || !cantidad || cantidad <= 0) {
    return res.status(400).json({ error: 'Producto, tipo de movimiento y cantidad válida son requeridos' });
  }

  const client = await pool.connect().catch(() => null);
  if (client) {
    try {
      await client.query('BEGIN');

      const invRes = await client.query('SELECT cantidad_actual FROM inventario WHERE id_producto = $1 FOR UPDATE', [id_producto]);
      const actual = invRes.rows.length > 0 ? parseInt(invRes.rows[0].cantidad_actual) : 0;

      let nuevaExistencia = actual;
      if (tipo_movimiento === 'ENTRADA') nuevaExistencia = actual + parseInt(cantidad);
      else if (tipo_movimiento === 'SALIDA') nuevaExistencia = Math.max(0, actual - parseInt(cantidad));
      else if (tipo_movimiento === 'AJUSTE') nuevaExistencia = parseInt(cantidad);

      await client.query(
        `UPDATE inventario SET cantidad_actual = $1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_producto = $2`,
        [nuevaExistencia, id_producto]
      );

      const movRes = await client.query(
        `INSERT INTO movimientos_inventario 
         (id_producto, id_usuario, tipo_movimiento, cantidad, existencia_anterior, existencia_nueva, origen, observacion)
         VALUES ($1, $2, $3, $4, $5, $6, 'AJUSTE MANUAL', $7) RETURNING *`,
        [id_producto, id_usuario, tipo_movimiento, cantidad, actual, nuevaExistencia, observacion || 'Ajuste manual de existencias']
      );

      await client.query('COMMIT');

      await registrarOperacion({
        id_usuario,
        operacion: 'MODIFICAR',
        tabla_afectada: 'inventario',
        id_registro_afectado: parseInt(id_producto),
        descripcion: `Ajuste de inventario en producto #${id_producto} (${tipo_movimiento} ${cantidad}). Stock: ${actual} → ${nuevaExistencia}`,
        datos_nuevos: { existencia_anterior: actual, existencia_nueva: nuevaExistencia }
      });

      return res.status(201).json(movRes.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('Error saving inventory adjustment:', err.message);
      return res.status(500).json({ error: 'Error al registrar ajuste: ' + err.message });
    } finally {
      client.release();
    }
  }

  // Fallback in-memory
  const prod = products.find(p => p.id_producto === parseInt(id_producto));
  const actual = prod ? (prod.stock || 0) : 0;
  let nuevaExistencia = actual;
  if (tipo_movimiento === 'ENTRADA') nuevaExistencia = actual + parseInt(cantidad);
  else if (tipo_movimiento === 'SALIDA') nuevaExistencia = Math.max(0, actual - parseInt(cantidad));
  else if (tipo_movimiento === 'AJUSTE') nuevaExistencia = parseInt(cantidad);

  if (prod) prod.stock = nuevaExistencia;

  const newMov = {
    id_movimiento: Date.now(),
    id_producto: parseInt(id_producto),
    producto_nombre: prod?.nombre || 'Producto',
    codigo_sku: prod?.codigo || 'SKU',
    categoria: prod?.categoria_nombre || 'General',
    id_usuario,
    usuario_nombre: 'Usuario Sistema',
    tipo_movimiento,
    cantidad: parseInt(cantidad),
    existencia_anterior: actual,
    existencia_nueva: nuevaExistencia,
    origen: 'AJUSTE MANUAL',
    id_referencia: null,
    fecha_movimiento: new Date().toISOString(),
    observacion: observacion || 'Ajuste manual'
  };
  movimientosFallback.unshift(newMov);

  res.status(201).json(newMov);
});

module.exports = router;

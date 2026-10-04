const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { purchases, providers } = require('../db/fallbackData');
const { registrarOperacion } = require('./auditoria');

// GET /api/compras
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        c.*,
        p.nombre AS proveedor,
        u.nombre_usuario AS usuario
      FROM compras c
      JOIN proveedores p ON c.id_proveedor = p.id_proveedor
      JOIN usuarios u ON c.id_usuario = u.id_usuario
      ORDER BY c.id_compra DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.json(purchases);
  }
});

// POST /api/compras - Registrar nueva orden de compra
router.post('/', async (req, res) => {
  const { id_proveedor, items, total, observacion, id_usuario } = req.body;
  if (!id_proveedor || !items || items.length === 0) {
    return res.status(400).json({ error: 'Proveedor e items son requeridos' });
  }

  const usuarioId = parseInt(id_usuario) || 1;

  const client = await pool.connect().catch(() => null);
  if (client) {
    try {
      await client.query('BEGIN');
      const compRes = await client.query(
        `INSERT INTO compras (id_proveedor, id_usuario, subtotal, total, estado)
         VALUES ($1, $2, $3, $4, 'REGISTRADA') RETURNING *`,
        [id_proveedor, usuarioId, total, total]
      );
      const newComp = compRes.rows[0];

      for (const item of items) {
        await client.query(
          `INSERT INTO detalle_compra (id_compra, id_producto, cantidad, costo_unitario, subtotal)
           VALUES ($1, $2, $3, $4, $5)`,
          [newComp.id_compra, item.id_producto, item.cantidad, item.costo_unitario, item.subtotal]
        );
        const invPrev = await client.query('SELECT cantidad_actual FROM inventario WHERE id_producto = $1', [item.id_producto]);
        const stockPrevio = invPrev.rows.length > 0 ? parseInt(invPrev.rows[0].cantidad_actual) : 0;
        const nuevoStock = stockPrevio + parseInt(item.cantidad);
        await client.query(
          `UPDATE inventario SET cantidad_actual = $1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_producto = $2`,
          [nuevoStock, item.id_producto]
        );
        await client.query(
          `INSERT INTO movimientos_inventario
           (id_producto, id_usuario, tipo_movimiento, cantidad, existencia_anterior, existencia_nueva, origen, id_referencia, observacion)
           VALUES ($1, $2, 'ENTRADA', $3, $4, $5, 'COMPRA', $6, $7)`,
          [item.id_producto, usuarioId, item.cantidad, stockPrevio, nuevoStock, newComp.id_compra,
           `Entrada por Orden de Compra #${newComp.id_compra}`]
        );
      }
      await client.query('COMMIT');

      // Datos para auditoria (post-commit, no bloqueante)
      const provRes = await pool.query('SELECT nombre FROM proveedores WHERE id_proveedor = $1', [id_proveedor]).catch(() => ({ rows: [] }));
      const provNombre = provRes.rows[0]?.nombre || `Proveedor #${id_proveedor}`;
      const userRes = await pool.query(
        `SELECT u.nombre_usuario, COALESCE(NULLIF(TRIM(e.nombres || ' ' || e.apellidos), ''), u.nombre_usuario) AS nombre_completo, r.nombre AS rol 
         FROM usuarios u 
         LEFT JOIN empleados e ON u.id_empleado = e.id_empleado
         LEFT JOIN roles r ON u.id_rol = r.id_rol 
         WHERE u.id_usuario = $1`,
        [usuarioId]
      ).catch(() => ({ rows: [] }));
      const usuarioNombre = userRes.rows[0]?.nombre_completo || userRes.rows[0]?.nombre_usuario || 'admin';
      const usuarioRol = userRes.rows[0]?.rol || 'Usuario';

      await registrarOperacion({
        id_usuario: usuarioId,
        usuario: usuarioNombre,
        rol: usuarioRol,
        operacion: 'CREAR',
        tabla_afectada: 'compras',
        id_registro_afectado: newComp.id_compra,
        descripcion: `Orden de compra #OC-${String(newComp.id_compra).padStart(4,'0')} registrada — Proveedor: ${provNombre} — Total: $${parseFloat(total).toFixed(2)} — ${items.length} producto(s)`,
        datos_nuevos: { id_compra: newComp.id_compra, proveedor: provNombre, total: parseFloat(total), items_count: items.length }
      });

      return res.status(201).json(newComp);
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('DB error recording purchase:', err.message);
    } finally {
      client.release();
    }
  }

  // Fallback local (sin BD)
  const prov = providers.find(p => p.id_proveedor === parseInt(id_proveedor));
  const provNombre = prov ? prov.nombre : 'Proveedor General';
  const newPurchase = {
    id_compra: purchases.length + 1,
    proveedor: provNombre,
    fecha_compra: new Date().toISOString(),
    total: parseFloat(total || 0),
    estado: 'REGISTRADA',
    observacion: observacion || '',
    usuario: `usuario_${usuarioId}`
  };
  purchases.unshift(newPurchase);

  await registrarOperacion({
    id_usuario: usuarioId,
    usuario: `usuario_${usuarioId}`,
    rol: 'Usuario',
    operacion: 'CREAR',
    tabla_afectada: 'compras',
    id_registro_afectado: newPurchase.id_compra,
    descripcion: `Orden de compra #OC-${String(newPurchase.id_compra).padStart(4,'0')} registrada (local) — Proveedor: ${provNombre} — Total: $${parseFloat(total).toFixed(2)} — ${items.length} producto(s)`,
    datos_nuevos: { proveedor: provNombre, total: parseFloat(total), items_count: items.length }
  }).catch(() => {});

  res.status(201).json(newPurchase);
});

module.exports = router;

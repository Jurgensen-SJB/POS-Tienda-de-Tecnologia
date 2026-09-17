const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { purchases, providers } = require('../db/fallbackData');

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

// POST /api/compras - Create new purchase order / reception
router.post('/', async (req, res) => {
  const { id_proveedor, items, total, observacion } = req.body;
  if (!id_proveedor || !items || items.length === 0) {
    return res.status(400).json({ error: 'Proveedor e ítems son requeridos' });
  }

  const client = await pool.connect().catch(() => null);
  if (client) {
    try {
      await client.query('BEGIN');
      const compRes = await client.query(
        `INSERT INTO compras (id_proveedor, id_usuario, subtotal, total, estado)
         VALUES ($1, $2, $3, $4, 'REGISTRADA') RETURNING *`,
        [id_proveedor, 1, total, total]
      );
      const newComp = compRes.rows[0];

      for (const item of items) {
        await client.query(
          `INSERT INTO detalle_compra (id_compra, id_producto, cantidad, costo_unitario, subtotal)
           VALUES ($1, $2, $3, $4, $5)`,
          [newComp.id_compra, item.id_producto, item.cantidad, item.costo_unitario, item.subtotal]
        );
        // Update stock
        await client.query(
          `UPDATE inventario SET cantidad_actual = cantidad_actual + $1, fecha_actualizacion = CURRENT_TIMESTAMP
           WHERE id_producto = $2`,
          [item.cantidad, item.id_producto]
        );
      }

      await client.query('COMMIT');
      return res.status(201).json(newComp);
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('DB error recording purchase:', err.message);
    } finally {
      client.release();
    }
  }

  const prov = providers.find(p => p.id_proveedor === parseInt(id_proveedor));
  const newPurchase = {
    id_compra: purchases.length + 1,
    proveedor: prov ? prov.nombre : 'Proveedor General',
    fecha: new Date().toISOString().split('T')[0],
    total: parseFloat(total || 0),
    estado: 'REGISTRADA',
    observacion: observacion || ''
  };
  purchases.unshift(newPurchase);
  res.status(201).json(newPurchase);
});

module.exports = router;

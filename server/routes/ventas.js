const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { salesHistory, products, clients, cajaActual } = require('../db/fallbackData');

// GET /api/ventas - Sales history
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        v.id_venta,
        f.numero_factura,
        COALESCE(c.nombres || ' ' || COALESCE(c.apellidos, ''), 'Consumidor Final') AS cliente,
        TO_CHAR(v.fecha_venta, 'HH24:MI') AS fecha,
        v.subtotal,
        v.descuento_total,
        v.impuesto,
        v.total,
        v.estado,
        fp.nombre AS metodo
      FROM ventas v
      LEFT JOIN facturas f ON v.id_venta = f.id_venta
      LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
      LEFT JOIN pagos_venta pv ON v.id_venta = pv.id_venta
      LEFT JOIN formas_pago fp ON pv.id_forma_pago = fp.id_forma_pago
      ORDER BY v.id_venta DESC
      LIMIT 100
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.json(salesHistory);
  }
});

// POST /api/ventas - Checkout (Transactional sale)
router.post('/', async (req, res) => {
  const { id_cliente, items, subtotal, descuento_total, impuesto, total, id_forma_pago, metodo_nombre, id_usuario, id_caja } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'El carrito no puede estar vacío' });
  }

  const client = await pool.connect().catch(() => null);
  if (client) {
    try {
      await client.query('BEGIN');

      // 1. Insert Venta
      const ventaRes = await client.query(
        `INSERT INTO ventas (id_cliente, id_usuario, id_caja, subtotal, descuento_total, impuesto, total, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'COMPLETADA') RETURNING *`,
        [id_cliente || 1, id_usuario || 1, id_caja || 1, subtotal, descuento_total || 0, impuesto || 0, total]
      );
      const newVenta = ventaRes.rows[0];

      // 2. Insert items into detalle_venta, update inventory, and record movements
      for (const item of items) {
        await client.query(
          `INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario, descuento, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [newVenta.id_venta, item.id_producto, item.cant, item.precio_venta, 0, item.subtotal]
        );

        // Get current stock
        const invRes = await client.query('SELECT cantidad_actual FROM inventario WHERE id_producto = $1 FOR UPDATE', [item.id_producto]);
        const currentStock = invRes.rows.length > 0 ? invRes.rows[0].cantidad_actual : 0;
        const newStock = Math.max(0, currentStock - item.cant);

        // Update inventory
        await client.query(
          'UPDATE inventario SET cantidad_actual = $1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_producto = $2',
          [newStock, item.id_producto]
        );

        // Record movement
        await client.query(
          `INSERT INTO movimientos_inventario (id_producto, id_usuario, tipo_movimiento, cantidad, existencia_anterior, existencia_actual, motivo)
           VALUES ($1, $2, 'SALIDA', $3, $4, $5, 'Venta en POS')`,
          [item.id_producto, id_usuario || 1, item.cant, currentStock, newStock]
        );
      }

      // 3. Generate invoice number
      const countRes = await client.query('SELECT COUNT(*) AS count FROM facturas');
      const nextNum = parseInt(countRes.rows[0].count) + 2342;
      const numero_factura = `FAC-${String(nextNum).padStart(6, '0')}`;

      await client.query(
        `INSERT INTO facturas (numero_factura, id_venta, estado) VALUES ($1, $2, 'GENERADA')`,
        [numero_factura, newVenta.id_venta]
      );

      // 4. Record payment
      await client.query(
        `INSERT INTO pagos_venta (id_venta, id_forma_pago, monto) VALUES ($1, $2, $3)`,
        [newVenta.id_venta, id_forma_pago || 1, total]
      );

      await client.query('COMMIT');

      return res.status(201).json({
        id_venta: newVenta.id_venta,
        numero_factura,
        total: parseFloat(total),
        estado: 'COMPLETADA',
        fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('Checkout error:', err.message);
      return res.status(500).json({ error: 'Error en transacción de checkout: ' + err.message });
    } finally {
      client.release();
    }
  }

  // Fallback in-memory
  const nextNum = 2342 + salesHistory.length;
  const numero_factura = `FAC-${String(nextNum).padStart(6, '0')}`;
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // Update in-memory stock
  items.forEach(item => {
    const p = products.find(prod => prod.id_producto === item.id_producto);
    if (p) {
      p.stock = Math.max(0, (p.stock || 0) - item.cant);
    }
  });

  const clientObj = clients.find(c => c.id_cliente === parseInt(id_cliente));
  const clientName = clientObj ? `${clientObj.nombres} ${clientObj.apellidos || ''}`.trim() : 'Consumidor Final';

  // Update caja totals
  const numTotal = parseFloat(total);
  if (metodo_nombre === 'Efectivo' || !metodo_nombre) {
    cajaActual.ventas_efectivo += numTotal;
    cajaActual.total_en_caja += numTotal;
  } else if (metodo_nombre.includes('Tarjeta')) {
    cajaActual.ventas_tarjeta += numTotal;
  } else {
    cajaActual.ventas_transferencia += numTotal;
  }

  const newSale = {
    id_venta: salesHistory.length + 1,
    numero_factura,
    cliente: clientName,
    fecha: timeStr,
    metodo: metodo_nombre || 'Efectivo',
    total: numTotal,
    estado: 'COMPLETADA',
    items
  };

  salesHistory.unshift(newSale);

  res.status(201).json(newSale);
});

// POST /api/ventas/:id/anular - Void sale
router.post('/:id/anular', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE ventas SET estado = 'ANULADA', fecha_anulacion = CURRENT_TIMESTAMP WHERE id_venta = $1", [id]);
    await pool.query("UPDATE facturas SET estado = 'ANULADA' WHERE id_venta = $1", [id]);
    res.json({ message: 'Venta anulada exitosamente' });
  } catch (err) {
    const sale = salesHistory.find(s => s.id_venta === parseInt(id) || s.numero_factura === id);
    if (sale) {
      sale.estado = 'ANULADA';
      return res.json({ message: 'Venta anulada exitosamente' });
    }
    res.status(404).json({ error: 'Venta no encontrada' });
  }
});

module.exports = router;

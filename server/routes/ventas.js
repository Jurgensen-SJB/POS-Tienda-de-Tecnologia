const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { salesHistory, products, clients, cajaActual } = require('../db/fallbackData');
const { registrarOperacion } = require('./auditoria');

// GET /api/ventas - Sales history
router.get('/', async (req, res) => {
  const { numero, cliente, fecha } = req.query;
  try {
    let whereClauses = [];
    let params = [];

    if (numero) {
      params.push(`%${numero.trim()}%`);
      whereClauses.push(`(f.numero_factura ILIKE $${params.length} OR CAST(v.id_venta AS TEXT) ILIKE $${params.length})`);
    }

    if (cliente) {
      params.push(`%${cliente.trim()}%`);
      whereClauses.push(`(c.nombres ILIKE $${params.length} OR c.apellidos ILIKE $${params.length} OR (c.nombres || ' ' || COALESCE(c.apellidos, '')) ILIKE $${params.length})`);
    }

    if (fecha) {
      params.push(fecha.trim());
      whereClauses.push(`TO_CHAR(v.fecha_venta, 'YYYY-MM-DD') = $${params.length}`);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const query = `
      SELECT 
        v.id_venta,
        v.id_usuario,
        f.numero_factura,
        COALESCE(c.nombres || ' ' || COALESCE(c.apellidos, ''), 'Consumidor Final') AS cliente,
        TO_CHAR(v.fecha_venta, 'HH24:MI') AS fecha,
        TO_CHAR(v.fecha_venta, 'YYYY-MM-DD') AS fecha_dia,
        TO_CHAR(v.fecha_venta, 'DD/MM/YYYY HH24:MI') AS fecha_completa,
        v.subtotal,
        v.descuento_total,
        v.impuesto,
        v.total,
        v.estado,
        fp.nombre AS metodo,
        COALESCE(e.nombres || ' ' || e.apellidos, u.nombre_usuario, 'Camila Valenzuela') AS cajero
      FROM ventas v
      LEFT JOIN facturas f ON v.id_venta = f.id_venta
      LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
      LEFT JOIN pagos_venta pv ON v.id_venta = pv.id_venta
      LEFT JOIN formas_pago fp ON pv.id_forma_pago = fp.id_forma_pago
      LEFT JOIN usuarios u ON v.id_usuario = u.id_usuario
      LEFT JOIN empleados e ON u.id_empleado = e.id_empleado
      ${whereStr}
      ORDER BY v.id_venta DESC
      LIMIT 100
    `;
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    let filtered = [...salesHistory];
    if (numero) {
      filtered = filtered.filter(s => (s.numero_factura || '').toLowerCase().includes(numero.toLowerCase()) || String(s.id_venta).includes(numero));
    }
    if (cliente) {
      filtered = filtered.filter(s => (s.cliente || '').toLowerCase().includes(cliente.toLowerCase()));
    }
    if (fecha) {
      filtered = filtered.filter(s => (s.fecha_dia || s.fecha || '').includes(fecha));
    }
    res.json(filtered);
  }
});

// POST /api/ventas - Checkout (Transactional sale)
router.post('/', async (req, res) => {
  const { id_cliente, items, subtotal, descuento_total, impuesto, total, id_forma_pago, metodo_nombre, id_usuario, id_caja, cajero: cajeroNombre, cajeroRol } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'El carrito no puede estar vacío' });
  }

  const client = await pool.connect().catch(() => null);
  if (client) {
    try {
      await client.query('BEGIN');

      // Validar existencias de todos los productos antes de procesar
      for (const item of items) {
        const invCheck = await client.query(
          `SELECT i.cantidad_actual, p.nombre 
           FROM inventario i 
           JOIN productos p ON i.id_producto = p.id_producto 
           WHERE i.id_producto = $1 FOR UPDATE`,
          [item.id_producto]
        );
        const currentStock = invCheck.rows.length > 0 ? parseInt(invCheck.rows[0].cantidad_actual) || 0 : 0;
        const requestedCant = parseInt(item.cant) || 1;
        const prodName = invCheck.rows.length > 0 ? invCheck.rows[0].nombre : `Producto #${item.id_producto}`;

        if (currentStock < requestedCant) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            error: `Stock insuficiente para "${prodName}". Stock disponible en almacén: ${currentStock}, intentas vender: ${requestedCant}`
          });
        }
      }

      // 1. Insert Venta
      const ventaRes = await client.query(
        `INSERT INTO ventas (id_cliente, id_usuario, id_caja, subtotal, descuento_total, impuesto, total, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'COMPLETADA') RETURNING *`,
        [id_cliente || 1, id_usuario || 1, id_caja || 1, subtotal, descuento_total || 0, impuesto || 0, total]
      );
      const newVenta = ventaRes.rows[0];

      // 2. Insert items into detalle_venta, update inventory, and record movements
      for (const item of items) {
        const itemDesc = parseFloat(item.descuento || item.discount || 0);
        await client.query(
          `INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario, descuento, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [newVenta.id_venta, item.id_producto, item.cant, item.precio_venta, itemDesc, item.subtotal]
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
          `INSERT INTO movimientos_inventario (id_producto, id_usuario, tipo_movimiento, cantidad, existencia_anterior, existencia_nueva, origen, id_referencia, observacion)
           VALUES ($1, $2, 'SALIDA', $3, $4, $5, 'VENTA', $6, 'Venta en POS')`,
          [item.id_producto, id_usuario || 1, item.cant, currentStock, newStock, newVenta.id_venta]
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

      // Obtener nombre de usuario real para auditoría
      const userAuditRes = await pool.query(
        `SELECT u.nombre_usuario, COALESCE(NULLIF(TRIM(e.nombres || ' ' || e.apellidos), ''), u.nombre_usuario) AS nombre_completo, r.nombre AS rol 
         FROM usuarios u 
         LEFT JOIN empleados e ON u.id_empleado = e.id_empleado
         LEFT JOIN roles r ON u.id_rol = r.id_rol 
         WHERE u.id_usuario = $1`,
        [id_usuario || 1]
      ).catch(() => ({ rows: [] }));
      const audUsuario = userAuditRes.rows[0]?.nombre_completo || userAuditRes.rows[0]?.nombre_usuario || cajeroNombre || 'usuario';
      const audRol = userAuditRes.rows[0]?.rol || cajeroRol || 'Usuario';

      await registrarOperacion({
        id_usuario: parseInt(id_usuario) || 1,
        usuario: audUsuario,
        rol: audRol,
        operacion: 'CREAR',
        tabla_afectada: 'ventas',
        id_registro_afectado: newVenta.id_venta,
        descripcion: `Venta ${numero_factura} completada por $${parseFloat(total).toFixed(2)}`,
        datos_nuevos: { total: parseFloat(total), items_count: items.length }
      });

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
  // Fallback in-memory: validar stock primero
  for (const item of items) {
    const p = products.find(prod => prod.id_producto === item.id_producto);
    const available = p ? (p.stock || 0) : 0;
    const requested = parseInt(item.cant) || 1;
    if (available < requested) {
      return res.status(400).json({
        error: `Stock insuficiente para "${p ? p.nombre : 'Producto'}". Stock actual: ${available}, solicitado: ${requested}`
      });
    }
  }

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
    items,
    id_usuario: parseInt(id_usuario) || 1,
    cajero: cajeroNombre || `usuario_${id_usuario}`
  };

  salesHistory.unshift(newSale);

  await registrarOperacion({
    id_usuario: parseInt(id_usuario) || 1,
    usuario: cajeroNombre || `usuario_${id_usuario}`,
    rol: cajeroRol || 'Usuario',
    operacion: 'CREAR',
    tabla_afectada: 'ventas',
    id_registro_afectado: newSale.id_venta,
    descripcion: `Venta ${newSale.numero_factura} completada por $${numTotal.toFixed(2)} (${newSale.metodo})`,
    datos_nuevos: { total: numTotal, cliente: clientName, items_count: items.length }
  });

  res.status(201).json(newSale);
});

// POST /api/ventas/:id/anular - Void sale and revert inventory
router.post('/:id/anular', async (req, res) => {
  const { id } = req.params;
  const { id_usuario: anuladorId, cajero: anuladorNombre, cajeroRol: anuladorRol } = req.body;
  const client = await pool.connect().catch(() => null);

  if (client) {
    try {
      await client.query('BEGIN');

      // Buscar la venta correspondiente (por id_venta o numero_factura)
      const findRes = await client.query(`
        SELECT v.id_venta, v.estado, v.total
        FROM ventas v
        LEFT JOIN facturas f ON v.id_venta = f.id_venta
        WHERE v.id_venta = $1 OR f.numero_factura = $2
        LIMIT 1
      `, [isNaN(parseInt(id)) ? -1 : parseInt(id), id]);

      if (findRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Venta no encontrada' });
      }

      const venta = findRes.rows[0];
      if (venta.estado === 'ANULADA') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'La venta ya se encuentra anulada' });
      }

      // 1. Marcar venta y factura como ANULADA
      await client.query(
        "UPDATE ventas SET estado = 'ANULADA', fecha_anulacion = CURRENT_TIMESTAMP WHERE id_venta = $1",
        [venta.id_venta]
      );
      await client.query(
        "UPDATE facturas SET estado = 'ANULADA' WHERE id_venta = $1",
        [venta.id_venta]
      );

      // 2. Obtener productos vendidos para revertir inventario
      const itemsRes = await client.query(
        "SELECT id_producto, cantidad FROM detalle_venta WHERE id_venta = $1",
        [venta.id_venta]
      );

      for (const item of itemsRes.rows) {
        const invRes = await client.query(
          "SELECT cantidad_actual FROM inventario WHERE id_producto = $1 FOR UPDATE",
          [item.id_producto]
        );
        const currentStock = invRes.rows.length > 0 ? invRes.rows[0].cantidad_actual : 0;
        const newStock = currentStock + item.cantidad;

        // Actualizar stock en tabla inventario
        await client.query(
          "UPDATE inventario SET cantidad_actual = $1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_producto = $2",
          [newStock, item.id_producto]
        );

        // Registrar movimiento de devolución en movimientos_inventario
        await client.query(
          `INSERT INTO movimientos_inventario (id_producto, id_usuario, tipo_movimiento, cantidad, existencia_anterior, existencia_nueva, origen, id_referencia, observacion)
           VALUES ($1, 1, 'DEVOLUCION', $2, $3, $4, 'ANULACION_VENTA', $5, 'Reversión de stock por anulación de comprobante fiscal')`,
          [item.id_producto, item.cantidad, currentStock, newStock, venta.id_venta]
        );
      }

      // 3. Registrar en auditoría
      const anulUserRes = await pool.query(
        `SELECT u.nombre_usuario, COALESCE(NULLIF(TRIM(e.nombres || ' ' || e.apellidos), ''), u.nombre_usuario) AS nombre_completo, r.nombre AS rol 
         FROM usuarios u 
         LEFT JOIN empleados e ON u.id_empleado = e.id_empleado
         LEFT JOIN roles r ON u.id_rol = r.id_rol 
         WHERE u.id_usuario = $1`,
        [anuladorId || 1]
      ).catch(() => ({ rows: [] }));
      const anulUsuario = anulUserRes.rows[0]?.nombre_completo || anulUserRes.rows[0]?.nombre_usuario || anuladorNombre || 'usuario';
      const anulRol = anulUserRes.rows[0]?.rol || anuladorRol || 'Usuario';
      await registrarOperacion({
        id_usuario: parseInt(anuladorId) || 1,
        usuario: anulUsuario,
        rol: anulRol,
        operacion: 'ANULAR',
        tabla_afectada: 'ventas',
        id_registro_afectado: venta.id_venta,
        descripcion: `Anulación de venta #${venta.id_venta} con reversión de inventario de ${itemsRes.rows.length} productos`,
        datos_nuevos: { estado: 'ANULADA', items_revertidos: itemsRes.rows.length }
      });

      await client.query('COMMIT');
      return res.json({ 
        message: 'Venta anulada exitosamente y stock revertido al almacén',
        id_venta: venta.id_venta 
      });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('Error al anular venta:', err.message);
      return res.status(500).json({ error: 'Error al anular venta: ' + err.message });
    } finally {
      client.release();
    }
  }

  // Fallback in-memory
  const sale = salesHistory.find(s => s.id_venta === parseInt(id) || s.numero_factura === id);
  if (sale) {
    sale.estado = 'ANULADA';
    if (Array.isArray(sale.items)) {
      sale.items.forEach(item => {
        const prod = products.find(p => p.id_producto === item.id_producto);
        if (prod) {
          prod.stock = (prod.stock || 0) + (item.cant || item.cantidad || 0);
        }
      });
    }
    await registrarOperacion({
      id_usuario: parseInt(anuladorId) || 1,
      usuario: anuladorNombre || `usuario_${anuladorId}`,
      rol: anuladorRol || 'Usuario',
      operacion: 'ANULAR',
      tabla_afectada: 'ventas',
      id_registro_afectado: sale.id_venta,
      descripcion: `Anulación de venta ${sale.numero_factura} ($${sale.total}) con reversión de inventario`,
      datos_nuevos: { estado: 'ANULADA' }
    });
    return res.json({ message: 'Venta anulada exitosamente y stock revertido' });
  }
  res.status(404).json({ error: 'Venta no encontrada' });
});

// GET /api/ventas/:id/factura - Get full invoice details for a sale
router.get('/:id/factura', async (req, res) => {
  const { id } = req.params;
  try {
    const isNum = !isNaN(parseInt(id));
    const ventaQuery = `
      SELECT 
        v.id_venta,
        v.fecha_venta,
        TO_CHAR(v.fecha_venta, 'DD/MM/YYYY HH24:MI') AS fecha_formateada,
        v.subtotal,
        v.descuento_total,
        v.impuesto,
        v.total,
        v.estado,
        f.id_factura,
        f.numero_factura,
        f.fecha_emision,
        f.estado AS estado_factura,
        c.id_cliente,
        COALESCE(c.nombres || ' ' || COALESCE(c.apellidos, ''), 'Consumidor Final') AS cliente_nombre,
        COALESCE(c.numero_identificacion, 'Sin registrar') AS cliente_doc,
        c.correo AS cliente_correo,
        c.direccion AS cliente_direccion,
        fp.nombre AS metodo_pago,
        u.nombre_usuario AS cajero
      FROM ventas v
      LEFT JOIN facturas f ON v.id_venta = f.id_venta
      LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
      LEFT JOIN pagos_venta pv ON v.id_venta = pv.id_venta
      LEFT JOIN formas_pago fp ON pv.id_forma_pago = fp.id_forma_pago
      LEFT JOIN usuarios u ON v.id_usuario = u.id_usuario
      WHERE ${isNum ? 'v.id_venta = $1 OR f.numero_factura = $2' : 'f.numero_factura = $1'}
    `;
    const params = isNum ? [parseInt(id), id] : [id];
    const ventaRes = await pool.query(ventaQuery, params);
    
    if (ventaRes.rows.length === 0) {
      const sale = salesHistory.find(s => s.id_venta === parseInt(id) || s.numero_factura === id);
      if (!sale) return res.status(404).json({ error: 'Venta o comprobante no encontrado' });
      return res.json(sale);
    }

    const venta = ventaRes.rows[0];

    // Detalle de productos
    const itemsQuery = `
      SELECT 
        dv.id_detalle_venta,
        dv.id_producto,
        p.codigo,
        p.nombre,
        dv.cantidad,
        dv.precio_unitario,
        dv.descuento,
        dv.subtotal
      FROM detalle_venta dv
      JOIN productos p ON dv.id_producto = p.id_producto
      WHERE dv.id_venta = $1
    `;
    const itemsRes = await pool.query(itemsQuery, [venta.id_venta]);

    res.json({
      ...venta,
      items: itemsRes.rows
    });
  } catch (err) {
    const sale = salesHistory.find(s => s.id_venta === parseInt(id) || s.numero_factura === id);
    if (sale) return res.json(sale);
    res.status(500).json({ error: 'Error al obtener factura: ' + err.message });
  }
});

// POST /api/ventas/:id/generar-factura - Generate or re-generate invoice for an existing sale
router.post('/:id/generar-factura', async (req, res) => {
  const { id } = req.params;
  try {
    // Check if invoice already exists
    const checkRes = await pool.query('SELECT * FROM facturas WHERE id_venta = $1', [id]);
    if (checkRes.rows.length > 0) {
      return res.json({
        message: 'La factura ya existe para esta venta',
        factura: checkRes.rows[0]
      });
    }

    // Generate new invoice number
    const countRes = await pool.query('SELECT COUNT(*) AS count FROM facturas');
    const nextNum = parseInt(countRes.rows[0].count) + 2342;
    const numero_factura = `FAC-${String(nextNum).padStart(6, '0')}`;

    const insertRes = await pool.query(
      `INSERT INTO facturas (numero_factura, id_venta, estado) VALUES ($1, $2, 'GENERADA') RETURNING *`,
      [numero_factura, id]
    );

    await registrarOperacion({
      operacion: 'CREAR',
      tabla_afectada: 'facturas',
      id_registro_afectado: insertRes.rows[0].id_factura,
      descripcion: `Generación de factura ${numero_factura} para la venta #${id}`,
      datos_nuevos: { numero_factura, id_venta: id }
    });

    res.status(201).json({
      message: 'Factura generada exitosamente',
      factura: insertRes.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al generar factura: ' + err.message });
  }
});

module.exports = router;

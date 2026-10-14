require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { pool } = require('../db/pool');

const PRODUCT_PRICES_COP = {
  1: 4890000,
  2: 4990000,
  3: 1550000,
  4: 2490000,
  5: 4390000,
  6: 5600000,
  7: 3400000,
  8: 6800000,
  9: 1560000,
  10: 2600000,
  11: 520000,
  12: 920000,
  13: 399000,
  14: 450000,
  15: 480000,
  16: 280000,
  17: 1390000,
  18: 1150000,
  19: 640000,
  20: 320000,
  21: 720000,
  22: 280000,
  23: 990000,
  24: 220000,
};

async function convertToCOP() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('🔄 Iniciando conversión a Pesos Colombianos (COP)...');

    // 1. Actualizar precios de productos
    for (const [id, precio] of Object.entries(PRODUCT_PRICES_COP)) {
      await client.query(
        'UPDATE productos SET precio_venta = $1 WHERE id_producto = $2',
        [precio, parseInt(id)]
      );
    }
    console.log('✅ Precios de productos actualizados a COP.');

    // 2. Actualizar detalle_venta con nuevos precios
    const detalles = await client.query('SELECT id_detalle_venta, id_producto, cantidad FROM detalle_venta');
    for (const d of detalles.rows) {
      const unitPrice = PRODUCT_PRICES_COP[d.id_producto] || 150000;
      const subtotal = unitPrice * d.cantidad;
      await client.query(
        'UPDATE detalle_venta SET precio_unitario = $1, subtotal = $2 WHERE id_detalle_venta = $3',
        [unitPrice, subtotal, d.id_detalle_venta]
      );
    }
    console.log('✅ Detalles de venta recalculados con precios COP.');

    // 3. Recalcular ventas (subtotal, impuesto 19% IVA, total)
    const ventas = await client.query('SELECT id_venta FROM ventas');
    for (const v of ventas.rows) {
      const sumRes = await client.query(
        'SELECT COALESCE(SUM(subtotal), 0) as subtotal FROM detalle_venta WHERE id_venta = $1',
        [v.id_venta]
      );
      const sub = parseFloat(sumRes.rows[0].subtotal);
      const imp = Math.round(sub * 0.19);
      const tot = sub + imp;

      await client.query(
        'UPDATE ventas SET subtotal = $1, impuesto = $2, total = $3 WHERE id_venta = $4',
        [sub, imp, tot, v.id_venta]
      );

      // Actualizar pagos_venta
      await client.query(
        'UPDATE pagos_venta SET monto = $1 WHERE id_venta = $2',
        [tot, v.id_venta]
      );
    }
    console.log('✅ Ventas y pagos_venta actualizados con IVA 19% y totales COP.');

    // 4. Actualizar cajas a montos coherentes en COP
    await client.query(`
      UPDATE cajas 
      SET monto_inicial = 200000, 
          monto_final = CASE WHEN monto_final IS NOT NULL THEN 200000 ELSE NULL END,
          diferencia = 0
      WHERE id_caja < 5
    `);

    // Cerrar cualquier caja abierta previa para que esté listo el sistema
    await client.query(`
      UPDATE cajas 
      SET estado = 'CERRADA',
          fecha_cierre = NOW(),
          monto_inicial = 200000,
          monto_final = 200000,
          diferencia = 0
      WHERE estado = 'ABIERTA'
    `);
    console.log('✅ Cajas actualizadas con montos en COP ($ 200.000 fondo inicial).');

    // 5. Actualizar formas de pago colombianas
    await client.query(`
      UPDATE formas_pago 
      SET nombre = 'Nequi / Daviplata', descripcion = 'Billeteras digitales Colombia (Nequi / Daviplata)'
      WHERE id_forma_pago = 4 OR nombre ILIKE '%yape%' OR nombre ILIKE '%plin%'
    `);
    console.log('✅ Formas de pago adaptadas a Colombia (Nequi / Daviplata).');

    await client.query('COMMIT');
    console.log('🎉 ¡Conversión a COP en PostgreSQL completada con éxito!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error en conversión:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

convertToCOP();

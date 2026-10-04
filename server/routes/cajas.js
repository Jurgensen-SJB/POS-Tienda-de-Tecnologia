const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { cajaActual } = require('../db/fallbackData');
const { registrarOperacion } = require('./auditoria');

// Historial en memoria de cajas para modo offline/fallback
const cajasHistorialFallback = [
  {
    id_caja: 1,
    id_usuario_apertura: 1,
    usuario_apertura: 'Elena Morales',
    cajero: 'Camila Valenzuela',
    fecha_apertura: '2026-10-04 08:00:00',
    monto_inicial: 500.00,
    id_usuario_cierre: null,
    usuario_cierre: null,
    fecha_cierre: null,
    monto_final: null,
    diferencia: null,
    ventas_efectivo: 5848.00,
    ventas_tarjeta: 3148.00,
    ventas_transferencia: 8798.00,
    total_en_caja: 6348.00,
    estado: 'ABIERTA'
  }
];

// 1. GET /api/cajas - Historial completo de cajas (Aperturas, Cierres y Flujo)
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        c.*,
        ua.nombre_usuario AS usuario_apertura,
        CONCAT(ea.nombres, ' ', ea.apellidos) AS cajero_apertura,
        uc.nombre_usuario AS usuario_cierre,
        CONCAT(ec.nombres, ' ', ec.apellidos) AS cajero_cierre,
        COALESCE((SELECT SUM(pv.monto) FROM pagos_venta pv JOIN ventas v ON pv.id_venta = v.id_venta WHERE v.id_caja = c.id_caja AND v.estado = 'COMPLETADA' AND pv.id_forma_pago = 1), 0) AS ventas_efectivo,
        COALESCE((SELECT SUM(pv.monto) FROM pagos_venta pv JOIN ventas v ON pv.id_venta = v.id_venta WHERE v.id_caja = c.id_caja AND v.estado = 'COMPLETADA' AND pv.id_forma_pago = 2), 0) AS ventas_tarjeta,
        COALESCE((SELECT SUM(pv.monto) FROM pagos_venta pv JOIN ventas v ON pv.id_venta = v.id_venta WHERE v.id_caja = c.id_caja AND v.estado = 'COMPLETADA' AND pv.id_forma_pago = 3), 0) AS ventas_transferencia
      FROM cajas c
      LEFT JOIN usuarios ua ON c.id_usuario_apertura = ua.id_usuario
      LEFT JOIN empleados ea ON ua.id_empleado = ea.id_empleado
      LEFT JOIN usuarios uc ON c.id_usuario_cierre = uc.id_usuario
      LEFT JOIN empleados ec ON uc.id_empleado = ec.id_empleado
      ORDER BY c.id_caja DESC
    `;
    const result = await pool.query(query);
    if (result.rows.length > 0) {
      const cajasFormateadas = result.rows.map(row => {
        const mInicial = parseFloat(row.monto_inicial || 0);
        const vEfec = parseFloat(row.ventas_efectivo || 0);
        const esperado = mInicial + vEfec;
        const final = row.monto_final !== null ? parseFloat(row.monto_final) : null;
        const dif = row.diferencia !== null ? parseFloat(row.diferencia) : (final !== null ? final - esperado : null);
        return {
          ...row,
          monto_inicial: mInicial,
          monto_final: final,
          monto_esperado: esperado,
          diferencia: dif,
          ventas_efectivo: vEfec,
          ventas_tarjeta: parseFloat(row.ventas_tarjeta || 0),
          ventas_transferencia: parseFloat(row.ventas_transferencia || 0),
          total_en_caja: mInicial + vEfec,
          cajero: row.cajero_apertura || row.usuario_apertura || 'Cajero Sistema'
        };
      });
      return res.json(cajasFormateadas);
    }
    res.json(cajasHistorialFallback);
  } catch (err) {
    res.json(cajasHistorialFallback);
  }
});

// 2. GET /api/cajas/actual - Caja actualmente abierta
router.get('/actual', async (req, res) => {
  try {
    const query = `
      SELECT 
        c.*,
        u.nombre_usuario AS usuario_apertura,
        CONCAT(e.nombres, ' ', e.apellidos) AS cajero,
        COALESCE((SELECT SUM(pv.monto) FROM pagos_venta pv JOIN ventas v ON pv.id_venta = v.id_venta WHERE v.id_caja = c.id_caja AND v.estado = 'COMPLETADA' AND pv.id_forma_pago = 1), 0) AS ventas_efectivo,
        COALESCE((SELECT SUM(pv.monto) FROM pagos_venta pv JOIN ventas v ON pv.id_venta = v.id_venta WHERE v.id_caja = c.id_caja AND v.estado = 'COMPLETADA' AND pv.id_forma_pago = 2), 0) AS ventas_tarjeta,
        COALESCE((SELECT SUM(pv.monto) FROM pagos_venta pv JOIN ventas v ON pv.id_venta = v.id_venta WHERE v.id_caja = c.id_caja AND v.estado = 'COMPLETADA' AND pv.id_forma_pago = 3), 0) AS ventas_transferencia
      FROM cajas c
      JOIN usuarios u ON c.id_usuario_apertura = u.id_usuario
      LEFT JOIN empleados e ON u.id_empleado = e.id_empleado
      WHERE c.estado = 'ABIERTA'
      ORDER BY c.id_caja DESC
      LIMIT 1
    `;
    const result = await pool.query(query);
    if (result.rows.length > 0) {
      const row = result.rows[0];
      const mInicial = parseFloat(row.monto_inicial || 0);
      const vEfec = parseFloat(row.ventas_efectivo || 0);
      const total_en_caja = mInicial + vEfec;
      return res.json({
        ...row,
        monto_inicial: mInicial,
        ventas_efectivo: vEfec,
        ventas_tarjeta: parseFloat(row.ventas_tarjeta || 0),
        ventas_transferencia: parseFloat(row.ventas_transferencia || 0),
        total_en_caja,
        monto_esperado: total_en_caja,
        turno: 'Mañana (08:00 - 16:00)'
      });
    }
    res.json(cajaActual);
  } catch (err) {
    res.json(cajaActual);
  }
});

// 3. POST /api/cajas/apertura - Registrar apertura de caja
router.post('/apertura', async (req, res) => {
  const { monto_inicial, id_usuario_apertura } = req.body;
  const initialCash = parseFloat(monto_inicial || 150.00);
  const userId = parseInt(id_usuario_apertura || 1);

  try {
    // Si ya había una caja abierta, marcarla como cerrada para mantener consistencia
    await pool.query(`UPDATE cajas SET estado = 'CERRADA' WHERE estado = 'ABIERTA'`);

    const result = await pool.query(
      `INSERT INTO cajas (id_usuario_apertura, monto_inicial, estado)
       VALUES ($1, $2, 'ABIERTA') RETURNING *`,
      [userId, initialCash]
    );

    const nuevaCaja = result.rows[0];

    await registrarOperacion({
      id_usuario: userId,
      operacion: 'CREAR',
      tabla_afectada: 'cajas',
      id_registro_afectado: nuevaCaja.id_caja,
      descripcion: `Apertura de turno en Caja #${nuevaCaja.id_caja} con fondo de $${initialCash.toFixed(2)}`,
      datos_nuevos: { id_caja: nuevaCaja.id_caja, monto_inicial: initialCash }
    });

    res.status(201).json(nuevaCaja);
  } catch (err) {
    // Fallback en memoria
    cajaActual.id_caja = Date.now();
    cajaActual.monto_inicial = initialCash;
    cajaActual.ventas_efectivo = 0;
    cajaActual.ventas_tarjeta = 0;
    cajaActual.ventas_transferencia = 0;
    cajaActual.total_en_caja = initialCash;
    cajaActual.estado = 'ABIERTA';

    cajasHistorialFallback.unshift({
      ...cajaActual,
      fecha_apertura: new Date().toISOString()
    });

    res.status(201).json(cajaActual);
  }
});

// 4. POST /api/cajas/cierre - Registrar cierre de caja con cálculo de diferencia
router.post('/cierre', async (req, res) => {
  const { id_caja, id_usuario_cierre, monto_final, observacion } = req.body;
  const contadoFisico = parseFloat(monto_final !== undefined ? monto_final : 0);
  const userCierre = parseInt(id_usuario_cierre || 1);

  try {
    // 1. Obtener la caja y sumar ventas en efectivo para calcular el esperado
    const cajaRes = await pool.query(`SELECT * FROM cajas WHERE id_caja = $1 OR estado = 'ABIERTA' ORDER BY id_caja DESC LIMIT 1`, [id_caja || 1]);
    const targetCaja = cajaRes.rows[0] || { id_caja: id_caja || 1, monto_inicial: 500 };

    const ventasRes = await pool.query(
      `SELECT COALESCE(SUM(pv.monto), 0) AS total_efectivo
       FROM pagos_venta pv
       JOIN ventas v ON pv.id_venta = v.id_venta
       WHERE v.id_caja = $1 AND v.estado = 'COMPLETADA' AND pv.id_forma_pago = 1`,
      [targetCaja.id_caja]
    );

    const ventasEfectivo = parseFloat(ventasRes.rows[0]?.total_efectivo || 0);
    const montoInicial = parseFloat(targetCaja.monto_inicial || 0);
    const montoEsperado = montoInicial + ventasEfectivo;
    const diferencia = contadoFisico - montoEsperado;

    const result = await pool.query(
      `UPDATE cajas 
       SET id_usuario_cierre = $1, 
           fecha_cierre = CURRENT_TIMESTAMP, 
           monto_final = $2, 
           diferencia = $3, 
           estado = 'CERRADA'
       WHERE id_caja = $4 RETURNING *`,
      [userCierre, contadoFisico, diferencia, targetCaja.id_caja]
    );

    const cajaCerrada = result.rows[0];

    await registrarOperacion({
      id_usuario: userCierre,
      operacion: 'MODIFICAR',
      tabla_afectada: 'cajas',
      id_registro_afectado: targetCaja.id_caja,
      descripcion: `Cierre de turno en Caja #${targetCaja.id_caja}. Contado: $${contadoFisico.toFixed(2)}, Esperado: $${montoEsperado.toFixed(2)}, Diferencia: $${diferencia.toFixed(2)}`,
      datos_nuevos: { monto_final: contadoFisico, diferencia, estado: 'CERRADA' }
    });

    res.json({
      message: 'Caja cerrada exitosamente',
      caja: {
        ...cajaCerrada,
        monto_esperado: montoEsperado,
        ventas_efectivo: ventasEfectivo,
        diferencia
      }
    });
  } catch (err) {
    const mInicial = parseFloat(cajaActual.monto_inicial || 500);
    const vEfec = parseFloat(cajaActual.ventas_efectivo || 0);
    const montoEsperado = mInicial + vEfec;
    const diferencia = contadoFisico - montoEsperado;

    cajaActual.estado = 'CERRADA';
    cajaActual.monto_final = contadoFisico;
    cajaActual.diferencia = diferencia;
    cajaActual.fecha_cierre = new Date().toISOString();

    const targetH = cajasHistorialFallback.find(c => c.id_caja === cajaActual.id_caja);
    if (targetH) {
      targetH.estado = 'CERRADA';
      targetH.monto_final = contadoFisico;
      targetH.diferencia = diferencia;
      targetH.fecha_cierre = new Date().toISOString();
    }

    res.json({
      message: 'Caja cerrada exitosamente',
      caja: {
        ...cajaActual,
        monto_esperado: montoEsperado,
        diferencia
      }
    });
  }
});

module.exports = router;


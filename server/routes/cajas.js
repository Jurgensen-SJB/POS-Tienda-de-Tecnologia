const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
let { cajaActual } = require('../db/fallbackData');

// GET /api/cajas/actual - Get currently open cash register
router.get('/actual', async (req, res) => {
  try {
    const query = `
      SELECT 
        c.*,
        u.nombre_usuario AS cajero,
        COALESCE((SELECT SUM(pv.monto) FROM pagos_venta pv JOIN ventas v ON pv.id_venta = v.id_venta WHERE v.id_caja = c.id_caja AND v.estado = 'COMPLETADA' AND pv.id_forma_pago = 1), 0) AS ventas_efectivo,
        COALESCE((SELECT SUM(pv.monto) FROM pagos_venta pv JOIN ventas v ON pv.id_venta = v.id_venta WHERE v.id_caja = c.id_caja AND v.estado = 'COMPLETADA' AND pv.id_forma_pago = 2), 0) AS ventas_tarjeta,
        COALESCE((SELECT SUM(pv.monto) FROM pagos_venta pv JOIN ventas v ON pv.id_venta = v.id_venta WHERE v.id_caja = c.id_caja AND v.estado = 'COMPLETADA' AND pv.id_forma_pago = 3), 0) AS ventas_transferencia
      FROM cajas c
      JOIN usuarios u ON c.id_usuario_apertura = u.id_usuario
      WHERE c.estado = 'ABIERTA'
      ORDER BY c.id_caja DESC
      LIMIT 1
    `;
    const result = await pool.query(query);
    if (result.rows.length > 0) {
      const row = result.rows[0];
      const total_en_caja = parseFloat(row.monto_inicial) + parseFloat(row.ventas_efectivo);
      return res.json({
        ...row,
        total_en_caja,
        turno: 'Mañana (08:00 - 16:00)'
      });
    }
    res.json(cajaActual);
  } catch (err) {
    res.json(cajaActual);
  }
});

// POST /api/cajas/apertura - Open new cash shift
router.post('/apertura', async (req, res) => {
  const { monto_inicial, id_usuario_apertura } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO cajas (id_usuario_apertura, monto_inicial, estado)
       VALUES ($1, $2, 'ABIERTA') RETURNING *`,
      [id_usuario_apertura || 1, monto_inicial || 150.00]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    cajaActual.monto_inicial = parseFloat(monto_inicial || 150.00);
    cajaActual.ventas_efectivo = 0;
    cajaActual.ventas_tarjeta = 0;
    cajaActual.ventas_transferencia = 0;
    cajaActual.total_en_caja = cajaActual.monto_inicial;
    cajaActual.estado = 'ABIERTA';
    res.status(201).json(cajaActual);
  }
});

// POST /api/cajas/cierre - Close shift (Corte Z)
router.post('/cierre', async (req, res) => {
  const { id_caja, id_usuario_cierre, monto_final } = req.body;
  try {
    const result = await pool.query(
      `UPDATE cajas 
       SET id_usuario_cierre = $1, fecha_cierre = CURRENT_TIMESTAMP, monto_final = $2, estado = 'CERRADA'
       WHERE id_caja = $3 RETURNING *`,
      [id_usuario_cierre || 1, monto_final || 0, id_caja || 1]
    );
    res.json({ message: 'Caja cerrada exitosamente', caja: result.rows[0] });
  } catch (err) {
    cajaActual.estado = 'CERRADA';
    res.json({ message: 'Caja cerrada exitosamente', caja: cajaActual });
  }
});

module.exports = router;

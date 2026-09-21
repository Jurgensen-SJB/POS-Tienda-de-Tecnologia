const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');

// In-memory fallback logs
const fallbackLogs = [
  {
    id_registro: 1,
    id_usuario: 1,
    usuario: 'elena.morales',
    rol: 'Administrador General',
    operacion: 'CREAR',
    tabla_afectada: 'cajas',
    id_registro_afectado: 1,
    fecha_hora: new Date(Date.now() - 3600000 * 3).toISOString(),
    descripcion: 'Apertura de turno en Caja 01 con fondo inicial $150.00',
    datos_nuevos: { monto_inicial: 150.0, estado: 'ABIERTA' }
  },
  {
    id_registro: 2,
    id_usuario: 1,
    usuario: 'elena.morales',
    rol: 'Administrador General',
    operacion: 'CREAR',
    tabla_afectada: 'productos',
    id_registro_afectado: 1,
    fecha_hora: new Date(Date.now() - 3600000 * 2).toISOString(),
    descripcion: 'Registro de nuevo producto iPhone 15 Pro 128GB',
    datos_nuevos: { codigo: 'SKU-TEC-001', precio_venta: 1199.99 }
  },
  {
    id_registro: 3,
    id_usuario: 3,
    usuario: 'camila.valenzuela',
    rol: 'Cajero',
    operacion: 'CREAR',
    tabla_afectada: 'ventas',
    id_registro_afectado: 1,
    fecha_hora: new Date(Date.now() - 3600000 * 1).toISOString(),
    descripcion: 'Venta completada FAC-00892 por $138.09',
    datos_nuevos: { total: 138.09, id_cliente: 1 }
  },
  {
    id_registro: 4,
    id_usuario: 2,
    usuario: 'rodrigo.alarcon',
    rol: 'Supervisor',
    operacion: 'ANULAR',
    tabla_afectada: 'ventas',
    id_registro_afectado: 2,
    fecha_hora: new Date(Date.now() - 1800000).toISOString(),
    descripcion: 'Anulación de comprobante FAC-002339 ($58.50) con reposición de inventario',
    datos_anteriores: { estado: 'COMPLETADA' },
    datos_nuevos: { estado: 'ANULADA' }
  }
];

// Helper to record an operation
async function registrarOperacion({
  id_usuario = 1,
  usuario = 'admin',
  rol = 'Administrador',
  operacion = 'CREAR',
  tabla_afectada,
  id_registro_afectado = 0,
  descripcion = '',
  datos_anteriores = null,
  datos_nuevos = null
}) {
  const timestamp = new Date().toISOString();

  // 1. Try writing to PostgreSQL
  try {
    await pool.query(`
      INSERT INTO registro_operaciones 
        (id_usuario, operacion, tabla_afectada, id_registro_afectado, fecha_hora, datos_anteriores, datos_nuevos)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      id_usuario,
      operacion,
      tabla_afectada,
      id_registro_afectado,
      new Date(),
      datos_anteriores ? JSON.stringify(datos_anteriores) : null,
      datos_nuevos ? JSON.stringify(datos_nuevos) : null
    ]);
  } catch (err) {
    // If PostgreSQL fails or is not connected, use fallback
  }

  // 2. Add to in-memory store
  const newLog = {
    id_registro: fallbackLogs.length + 1,
    id_usuario,
    usuario,
    rol,
    operacion,
    tabla_afectada,
    id_registro_afectado,
    fecha_hora: timestamp,
    descripcion: descripcion || `${operacion} en ${tabla_afectada} (ID #${id_registro_afectado})`,
    datos_anteriores,
    datos_nuevos
  };
  fallbackLogs.unshift(newLog);
  return newLog;
}

// GET /api/auditoria - List all audit logs
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        r.id_registro,
        r.id_usuario,
        u.nombre_usuario AS usuario,
        rol.nombre AS rol,
        r.operacion,
        r.tabla_afectada,
        r.id_registro_afectado,
        r.fecha_hora,
        r.datos_anteriores,
        r.datos_nuevos
      FROM registro_operaciones r
      LEFT JOIN usuarios u ON r.id_usuario = u.id_usuario
      LEFT JOIN roles rol ON u.id_rol = rol.id_rol
      ORDER BY r.fecha_hora DESC
      LIMIT 100
    `);
    if (result.rows.length > 0) {
      return res.json(result.rows);
    }
  } catch (err) {
    // Fallback to memory
  }

  return res.json(fallbackLogs);
});

// POST /api/auditoria - Manually record an operation
router.post('/', async (req, res) => {
  const {
    id_usuario,
    usuario,
    rol,
    operacion,
    tabla_afectada,
    id_registro_afectado,
    descripcion,
    datos_anteriores,
    datos_nuevos
  } = req.body;

  if (!operacion || !tabla_afectada) {
    return res.status(400).json({ error: 'Operación y tabla afectada son obligatorias' });
  }

  const log = await registrarOperacion({
    id_usuario: id_usuario || 1,
    usuario: usuario || 'usuario',
    rol: rol || 'Usuario',
    operacion,
    tabla_afectada,
    id_registro_afectado: id_registro_afectado || 0,
    descripcion,
    datos_anteriores,
    datos_nuevos
  });

  return res.status(201).json(log);
});

module.exports = {
  router,
  registrarOperacion
};

const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { employees } = require('../db/fallbackData');

// GET /api/empleados
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        e.*,
        u.id_usuario,
        u.nombre_usuario,
        r.nombre AS rol
      FROM empleados e
      LEFT JOIN usuarios u ON e.id_empleado = u.id_empleado
      LEFT JOIN roles r ON u.id_rol = r.id_rol
      WHERE e.estado = 'ACTIVO'
      ORDER BY e.id_empleado ASC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.json(employees);
  }
});

// POST /api/empleados
router.post('/', async (req, res) => {
  const { tipo_identificacion, numero_identificacion, nombres, apellidos, correo, cargo, rol, nombre_usuario, password } = req.body;

  if (!numero_identificacion || !nombres || !apellidos) {
    return res.status(400).json({ error: 'Identificación, nombres y apellidos son requeridos' });
  }

  const client = await pool.connect().catch(() => null);
  if (client) {
    try {
      await client.query('BEGIN');
      const empRes = await client.query(
        `INSERT INTO empleados (tipo_identificacion, numero_identificacion, nombres, apellidos, correo, cargo, fecha_ingreso)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE) RETURNING *`,
        [tipo_identificacion || 'DNI', numero_identificacion, nombres, apellidos, correo || '', cargo || 'Cajero']
      );
      const newEmp = empRes.rows[0];

      if (nombre_usuario) {
        // Map rol to id_rol: Administrador (1), Supervisor (2), Cajero (3)
        let id_rol = 3;
        if (rol === 'Administrador') id_rol = 1;
        else if (rol === 'Supervisor de Caja' || rol === 'Supervisor') id_rol = 2;

        await client.query(
          `INSERT INTO usuarios (id_empleado, id_rol, nombre_usuario, password_hash)
           VALUES ($1, $2, $3, $4)`,
          [newEmp.id_empleado, id_rol, nombre_usuario, password || 'default_hash']
        );
      }

      await client.query('COMMIT');
      newEmp.rol = rol || 'Cajero';
      return res.status(201).json(newEmp);
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('DB error adding employee:', err.message);
    } finally {
      client.release();
    }
  }

  const newEmp = {
    id_empleado: employees.length + 1,
    tipo_identificacion: tipo_identificacion || 'DNI',
    numero_identificacion,
    nombres,
    apellidos,
    correo: correo || '',
    cargo: cargo || 'Cajero',
    rol: rol || 'Cajero',
    estado: 'ACTIVO'
  };
  employees.push(newEmp);
  res.status(201).json(newEmp);
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { employees } = require('../db/fallbackData');
const { registrarOperacion } = require('./auditoria');

// Helper to map role name to id_rol
const getRoleId = (roleName) => {
  if (!roleName) return 3;
  const r = roleName.toLowerCase();
  if (r.includes('admin')) return 1;
  if (r.includes('supervis')) return 2;
  return 3;
};

// 1. CONSULTAR EMPLEADOS (Listado con filtros opcionales)
// GET /api/empleados
router.get('/', async (req, res) => {
  const { estado, q } = req.query;

  try {
    let query = `
      SELECT 
        e.*,
        u.id_usuario,
        u.nombre_usuario,
        COALESCE(r.nombre, e.cargo, 'Cajero') AS rol
      FROM empleados e
      LEFT JOIN usuarios u ON e.id_empleado = u.id_empleado
      LEFT JOIN roles r ON u.id_rol = r.id_rol
      WHERE 1=1
    `;
    const params = [];

    if (estado && estado !== 'TODOS') {
      params.push(estado.toUpperCase());
      query += ` AND e.estado = $${params.length}`;
    }

    if (q) {
      params.push(`%${q.toLowerCase()}%`);
      query += ` AND (LOWER(e.nombres) LIKE $${params.length} OR LOWER(e.apellidos) LIKE $${params.length} OR LOWER(e.numero_identificacion) LIKE $${params.length} OR LOWER(COALESCE(e.cargo, '')) LIKE $${params.length})`;
    }

    query += ` ORDER BY e.id_empleado ASC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    let filtered = [...employees];
    if (estado && estado !== 'TODOS') {
      filtered = filtered.filter(e => (e.estado || 'ACTIVO').toUpperCase() === estado.toUpperCase());
    }
    if (q) {
      const term = q.toLowerCase();
      filtered = filtered.filter(e => 
        (e.nombres && e.nombres.toLowerCase().includes(term)) ||
        (e.apellidos && e.apellidos.toLowerCase().includes(term)) ||
        (e.numero_identificacion && e.numero_identificacion.includes(term)) ||
        (e.cargo && e.cargo.toLowerCase().includes(term))
      );
    }
    res.json(filtered);
  }
});

// 2. CONSULTAR UN EMPLEADO POR ID
// GET /api/empleados/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT 
        e.*,
        u.id_usuario,
        u.nombre_usuario,
        COALESCE(r.nombre, e.cargo, 'Cajero') AS rol
      FROM empleados e
      LEFT JOIN usuarios u ON e.id_empleado = u.id_empleado
      LEFT JOIN roles r ON u.id_rol = r.id_rol
      WHERE e.id_empleado = $1
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    const emp = employees.find(e => e.id_empleado === parseInt(id));
    if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' });
    res.json(emp);
  }
});

// 3. REGISTRAR EMPLEADO
// POST /api/empleados
router.post('/', async (req, res) => {
  const {
    tipo_identificacion = 'DNI',
    numero_identificacion,
    nombres,
    apellidos,
    telefono = '',
    correo = '',
    cargo = 'Cajero',
    rol = 'Cajero',
    nombre_usuario,
    password,
    id_usuario = 1
  } = req.body;

  if (!numero_identificacion || !nombres || !apellidos) {
    return res.status(400).json({ error: 'Identificación, nombres y apellidos son obligatorios' });
  }

  const client = await pool.connect().catch(() => null);
  if (client) {
    try {
      await client.query('BEGIN');
      const empRes = await client.query(
        `INSERT INTO empleados (tipo_identificacion, numero_identificacion, nombres, apellidos, telefono, correo, cargo, estado, fecha_ingreso)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVO', CURRENT_DATE) RETURNING *`,
        [tipo_identificacion, numero_identificacion, nombres, apellidos, telefono, correo, cargo]
      );
      const newEmp = empRes.rows[0];

      if (nombre_usuario) {
        const id_rol = getRoleId(rol);
        await client.query(
          `INSERT INTO usuarios (id_empleado, id_rol, nombre_usuario, password_hash, estado)
           VALUES ($1, $2, $3, $4, 'ACTIVO')`,
          [newEmp.id_empleado, id_rol, nombre_usuario, password || 'default_hash']
        );
      }

      await client.query('COMMIT');
      newEmp.rol = rol;
      newEmp.nombre_usuario = nombre_usuario || '';

      await registrarOperacion({
        id_usuario,
        operacion: 'CREAR',
        tabla_afectada: 'empleados',
        id_registro_afectado: newEmp.id_empleado,
        descripcion: `Registro de colaborador: ${newEmp.nombres} ${newEmp.apellidos} (${newEmp.cargo})`,
        datos_nuevos: newEmp
      });

      return res.status(201).json(newEmp);
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('DB error adding employee:', err.message);
    } finally {
      client.release();
    }
  }

  // Fallback in-memory
  const newEmp = {
    id_empleado: Date.now(),
    tipo_identificacion,
    numero_identificacion,
    nombres,
    apellidos,
    telefono,
    correo,
    cargo,
    rol,
    nombre_usuario: nombre_usuario || '',
    estado: 'ACTIVO',
    fecha_ingreso: new Date().toISOString().split('T')[0]
  };
  employees.push(newEmp);
  res.status(201).json(newEmp);
});

// 4. MODIFICAR EMPLEADO
// PUT /api/empleados/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    tipo_identificacion,
    numero_identificacion,
    nombres,
    apellidos,
    telefono,
    correo,
    cargo,
    rol,
    estado,
    id_usuario = 1
  } = req.body;

  if (!nombres || !apellidos) {
    return res.status(400).json({ error: 'Nombres y apellidos son obligatorios' });
  }

  const client = await pool.connect().catch(() => null);
  if (client) {
    try {
      await client.query('BEGIN');
      const updateRes = await client.query(
        `UPDATE empleados
         SET tipo_identificacion = COALESCE($1, tipo_identificacion),
             numero_identificacion = COALESCE($2, numero_identificacion),
             nombres = $3,
             apellidos = $4,
             telefono = COALESCE($5, telefono),
             correo = COALESCE($6, correo),
             cargo = COALESCE($7, cargo),
             estado = COALESCE($8, estado)
         WHERE id_empleado = $9
         RETURNING *`,
        [tipo_identificacion, numero_identificacion, nombres, apellidos, telefono, correo, cargo, estado, id]
      );

      if (updateRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Empleado no encontrado' });
      }

      const updatedEmp = updateRes.rows[0];

      // Update rol in usuarios if rol provided
      if (rol) {
        const id_rol = getRoleId(rol);
        await client.query(
          `UPDATE usuarios SET id_rol = $1 WHERE id_empleado = $2`,
          [id_rol, id]
        );
      }

      await client.query('COMMIT');
      updatedEmp.rol = rol || updatedEmp.cargo;
      await registrarOperacion({
        id_usuario,
        operacion: 'MODIFICAR',
        tabla_afectada: 'empleados',
        id_registro_afectado: parseInt(id),
        descripcion: `Modificación de datos de colaborador #${id}: ${nombres} ${apellidos}`,
        datos_nuevos: updatedEmp
      });
      return res.json(updatedEmp);
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('DB error updating employee:', err.message);
    } finally {
      client.release();
    }
  }

  // Fallback in-memory
  const empIndex = employees.findIndex(e => e.id_empleado === parseInt(id));
  if (empIndex === -1) return res.status(404).json({ error: 'Empleado no encontrado' });

  employees[empIndex] = {
    ...employees[empIndex],
    ...(tipo_identificacion && { tipo_identificacion }),
    ...(numero_identificacion && { numero_identificacion }),
    nombres,
    apellidos,
    ...(telefono !== undefined && { telefono }),
    ...(correo !== undefined && { correo }),
    ...(cargo && { cargo }),
    ...(rol && { rol }),
    ...(estado && { estado })
  };

  await registrarOperacion({
    id_usuario,
    operacion: 'MODIFICAR',
    tabla_afectada: 'empleados',
    id_registro_afectado: parseInt(id),
    descripcion: `Modificación de datos de colaborador #${id}: ${nombres} ${apellidos}`,
    datos_nuevos: employees[empIndex]
  });

  res.json(employees[empIndex]);
});

// 5. DESACTIVAR / ACTIVAR EMPLEADO
// PATCH /api/empleados/:id/estado
router.patch('/:id/estado', async (req, res) => {
  const { id } = req.params;
  const { estado, id_usuario = 1 } = req.body;

  if (!estado || !['ACTIVO', 'INACTIVO'].includes(estado.toUpperCase())) {
    return res.status(400).json({ error: 'Estado debe ser ACTIVO o INACTIVO' });
  }

  const targetEstado = estado.toUpperCase();

  const client = await pool.connect().catch(() => null);
  if (client) {
    try {
      await client.query('BEGIN');
      const result = await client.query(
        `UPDATE empleados SET estado = $1 WHERE id_empleado = $2 RETURNING *`,
        [targetEstado, id]
      );

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Empleado no encontrado' });
      }

      // Also update usuario status if exists
      await client.query(
        `UPDATE usuarios SET estado = $1 WHERE id_empleado = $2`,
        [targetEstado, id]
      );

      await client.query('COMMIT');
      await registrarOperacion({
        id_usuario,
        operacion: targetEstado === 'ACTIVO' ? 'MODIFICAR' : 'DESACTIVAR',
        tabla_afectada: 'empleados',
        id_registro_afectado: parseInt(id),
        descripcion: `Cambio de estado de colaborador #${id} a ${targetEstado}`,
        datos_nuevos: { estado: targetEstado }
      });
      return res.json({ success: true, message: `Empleado ${targetEstado.toLowerCase()} correctamente`, empleado: result.rows[0] });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('DB error toggling employee status:', err.message);
    } finally {
      client.release();
    }
  }

  // Fallback in-memory
  const emp = employees.find(e => e.id_empleado === parseInt(id));
  if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' });
  emp.estado = targetEstado;
  await registrarOperacion({
    id_usuario,
    operacion: targetEstado === 'ACTIVO' ? 'MODIFICAR' : 'DESACTIVAR',
    tabla_afectada: 'empleados',
    id_registro_afectado: parseInt(id),
    descripcion: `Cambio de estado de colaborador #${id} a ${targetEstado}`,
    datos_nuevos: { estado: targetEstado }
  });
  res.json({ success: true, message: `Empleado ${targetEstado.toLowerCase()} correctamente`, empleado: emp });
});

// 6a. CONSULTAR CREDENCIALES DE UN EMPLEADO (solo Admin)
// GET /api/empleados/:id/credenciales
router.get('/:id/credenciales', async (req, res) => {
  const { id } = req.params;

  // Helper: detectar si es hash bcrypt (no es contrasena en texto plano)
  const isHash = (str) => str && (str.startsWith('$2b$') || str.startsWith('$2a$') || str.startsWith('$2y$') || str.includes('placeholder'));

  // Buscar contrasena en texto plano desde el fallback (para cuando la BD guarda hash)
  const getPlainFromFallback = (empId) => {
    const emp = employees.find(e => e.id_empleado === parseInt(empId));
    return emp?.password || '';
  };

  try {
    const result = await pool.query(
      `SELECT u.nombre_usuario, u.password_hash AS password, u.estado
       FROM usuarios u
       WHERE u.id_empleado = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.json({ nombre_usuario: '', password: '', estado: 'SIN_USUARIO' });
    }

    const u = result.rows[0];
    // Si el campo es un hash bcrypt, devolver la contrasena del fallback (texto plano)
    const password = isHash(u.password) ? getPlainFromFallback(id) : (u.password || '');

    return res.json({
      nombre_usuario: u.nombre_usuario || '',
      password,
      estado: u.estado || 'ACTIVO',
      es_hash: isHash(u.password) // indicar si se esta usando fallback
    });
  } catch (err) {
    // Fallback en memoria cuando la BD no esta disponible
    const emp = employees.find(e => e.id_empleado === parseInt(id));
    if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' });
    return res.json({
      nombre_usuario: emp.nombre_usuario || '',
      password: emp.password || '',
      estado: emp.estado || 'ACTIVO'
    });
  }
});

// 6b. ACTUALIZAR CREDENCIALES DE ACCESO (solo Admin)
// PATCH /api/empleados/:id/credenciales
router.patch('/:id/credenciales', async (req, res) => {
  const { id } = req.params;
  const { nombre_usuario, password, nueva_password, id_usuario = 1 } = req.body;

  if (!nombre_usuario) {
    return res.status(400).json({ error: 'El nombre de usuario es obligatorio' });
  }

  const client = await pool.connect().catch(() => null);
  if (client) {
    try {
      await client.query('BEGIN');

      // Verificar si ya tiene usuario asociado
      const checkRes = await client.query(
        'SELECT id_usuario, nombre_usuario FROM usuarios WHERE id_empleado = $1',
        [id]
      );

      if (checkRes.rows.length > 0) {
        // Actualizar credenciales existentes
        if (nueva_password) {
          await client.query(
            'UPDATE usuarios SET nombre_usuario = $1, password_hash = $2 WHERE id_empleado = $3',
            [nombre_usuario.trim().toLowerCase(), nueva_password, id]
          );
        } else {
          await client.query(
            'UPDATE usuarios SET nombre_usuario = $1 WHERE id_empleado = $2',
            [nombre_usuario.trim().toLowerCase(), id]
          );
        }
      } else {
        // Crear nuevo usuario para el empleado
        const empRes = await client.query(
          'SELECT id_empleado FROM empleados WHERE id_empleado = $1',
          [id]
        );
        if (empRes.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'Empleado no encontrado' });
        }
        await client.query(
          `INSERT INTO usuarios (id_empleado, id_rol, nombre_usuario, password_hash, estado)
           VALUES ($1, 3, $2, $3, 'ACTIVO')`,
          [id, nombre_usuario.trim().toLowerCase(), nueva_password || password || 'temporal123']
        );
      }

      await client.query('COMMIT');

      await registrarOperacion({
        id_usuario,
        operacion: 'MODIFICAR',
        tabla_afectada: 'usuarios',
        id_registro_afectado: parseInt(id),
        descripcion: `Actualización de credenciales de acceso para empleado #${id}`,
        datos_nuevos: { nombre_usuario, password_updated: Boolean(nueva_password) }
      });

      return res.json({ success: true, message: 'Credenciales actualizadas correctamente' });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('DB error updating credentials:', err.message);
      return res.status(500).json({ error: 'Error al actualizar credenciales: ' + err.message });
    } finally {
      client.release();
    }
  }

  // Fallback in-memory: actualizar en systemAccounts del auth (simulado)
  const emp = employees.find(e => e.id_empleado === parseInt(id));
  if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' });
  emp.nombre_usuario = nombre_usuario.trim().toLowerCase();
  if (nueva_password) emp.password = nueva_password;
  return res.json({ success: true, message: 'Credenciales actualizadas (modo local)' });
});

// DELETE /api/empleados/:id (soft-delete / desactivar)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect().catch(() => null);
  if (client) {
    try {
      const result = await client.query(
        `UPDATE empleados SET estado = 'INACTIVO' WHERE id_empleado = $1 RETURNING *`,
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Empleado no encontrado' });
      }
      await client.query(`UPDATE usuarios SET estado = 'INACTIVO' WHERE id_empleado = $1`, [id]);
      return res.json({ success: true, message: 'Empleado desactivado', empleado: result.rows[0] });
    } catch (err) {
      console.error('DB error deactivating employee:', err.message);
    } finally {
      client.release();
    }
  }

  const emp = employees.find(e => e.id_empleado === parseInt(id));
  if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' });
  emp.estado = 'INACTIVO';
  res.json({ success: true, message: 'Empleado desactivado', empleado: emp });
});

module.exports = router;

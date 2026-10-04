const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { employees } = require('../db/fallbackData');

// Permisos por rol (fallback)
const ROL_PERMISOS_FALLBACK = {
  admin:      ['ver_pos','cobrar','aplicar_descuento','anular_venta','ver_caja','abrir_caja','cerrar_caja','corte_parcial','ver_inventario','crear_producto','editar_producto','ver_clientes','crear_cliente','ver_empleados','crear_empleado','ver_auditoria','ver_compras','crear_compra'],
  supervisor: ['ver_pos','cobrar','aplicar_descuento','anular_venta','ver_caja','abrir_caja','cerrar_caja','corte_parcial','ver_inventario','ver_clientes','crear_cliente','ver_empleados'],
  cajero:     ['ver_pos','cobrar','ver_caja','ver_clientes'],
};

// Avatares conocidos
const AVATARS = {
  1: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
  2: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  3: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80'
};

// Helper para verificar si un identificador ingresado coincide con un usuario o empleado
function matchesIdentifier(userOrEmp, cleanId) {
  if (!userOrEmp || !cleanId) return false;
  const username = (userOrEmp.nombre_usuario || '').toLowerCase();
  const email = (userOrEmp.correo || '').toLowerCase();
  const emailPrefix = email ? email.split('@')[0].toLowerCase() : '';
  const fullNameSlug = (userOrEmp.nombres && userOrEmp.apellidos)
    ? `${userOrEmp.nombres.toLowerCase()}.${userOrEmp.apellidos.toLowerCase()}`
    : '';

  // Coincidencias directas
  if (username && username === cleanId) return true;
  if (email && email === cleanId) return true;
  if (emailPrefix && emailPrefix === cleanId) return true;
  if (fullNameSlug && fullNameSlug === cleanId) return true;

  // Alias específicos para empleados predeterminados
  const idEmp = userOrEmp.id_empleado || userOrEmp.id_usuario;
  if (idEmp === 1 && (cleanId === 'admin' || cleanId === 'elena' || cleanId === 'elena.morales')) return true;
  if (idEmp === 2 && (cleanId === 'supervisor' || cleanId === 'rodrigo' || cleanId === 'rodrigo.alarcon')) return true;
  if (idEmp === 3 && (cleanId === 'cajero' || cleanId === 'camila' || cleanId === 'camila.valenzuela')) return true;

  return false;
}

// Obtener todas las cuentas activas y fallback unificadas
function getUnifiedAccounts() {
  return employees.map(emp => {
    const isAdmin = (emp.rol || emp.cargo || '').toLowerCase().includes('admin');
    const isSupervisor = (emp.rol || emp.cargo || '').toLowerCase().includes('supervis');
    const rol = isAdmin ? 'Administrador General' : (isSupervisor ? 'Supervisor' : 'Cajero');
    const rolKey = isAdmin ? 'admin' : (isSupervisor ? 'supervisor' : 'cajero');

    return {
      id_usuario: emp.id_empleado,
      id_empleado: emp.id_empleado,
      nombre_completo: `${emp.nombres || ''} ${emp.apellidos || ''}`.trim(),
      correo: emp.correo || '',
      nombre_usuario: emp.nombre_usuario || (emp.correo ? emp.correo.split('@')[0] : `user${emp.id_empleado}`),
      password: emp.password || 'caja123',
      rol,
      cargo: emp.cargo || rol,
      estado: emp.estado || 'ACTIVO',
      avatar: AVATARS[emp.id_empleado] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      permisos: ROL_PERMISOS_FALLBACK[rolKey] || ROL_PERMISOS_FALLBACK.cajero
    };
  });
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Ingresa correo o usuario y contraseña' });
  }

  const cleanId = identifier.trim().toLowerCase();

  // 1. Try checking PostgreSQL if connected
  try {
    const query = `
      SELECT 
        u.id_usuario,
        u.nombre_usuario,
        u.password_hash,
        u.estado AS usuario_estado,
        e.id_empleado,
        e.nombres,
        e.apellidos,
        e.correo,
        e.cargo,
        e.estado AS empleado_estado,
        r.nombre AS rol_nombre
      FROM usuarios u
      JOIN empleados e ON u.id_empleado = e.id_empleado
      JOIN roles r ON u.id_rol = r.id_rol
      WHERE LOWER(u.nombre_usuario) = $1 
         OR LOWER(e.correo) = $1
         OR LOWER(SPLIT_PART(e.correo, '@', 1)) = $1
         OR (e.id_empleado = 2 AND ($1 = 'rodrigo.alarcon' OR $1 = 'supervisor'))
         OR (e.id_empleado = 1 AND ($1 = 'admin' OR $1 = 'elena.morales'))
         OR (e.id_empleado = 3 AND ($1 = 'cajero' OR $1 = 'camila.valenzuela'))
    `;
    const result = await pool.query(query, [cleanId]);
    if (result.rows.length > 0) {
      const user = result.rows[0];

      // Verificar si el usuario o empleado está inactivo
      const usuarioInactivo = (user.usuario_estado || 'ACTIVO').toUpperCase() === 'INACTIVO';
      const empleadoInactivo = (user.empleado_estado || 'ACTIVO').toUpperCase() === 'INACTIVO';
      if (usuarioInactivo || empleadoInactivo) {
        return res.status(403).json({ 
          error: 'Cuenta inactiva. Tu usuario ha sido desactivado. Contacta al administrador del sistema.',
          codigo: 'USUARIO_INACTIVO'
        });
      }

      // Check password: match plaintext, bcrypt placeholder match, or fallback data
      const empFallback = employees.find(e => e.id_empleado === user.id_empleado);
      const valid = user.password_hash === password 
        || (empFallback && empFallback.password === password)
        || (user.id_empleado === 1 && password === 'admin123')
        || (user.id_empleado === 2 && password === 'caja123')
        || (user.id_empleado === 3 && password === 'cajero123');

      if (valid) {
        const isAdmin = (user.rol_nombre || '').toLowerCase().includes('admin');
        const isSupervisor = (user.rol_nombre || '').toLowerCase().includes('supervis');
        const rol = isAdmin ? 'Administrador General' : (isSupervisor ? 'Supervisor' : 'Cajero');
        const rolKey = isAdmin ? 'admin' : (isSupervisor ? 'supervisor' : 'cajero');

        // Try to fetch permissions from DB
        let permisos = ROL_PERMISOS_FALLBACK[rolKey];
        try {
          const pResult = await pool.query(`
            SELECT p.nombre FROM rol_permiso rp
            JOIN permisos p ON rp.id_permiso = p.id_permiso
            WHERE rp.id_rol = u.id_rol
          `);
          if (pResult.rows.length > 0) permisos = pResult.rows.map(r => r.nombre);
        } catch { /* use fallback */ }

        return res.json({
          id_usuario: user.id_usuario,
          id_empleado: user.id_empleado,
          nombre_completo: `${user.nombres} ${user.apellidos}`.trim(),
          correo: user.correo,
          nombre_usuario: user.nombre_usuario,
          rol,
          cargo: user.cargo,
          estado: 'ACTIVO',
          permisos,
          avatar: AVATARS[user.id_empleado] || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80'
        });
      }
    }
  } catch (err) {
    // Fall through to memory check
  }

  // 2. Memory / fallback matching
  const allAccounts = getUnifiedAccounts();
  const account = allAccounts.find(a => matchesIdentifier(a, cleanId));

  if (account) {
    // Verificar estado en fallback
    if ((account.estado || 'ACTIVO').toUpperCase() === 'INACTIVO') {
      return res.status(403).json({ 
        error: 'Cuenta inactiva. Tu usuario ha sido desactivado. Contacta al administrador del sistema.',
        codigo: 'USUARIO_INACTIVO'
      });
    }

    if (account.password === password) {
      const { password: _, ...userSafe } = account;
      return res.json(userSafe);
    }
  }

  return res.status(401).json({ error: 'Credenciales inválidas. Verifica tu correo/usuario y contraseña.' });
});

// GET /api/auth/accounts - List public accounts info for quick switch / login presets
router.get('/accounts', (req, res) => {
  const publicAccounts = getUnifiedAccounts().map(({ password, ...rest }) => rest);
  res.json(publicAccounts);
});

module.exports = router;


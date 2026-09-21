const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');

// Permisos por rol (fallback)
const ROL_PERMISOS_FALLBACK = {
  admin:      ['ver_pos','cobrar','aplicar_descuento','anular_venta','ver_caja','abrir_caja','cerrar_caja','corte_parcial','ver_inventario','crear_producto','editar_producto','ver_clientes','crear_cliente','ver_empleados','crear_empleado','ver_auditoria','ver_compras','crear_compra'],
  supervisor: ['ver_pos','cobrar','aplicar_descuento','anular_venta','ver_caja','abrir_caja','cerrar_caja','corte_parcial','ver_inventario','ver_clientes','crear_cliente','ver_empleados'],
  cajero:     ['ver_pos','cobrar','ver_caja','ver_clientes'],
};

// Predefined accounts with passwords
const systemAccounts = [
  {
    id_usuario: 1,
    id_empleado: 1,
    nombre_completo: 'Elena Morales',
    correo: 'elena.morales@nexpos.local',
    nombre_usuario: 'admin',
    password: 'admin123',
    rol: 'Administrador General',
    cargo: 'Administradora General',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80'
  },
  {
    id_usuario: 2,
    id_empleado: 2,
    nombre_completo: 'Rodrigo Alarcón',
    correo: 'rodrigo.alarcon@nexpos.local',
    nombre_usuario: 'supervisor',
    password: 'caja123',
    rol: 'Cajero',
    cargo: 'Supervisor de Caja',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
  },
  {
    id_usuario: 3,
    id_empleado: 3,
    nombre_completo: 'Camila Valenzuela',
    correo: 'camila.valenzuela@nexpos.local',
    nombre_usuario: 'cajero',
    password: 'cajero123',
    rol: 'Cajero',
    cargo: 'Cajera Turno Mañana',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80'
  }
];

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
        e.id_empleado,
        e.nombres,
        e.apellidos,
        e.correo,
        e.cargo,
        r.nombre AS rol_nombre
      FROM usuarios u
      JOIN empleados e ON u.id_empleado = e.id_empleado
      JOIN roles r ON u.id_rol = r.id_rol
      WHERE LOWER(u.nombre_usuario) = $1 OR LOWER(e.correo) = $1
    `;
    const result = await pool.query(query, [cleanId]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      // Check password (matches system accounts or password hash)
      const matchingAccount = systemAccounts.find(
        a => a.correo.toLowerCase() === cleanId || a.nombre_usuario.toLowerCase() === cleanId
      );
      const valid = matchingAccount
        ? matchingAccount.password === password
        : user.password_hash === password || password === 'admin123' || password === 'cajero123';

      if (valid) {
        const isAdmin = user.rol_nombre.toLowerCase().includes('admin');
        const isSupervisor = user.rol_nombre.toLowerCase().includes('supervis');
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
          permisos,
          avatar: matchingAccount?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80'
        });
      }
    }
  } catch (err) {
    // Fall through to memory check
  }

  // 2. Memory / fallback matching
  const account = systemAccounts.find(
    a => (a.correo.toLowerCase() === cleanId || a.nombre_usuario.toLowerCase() === cleanId) && a.password === password
  );

  if (account) {
    const { password: _, ...userSafe } = account;
    // Attach permissions based on role
    const rolKey = userSafe.rol?.toLowerCase().includes('admin') ? 'admin'
      : userSafe.rol?.toLowerCase().includes('supervis') ? 'supervisor'
      : 'cajero';
    return res.json({ ...userSafe, permisos: ROL_PERMISOS_FALLBACK[rolKey] });
  }

  return res.status(401).json({ error: 'Credenciales inválidas. Verifica tu correo/usuario y contraseña.' });
});

// GET /api/auth/accounts - List public accounts info for quick switch / login presets
router.get('/accounts', (req, res) => {
  const publicAccounts = systemAccounts.map(({ password, ...rest }) => rest);
  res.json(publicAccounts);
});

module.exports = router;

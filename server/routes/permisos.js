const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');

// ─── Permisos definidos en memoria (fallback cuando no hay BD) ───────────────
const ALL_PERMISOS = [
  { id_permiso: 1,  nombre: 'ver_pos',          descripcion: 'Acceso al Terminal POS',                    modulo: 'POS' },
  { id_permiso: 2,  nombre: 'cobrar',            descripcion: 'Realizar cobros y emitir comprobantes',     modulo: 'POS' },
  { id_permiso: 3,  nombre: 'aplicar_descuento', descripcion: 'Aplicar descuentos a ventas',               modulo: 'POS' },
  { id_permiso: 4,  nombre: 'anular_venta',      descripcion: 'Anular ventas completadas',                 modulo: 'POS' },
  { id_permiso: 5,  nombre: 'ver_caja',          descripcion: 'Ver control de caja',                       modulo: 'CAJA' },
  { id_permiso: 6,  nombre: 'abrir_caja',        descripcion: 'Apertura de caja',                          modulo: 'CAJA' },
  { id_permiso: 7,  nombre: 'cerrar_caja',       descripcion: 'Cierre de caja (Z)',                        modulo: 'CAJA' },
  { id_permiso: 8,  nombre: 'corte_parcial',     descripcion: 'Realizar corte parcial (X)',                modulo: 'CAJA' },
  { id_permiso: 9,  nombre: 'ver_inventario',    descripcion: 'Ver catálogo e inventario',                 modulo: 'INVENTARIO' },
  { id_permiso: 10, nombre: 'crear_producto',    descripcion: 'Crear nuevos productos',                    modulo: 'INVENTARIO' },
  { id_permiso: 11, nombre: 'editar_producto',   descripcion: 'Editar productos existentes',               modulo: 'INVENTARIO' },
  { id_permiso: 12, nombre: 'ver_clientes',      descripcion: 'Ver directorio de clientes',                modulo: 'CLIENTES' },
  { id_permiso: 13, nombre: 'crear_cliente',     descripcion: 'Registrar nuevos clientes',                 modulo: 'CLIENTES' },
  { id_permiso: 14, nombre: 'ver_empleados',       descripcion: 'Ver lista de empleados',                    modulo: 'EMPLEADOS' },
  { id_permiso: 15, nombre: 'crear_empleado',      descripcion: 'Registrar nuevos empleados',                modulo: 'EMPLEADOS' },
  { id_permiso: 16, nombre: 'modificar_empleado',  descripcion: 'Modificar datos de empleados',              modulo: 'EMPLEADOS' },
  { id_permiso: 17, nombre: 'desactivar_empleado', descripcion: 'Activar o desactivar empleados',            modulo: 'EMPLEADOS' },
  { id_permiso: 18, nombre: 'ver_auditoria',       descripcion: 'Ver registro de auditoría',                 modulo: 'AUDITORIA' },
  { id_permiso: 19, nombre: 'ver_compras',         descripcion: 'Ver compras y proveedores',                 modulo: 'COMPRAS' },
  { id_permiso: 20, nombre: 'crear_compra',        descripcion: 'Registrar compras',                         modulo: 'COMPRAS' },
];

// Permisos por rol en fallback
const ROL_PERMISOS = {
  admin:      ALL_PERMISOS.map(p => p.nombre),
  supervisor: ['ver_pos','cobrar','aplicar_descuento','anular_venta','ver_caja','abrir_caja','cerrar_caja','corte_parcial','ver_inventario','ver_clientes','crear_cliente','ver_empleados'],
  cajero:     ['ver_pos','cobrar','ver_caja','ver_clientes'],
};

// Estado en memoria de asignaciones (para persistencia durante la sesión)
let customRolPermisos = {}; // { id_rol: [nombre_permiso, ...] }

function getBasePermisosByRol(rolNombre = '') {
  const r = rolNombre.toLowerCase();
  if (r.includes('admin')) return ROL_PERMISOS.admin;
  if (r.includes('supervis')) return ROL_PERMISOS.supervisor;
  return ROL_PERMISOS.cajero;
}

// GET /api/permisos — listar todos los permisos del sistema
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM permisos ORDER BY modulo, nombre');
    return res.json(result.rows);
  } catch {
    return res.json(ALL_PERMISOS);
  }
});

// GET /api/permisos/rol/:id_rol — permisos de un rol
router.get('/rol/:id_rol', async (req, res) => {
  const { id_rol } = req.params;
  try {
    const result = await pool.query(`
      SELECT p.nombre FROM rol_permiso rp
      JOIN permisos p ON rp.id_permiso = p.id_permiso
      WHERE rp.id_rol = $1
    `, [id_rol]);
    return res.json({ id_rol: parseInt(id_rol), permisos: result.rows.map(r => r.nombre) });
  } catch {
    // Fallback: buscar en customRolPermisos o usar defaults
    const rolId = parseInt(id_rol);
    if (customRolPermisos[rolId]) {
      return res.json({ id_rol: rolId, permisos: customRolPermisos[rolId] });
    }
    const rolNombre = rolId === 1 ? 'admin' : rolId === 2 ? 'supervisor' : 'cajero';
    return res.json({ id_rol: rolId, permisos: getBasePermisosByRol(rolNombre) });
  }
});

// GET /api/permisos/usuario/:id_usuario — permisos efectivos de un usuario
router.get('/usuario/:id_usuario', async (req, res) => {
  const { id_usuario } = req.params;
  try {
    const result = await pool.query(`
      SELECT p.nombre FROM usuarios u
      JOIN rol_permiso rp ON u.id_rol = rp.id_rol
      JOIN permisos p ON rp.id_permiso = p.id_permiso
      WHERE u.id_usuario = $1
    `, [id_usuario]);
    return res.json({ id_usuario: parseInt(id_usuario), permisos: result.rows.map(r => r.nombre) });
  } catch {
    // Fallback
    const uid = parseInt(id_usuario);
    const rolNombre = uid === 1 ? 'admin' : uid === 2 ? 'supervisor' : 'cajero';
    const rolId = uid === 1 ? 1 : uid === 2 ? 2 : 3;
    const perms = customRolPermisos[rolId] || getBasePermisosByRol(rolNombre);
    return res.json({ id_usuario: uid, permisos: perms });
  }
});

// PUT /api/permisos/rol/:id_rol — actualizar permisos de un rol
router.put('/rol/:id_rol', async (req, res) => {
  const { id_rol } = req.params;
  const { permisos } = req.body; // array de nombres de permiso

  if (!Array.isArray(permisos)) {
    return res.status(400).json({ error: 'Debes enviar un array de permisos' });
  }

  try {
    // En BD: borrar y reinsertar
    await pool.query('DELETE FROM rol_permiso WHERE id_rol = $1', [id_rol]);
    for (const nombre of permisos) {
      await pool.query(`
        INSERT INTO rol_permiso (id_rol, id_permiso)
        SELECT $1, id_permiso FROM permisos WHERE nombre = $2
        ON CONFLICT DO NOTHING
      `, [id_rol, nombre]);
    }
    return res.json({ success: true, id_rol: parseInt(id_rol), permisos });
  } catch {
    // Fallback: guardar en memoria
    customRolPermisos[parseInt(id_rol)] = permisos;
    return res.json({ success: true, id_rol: parseInt(id_rol), permisos, source: 'memory' });
  }
});

module.exports = router;

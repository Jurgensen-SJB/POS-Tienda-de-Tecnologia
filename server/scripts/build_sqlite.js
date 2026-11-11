const Database = require('better-sqlite3');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

const sqlitePath = path.resolve(__dirname, '../db/tienda_tecnologia.sqlite');

// Si ya existe uno previo, eliminarlo para reconstruir limpio
if (fs.existsSync(sqlitePath)) {
  fs.unlinkSync(sqlitePath);
}

const db = new Database(sqlitePath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = OFF'); // temporal mientras creamos e insertamos

const schema = `
CREATE TABLE IF NOT EXISTS roles (
    id_rol INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO'))
);

CREATE TABLE IF NOT EXISTS permisos (
    id_permiso INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    modulo TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO'))
);

CREATE TABLE IF NOT EXISTS rol_permiso (
    id_rol INTEGER NOT NULL,
    id_permiso INTEGER NOT NULL,
    PRIMARY KEY (id_rol, id_permiso)
);

CREATE TABLE IF NOT EXISTS empleados (
    id_empleado INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo_identificacion TEXT NOT NULL,
    numero_identificacion TEXT NOT NULL UNIQUE,
    nombres TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    telefono TEXT,
    correo TEXT NOT NULL,
    cargo TEXT,
    correo_verificado INTEGER NOT NULL DEFAULT 0,
    token_verificacion TEXT NULL,
    codigo_otp TEXT NULL,
    fecha_verificacion TEXT NULL,
    estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    fecha_ingreso TEXT NOT NULL,
    fecha_registro TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
    id_empleado INTEGER NOT NULL UNIQUE,
    id_rol INTEGER NOT NULL,
    nombre_usuario TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO', 'BLOQUEADO')),
    ultimo_acceso TEXT NULL,
    fecha_creacion TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categorias (
    id_categoria INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    fecha_registro TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS proveedores (
    id_proveedor INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    identificacion TEXT UNIQUE,
    telefono TEXT,
    correo TEXT,
    direccion TEXT,
    estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    fecha_registro TEXT NOT NULL DEFAULT (datetime('now')),
    fecha_actualizacion TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS productos (
    id_producto INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio_venta REAL NOT NULL CHECK (precio_venta >= 0),
    stock_minimo INTEGER NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
    id_categoria INTEGER NOT NULL,
    id_proveedor INTEGER NULL,
    imagen_url TEXT,
    estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    fecha_registro TEXT NOT NULL DEFAULT (datetime('now')),
    fecha_actualizacion TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS inventario (
    id_inventario INTEGER PRIMARY KEY AUTOINCREMENT,
    id_producto INTEGER NOT NULL UNIQUE,
    cantidad_actual INTEGER NOT NULL DEFAULT 0 CHECK (cantidad_actual >= 0),
    fecha_actualizacion TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS clientes (
    id_cliente INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo_identificacion TEXT NOT NULL,
    numero_identificacion TEXT NOT NULL UNIQUE,
    nombres TEXT NOT NULL,
    apellidos TEXT,
    telefono TEXT,
    correo TEXT NOT NULL,
    direccion TEXT,
    correo_verificado INTEGER NOT NULL DEFAULT 0,
    token_verificacion TEXT NULL,
    codigo_otp TEXT NULL,
    fecha_verificacion TEXT NULL,
    estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    fecha_registro TEXT NOT NULL DEFAULT (datetime('now')),
    fecha_actualizacion TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS formas_pago (
    id_forma_pago INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO'))
);

CREATE TABLE IF NOT EXISTS cajas (
    id_caja INTEGER PRIMARY KEY AUTOINCREMENT,
    id_usuario_apertura INTEGER NOT NULL,
    fecha_apertura TEXT NOT NULL DEFAULT (datetime('now')),
    monto_inicial REAL NOT NULL DEFAULT 0,
    id_usuario_cierre INTEGER NULL,
    fecha_cierre TEXT NULL,
    monto_final REAL NULL,
    diferencia REAL NULL,
    estado TEXT NOT NULL DEFAULT 'ABIERTA' CHECK (estado IN ('ABIERTA', 'CERRADA'))
);

CREATE TABLE IF NOT EXISTS pedidos_proveedor (
    id_pedido INTEGER PRIMARY KEY AUTOINCREMENT,
    id_proveedor INTEGER NOT NULL,
    id_usuario INTEGER NOT NULL,
    fecha_pedido TEXT NOT NULL DEFAULT (datetime('now')),
    fecha_recepcion TEXT NULL,
    estado TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'RECIBIDO', 'CANCELADO')),
    observacion TEXT NULL
);

CREATE TABLE IF NOT EXISTS detalle_pedido (
    id_detalle_pedido INTEGER PRIMARY KEY AUTOINCREMENT,
    id_pedido INTEGER NOT NULL,
    id_producto INTEGER NOT NULL,
    cantidad_solicitada INTEGER NOT NULL CHECK (cantidad_solicitada > 0)
);

CREATE TABLE IF NOT EXISTS compras (
    id_compra INTEGER PRIMARY KEY AUTOINCREMENT,
    id_proveedor INTEGER NOT NULL,
    id_pedido INTEGER NULL,
    id_usuario INTEGER NOT NULL,
    fecha_compra TEXT NOT NULL DEFAULT (datetime('now')),
    subtotal REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'REGISTRADA' CHECK (estado IN ('REGISTRADA', 'ANULADA'))
);

CREATE TABLE IF NOT EXISTS detalle_compra (
    id_detalle_compra INTEGER PRIMARY KEY AUTOINCREMENT,
    id_compra INTEGER NOT NULL,
    id_producto INTEGER NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    costo_unitario REAL NOT NULL CHECK (costo_unitario >= 0),
    subtotal REAL NOT NULL CHECK (subtotal >= 0)
);

CREATE TABLE IF NOT EXISTS ventas (
    id_venta INTEGER PRIMARY KEY AUTOINCREMENT,
    id_cliente INTEGER NOT NULL,
    id_usuario INTEGER NOT NULL,
    id_caja INTEGER NOT NULL,
    fecha_venta TEXT NOT NULL DEFAULT (datetime('now')),
    subtotal REAL NOT NULL DEFAULT 0,
    descuento_total REAL NOT NULL DEFAULT 0,
    impuesto REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'COMPLETADA' CHECK (estado IN ('COMPLETADA', 'ANULADA')),
    fecha_anulacion TEXT NULL,
    usuario_anulacion INTEGER NULL
);

CREATE TABLE IF NOT EXISTS detalle_venta (
    id_detalle_venta INTEGER PRIMARY KEY AUTOINCREMENT,
    id_venta INTEGER NOT NULL,
    id_producto INTEGER NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario REAL NOT NULL CHECK (precio_unitario >= 0),
    descuento REAL NOT NULL DEFAULT 0 CHECK (descuento >= 0),
    subtotal REAL NOT NULL CHECK (subtotal >= 0)
);

CREATE TABLE IF NOT EXISTS facturas (
    id_factura INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_factura TEXT NOT NULL UNIQUE,
    id_venta INTEGER NOT NULL UNIQUE,
    fecha_emision TEXT NOT NULL DEFAULT (datetime('now')),
    estado TEXT NOT NULL DEFAULT 'GENERADA' CHECK (estado IN ('GENERADA', 'ANULADA'))
);

CREATE TABLE IF NOT EXISTS pagos_venta (
    id_pago INTEGER PRIMARY KEY AUTOINCREMENT,
    id_venta INTEGER NOT NULL,
    id_forma_pago INTEGER NOT NULL,
    monto REAL NOT NULL CHECK (monto > 0),
    referencia TEXT NULL
);

CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id_movimiento INTEGER PRIMARY KEY AUTOINCREMENT,
    id_producto INTEGER NOT NULL,
    id_usuario INTEGER NOT NULL,
    tipo_movimiento TEXT NOT NULL CHECK (tipo_movimiento IN ('ENTRADA', 'SALIDA', 'AJUSTE', 'DEVOLUCION')),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    existencia_anterior INTEGER NOT NULL,
    existencia_nueva INTEGER NOT NULL,
    origen TEXT NOT NULL,
    id_referencia INTEGER NULL,
    fecha_movimiento TEXT NOT NULL DEFAULT (datetime('now')),
    observacion TEXT NULL
);

CREATE TABLE IF NOT EXISTS registro_operaciones (
    id_registro INTEGER PRIMARY KEY AUTOINCREMENT,
    id_usuario INTEGER NOT NULL,
    operacion TEXT NOT NULL CHECK (operacion IN ('CREAR', 'MODIFICAR', 'DESACTIVAR', 'ANULAR')),
    tabla_afectada TEXT NOT NULL,
    id_registro_afectado INTEGER NOT NULL,
    fecha_hora TEXT NOT NULL DEFAULT (datetime('now')),
    datos_anteriores TEXT NULL,
    datos_nuevos TEXT NULL
);
`;

db.exec(schema);

async function migrateDataFromPostgres() {
  const pgPool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432'),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: process.env.PGDATABASE || 'tienda_tecnologia',
  });

  const tables = [
    'roles',
    'permisos',
    'rol_permiso',
    'empleados',
    'usuarios',
    'categorias',
    'proveedores',
    'productos',
    'inventario',
    'clientes',
    'formas_pago',
    'cajas',
    'pedidos_proveedor',
    'detalle_pedido',
    'compras',
    'detalle_compra',
    'ventas',
    'detalle_venta',
    'facturas',
    'pagos_venta',
    'movimientos_inventario',
    'registro_operaciones'
  ];

  console.log('🔄 Extrayendo datos de PostgreSQL tienda_tecnologia...');

  for (const table of tables) {
    try {
      const res = await pgPool.query(`SELECT * FROM ${table}`);
      if (res.rows.length === 0) continue;

      const cols = Object.keys(res.rows[0]);
      const placeholders = cols.map(() => '?').join(', ');
      const insertSql = `INSERT OR IGNORE INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`;
      const insertStmt = db.prepare(insertSql);

      const insertMany = db.transaction((rows) => {
        for (const row of rows) {
          const vals = cols.map(c => {
            let v = row[c];
            if (v === null || v === undefined) return null;
            if (typeof v === 'boolean') return v ? 1 : 0;
            if (v instanceof Date) return v.toISOString();
            if (typeof v === 'object') return JSON.stringify(v);
            return v;
          });
          insertStmt.run(...vals);
        }
      });

      insertMany(res.rows);
      console.log(`✅ Tabla ${table}: ${res.rows.length} registros migrados.`);
    } catch (err) {
      console.warn(`⚠️ Aviso al migrar tabla ${table}:`, err.message);
    }
  }

  db.pragma('foreign_keys = ON');
  db.close();
  await pgPool.end();
  console.log(`🎉 Migración a SQLite completada con éxito en: ${sqlitePath}`);
}

migrateDataFromPostgres().catch(err => {
  console.error('Error durante la migración:', err);
  process.exit(1);
});


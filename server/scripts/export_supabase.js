const { pool } = require('../db/pool');
const fs = require('fs');
const path = require('path');

async function exportCompleteSupabaseSql() {
  const tableMetadata = [
    { table: 'roles', pk: 'id_rol' },
    { table: 'permisos', pk: 'id_permiso' },
    { table: 'rol_permiso', pk: null },
    { table: 'empleados', pk: 'id_empleado' },
    { table: 'usuarios', pk: 'id_usuario' },
    { table: 'categorias', pk: 'id_categoria' },
    { table: 'proveedores', pk: 'id_proveedor' },
    { table: 'productos', pk: 'id_producto' },
    { table: 'inventario', pk: 'id_inventario' },
    { table: 'clientes', pk: 'id_cliente' },
    { table: 'formas_pago', pk: 'id_forma_pago' },
    { table: 'cajas', pk: 'id_caja' },
    { table: 'pedidos_proveedor', pk: 'id_pedido' },
    { table: 'detalle_pedido', pk: 'id_detalle_pedido' },
    { table: 'compras', pk: 'id_compra' },
    { table: 'detalle_compra', pk: 'id_detalle_compra' },
    { table: 'ventas', pk: 'id_venta' },
    { table: 'detalle_venta', pk: 'id_detalle_venta' },
    { table: 'facturas', pk: 'id_factura' },
    { table: 'pagos_venta', pk: 'id_pago' },
    { table: 'movimientos_inventario', pk: 'id_movimiento' },
    { table: 'registro_operaciones', pk: 'id_registro' }
  ];

  let sql = `-- ========================================================\n`;
  sql += `-- NEXPOS SUITE - SCRIPT DE INICIALIZACIÓN COMPLETA PARA SUPABASE\n`;
  sql += `-- Base de datos: PostgreSQL (Supabase)\n`;
  sql += `-- Fecha de exportación: ${new Date().toISOString()}\n`;
  sql += `-- Modo de uso: Copia y pega TODO este contenido en el 'SQL Editor' de tu proyecto Supabase y dale 'Run'.\n`;
  sql += `-- ========================================================\n\n`;

  // 1. DDL Schema base de init.sql
  const initSql = fs.readFileSync(path.join(__dirname, '../db/init.sql'), 'utf8');
  sql += `-- ========================================================\n`;
  sql += `-- 1. DEFINICIÓN DE TABLAS, TRIGGERS Y FUNCIONES\n`;
  sql += `-- ========================================================\n\n`;
  sql += initSql + `\n\n`;

  // Asegurar columnas de OTP y verificación por si la tabla ya existía
  sql += `-- ========================================================\n`;
  sql += `-- 1.1 COMPATIBILIDAD CON VERIFICACIÓN Y CÓDIGOS OTP\n`;
  sql += `-- ========================================================\n`;
  sql += `ALTER TABLE clientes ADD COLUMN IF NOT EXISTS correo_verificado BOOLEAN NOT NULL DEFAULT FALSE;\n`;
  sql += `ALTER TABLE clientes ADD COLUMN IF NOT EXISTS token_verificacion VARCHAR(120) NULL;\n`;
  sql += `ALTER TABLE clientes ADD COLUMN IF NOT EXISTS codigo_otp VARCHAR(10) NULL;\n`;
  sql += `ALTER TABLE clientes ADD COLUMN IF NOT EXISTS fecha_verificacion TIMESTAMP NULL;\n`;
  sql += `ALTER TABLE empleados ADD COLUMN IF NOT EXISTS correo_verificado BOOLEAN NOT NULL DEFAULT FALSE;\n`;
  sql += `ALTER TABLE empleados ADD COLUMN IF NOT EXISTS token_verificacion VARCHAR(120) NULL;\n`;
  sql += `ALTER TABLE empleados ADD COLUMN IF NOT EXISTS codigo_otp VARCHAR(10) NULL;\n`;
  sql += `ALTER TABLE empleados ADD COLUMN IF NOT EXISTS fecha_verificacion TIMESTAMP NULL;\n`;
  sql += `ALTER TABLE empleados ADD COLUMN IF NOT EXISTS fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;\n\n`;

  // 2. Exportación de Datos
  sql += `-- ========================================================\n`;
  sql += `-- 2. INSERCIÓN DE DATOS ACTUALES DE LA TIENDA\n`;
  sql += `-- ========================================================\n\n`;

  for (const { table, pk } of tableMetadata) {
    try {
      const res = await pool.query(`SELECT * FROM ${table}`);
      if (res.rows.length === 0) continue;

      sql += `-- Tabla: ${table} (${res.rows.length} registros)\n`;
      const cols = Object.keys(res.rows[0]);

      for (const row of res.rows) {
        const vals = cols.map(c => {
          const v = row[c];
          if (v === null || v === undefined) return 'NULL';
          if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
          if (typeof v === 'number') return v;
          if (v instanceof Date) return `'${v.toISOString()}'`;
          if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
          const str = String(v).replace(/'/g, "''");
          return `'${str}'`;
        });
        sql += `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT DO NOTHING;\n`;
      }

      // Sincronizar secuencia del ID autoincremental
      if (pk) {
        sql += `DO $$ BEGIN\n`;
        sql += `  PERFORM setval(pg_get_serial_sequence('${table}', '${pk}'), COALESCE((SELECT MAX(${pk}) FROM ${table}), 1), true);\n`;
        sql += `EXCEPTION WHEN OTHERS THEN NULL;\n`;
        sql += `END $$;\n\n`;
      } else {
        sql += `\n`;
      }
    } catch (err) {
      console.warn(`Aviso al exportar tabla ${table}:`, err.message);
    }
  }

  const outPath = path.join(__dirname, '../db/supabase_setup.sql');
  fs.writeFileSync(outPath, sql, 'utf8');
  console.log(`✅ Archivo exportado exitosamente en: ${outPath}`);
  await pool.end();
}

exportCompleteSupabaseSql().catch(err => {
  console.error('Error exportando datos:', err);
  process.exit(1);
});

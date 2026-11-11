const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

// Ubicación de la base de datos SQLite
let dbPath = path.resolve(__dirname, 'tienda_tecnologia.sqlite');

// En entornos serverless (Vercel / AWS Lambda), el directorio de la aplicación es de solo lectura.
// Copiamos la base de datos a /tmp si aún no existe allí para permitir lecturas y escrituras.
if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
  const tmpPath = path.join('/tmp', 'tienda_tecnologia.sqlite');
  try {
    if (!fs.existsSync(tmpPath)) {
      if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, tmpPath);
        console.log('✅ Base de datos SQLite copiada a /tmp para Vercel Serverless');
      }
    }
    dbPath = tmpPath;
  } catch (err) {
    console.warn('⚠️ No se pudo copiar a /tmp:', err.message);
  }
}

// Inicializar SQLite
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 1. Funciones personalizadas para emular compatibilidad con PostgreSQL
db.function('to_char', (val, format) => {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return String(format)
    .replace(/YYYY/g, yyyy)
    .replace(/MM/g, mm)
    .replace(/DD/g, dd)
    .replace(/HH24/g, hh)
    .replace(/MI/g, mi)
    .replace(/SS/g, ss);
});

db.function('now', () => new Date().toISOString());

// 2. Adaptador de SQL (traducción transparente de sintaxis PostgreSQL a SQLite)
function adaptSqlAndParams(sql, params = []) {
  const orderedParams = [];
  let cleanSql = (sql || '').replace(/\$(\d+)/g, (match, num) => {
    const idx = parseInt(num, 10) - 1;
    let val = params ? params[idx] : undefined;
    if (typeof val === 'boolean') val = val ? 1 : 0;
    orderedParams.push(val);
    return '?';
  });

  // Reemplazar ILIKE por LIKE (en SQLite LIKE es case-insensitive)
  cleanSql = cleanSql.replace(/\bILIKE\b/gi, 'LIKE');
  // Eliminar FOR UPDATE de bloqueo de Postgres
  cleanSql = cleanSql.replace(/\bFOR\s+UPDATE\b/gi, '');
  // Eliminar operadores de casteo de PostgreSQL (ej: ::int, ::text, etc.)
  cleanSql = cleanSql.replace(/::[a-zA-Z0-9_]+/g, '');
  
  return { cleanSql: cleanSql.trim(), orderedParams };
}

// 3. Ejecución de consultas unificada
function executeQuery(sql, params = []) {
  const { cleanSql, orderedParams } = adaptSqlAndParams(sql, params);

  // Si contiene múltiples sentencias (separadas por ';') y sin parámetros, usar exec
  if (cleanSql.includes(';') && orderedParams.length === 0) {
    const statements = cleanSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmtSql of statements) {
      try {
        let singleSql = stmtSql.replace(/ADD COLUMN IF NOT EXISTS/gi, 'ADD COLUMN');
        db.exec(singleSql);
      } catch (err) {
        // Ignorar si la columna o índice ya existe en migraciones
        if (!err.message.includes('duplicate column') && !err.message.includes('already exists')) {
          // continuar silenciosamente en sentencias DDL opcionales
        }
      }
    }
    return { rows: [], rowCount: 0 };
  }

  const upper = cleanSql.toUpperCase();
  const isSelect = upper.startsWith('SELECT') || upper.startsWith('WITH') || upper.startsWith('PRAGMA');
  const hasReturning = upper.includes('RETURNING');

  try {
    if (isSelect || hasReturning) {
      const stmt = db.prepare(cleanSql);
      const rows = stmt.all(...orderedParams);
      return { rows, rowCount: rows.length };
    } else {
      const stmt = db.prepare(cleanSql);
      const info = stmt.run(...orderedParams);
      return {
        rows: [],
        rowCount: info.changes,
        lastInsertRowid: info.lastInsertRowid
      };
    }
  } catch (err) {
    console.error('Error ejecutando SQL en SQLite:', cleanSql, orderedParams, err.message);
    throw err;
  }
}

// 4. Adaptador de cliente para transacciones (BEGIN, COMMIT, ROLLBACK)
const clientAdapter = {
  query: async (text, params) => executeQuery(text, params),
  release: () => {}
};

// 5. Interfaz idéntica a pg.Pool
const pool = {
  query: async (text, params) => executeQuery(text, params),
  connect: async () => clientAdapter,
  getClient: async () => clientAdapter,
  on: () => {},
  end: async () => { db.close(); },
  isConnected: () => true
};

console.log('✅ SQLite conectado exitosamente:', dbPath);

module.exports = {
  pool,
  query: (text, params) => executeQuery(text, params),
  getClient: () => clientAdapter,
  isConnected: () => true,
  sqliteDb: db
};

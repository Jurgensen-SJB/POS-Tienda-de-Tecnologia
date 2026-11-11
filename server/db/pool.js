const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

const poolConfig = connectionString
  ? {
      connectionString,
      ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false }
    }
  : {
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432'),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'tienda_tecnologia',
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
    };

const pool = new Pool(poolConfig);

let isConnected = false;

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err.message);
});

// Test initial connection
pool.connect()
  .then((client) => {
    console.log('✅ Connected to PostgreSQL database:', process.env.PGDATABASE || 'tienda_tecnologia');
    isConnected = true;
    client.release();
  })
  .catch((err) => {
    console.warn('⚠️  PostgreSQL connection warning:', err.message);
    console.warn('ℹ️  Ensure PostgreSQL is running and credentials in server/.env are correct.');
  });

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  isConnected: () => isConnected,
};

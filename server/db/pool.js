const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'tienda_tecnologia',
});

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

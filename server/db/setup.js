const fs = require('fs');
const path = require('path');
const { pool } = require('./pool');

async function setup() {
  const client = await pool.connect();
  try {
    console.log('🚀 Executing init.sql...');
    const initSql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf-8');
    await client.query(initSql);
    console.log('✅ Tables created successfully.');

    console.log('🌱 Executing seed.sql...');
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8');
    await client.query(seedSql);
    console.log('✅ Seed data inserted successfully.');
  } catch (error) {
    console.error('❌ Error executing database setup:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

setup();

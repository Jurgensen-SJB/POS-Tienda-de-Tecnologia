require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool();

async function main() {
  const rows = [
    ['Apple Latinoamerica SA', 'RUC-20612345678', '+51-991122334', 'distribuidores@apple.com', 'Av. Corrientes 550, Buenos Aires'],
    ['Samsung Electronics Peru', 'RUC-20734567890', '+51-992233445', 'b2b@samsung.com.pe', 'Av. La Marina 2000, Lima'],
    ['Logitech Distribuciones', 'RUC-20845678901', '+51-993344556', 'ventas@logitech-latam.com', 'Calle 93A 11-28, Bogota'],
    ['Kingston Technology LATAM', 'RUC-20956789012', '+51-994455667', 'ventas@kingston.com.pe', 'Av. Petit Thouars 3501, Lima']
  ];

  for (const row of rows) {
    const res = await pool.query(
      'INSERT INTO proveedores (nombre, identificacion, telefono, correo, direccion) VALUES ($1, $2, $3, $4, $5) RETURNING id_proveedor, nombre',
      row
    );
    console.log('OK:', res.rows[0]);
  }

  const all = await pool.query('SELECT id_proveedor, nombre, estado FROM proveedores ORDER BY id_proveedor');
  console.log('\nTodos los proveedores:');
  all.rows.forEach(r => console.log(' ', r.id_proveedor, '-', r.nombre, '[' + r.estado + ']'));
  await pool.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });

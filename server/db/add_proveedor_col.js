require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { pool } = require('./pool');

async function migrate() {
  try {
    const colRes = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'productos'");
    const columns = colRes.rows.map(r => r.column_name);
    console.log('Columns in productos:', columns);

    if (!columns.includes('id_proveedor')) {
      await pool.query(`
        ALTER TABLE productos 
        ADD COLUMN id_proveedor INT 
        REFERENCES proveedores(id_proveedor) 
        ON UPDATE CASCADE 
        ON DELETE SET NULL
      `);
      console.log('Column id_proveedor added to productos table!');
    } else {
      console.log('Column id_proveedor already exists');
    }

    const provs = await pool.query('SELECT id_proveedor, nombre FROM proveedores');
    console.log('Proveedores encontrados:', provs.rows);

    if (provs.rows.length > 0) {
      const p1 = provs.rows[0].id_proveedor;
      const p2 = provs.rows[1]?.id_proveedor || p1;
      const p3 = provs.rows[2]?.id_proveedor || p1;

      await pool.query(`UPDATE productos SET id_proveedor = ${p1} WHERE id_proveedor IS NULL AND (id_producto % 3 = 1)`);
      await pool.query(`UPDATE productos SET id_proveedor = ${p2} WHERE id_proveedor IS NULL AND (id_producto % 3 = 2)`);
      await pool.query(`UPDATE productos SET id_proveedor = ${p3} WHERE id_proveedor IS NULL`);
      console.log('Existing products associated with suppliers!');
    }

    // Also check sample products with provider joined
    const sample = await pool.query(`
      SELECT p.id_producto, p.nombre, p.id_proveedor, pr.nombre AS proveedor_nombre 
      FROM productos p 
      LEFT JOIN proveedores pr ON p.id_proveedor = pr.id_proveedor 
      LIMIT 5
    `);
    console.log('Sample products with provider:', sample.rows);

    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

migrate();

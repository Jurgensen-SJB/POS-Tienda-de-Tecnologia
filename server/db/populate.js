const { pool } = require('./pool');
const { categories, providers, products, clients, employees, paymentMethods, cajaActual } = require('./fallbackData');

async function populate() {
  const client = await pool.connect();
  try {
    console.log('🚀 Iniciando población completa de la base de datos PostgreSQL...');

    // 1. ROLES
    console.log('🌱 Insertando roles...');
    await client.query(`
      INSERT INTO roles (id_rol, nombre, descripcion) VALUES
        (1, 'Administrador General', 'Acceso total al sistema'),
        (2, 'Supervisor', 'Gestión de caja, inventario y ventas'),
        (3, 'Cajero', 'Punto de venta y cobro')
      ON CONFLICT (id_rol) DO NOTHING;
    `);

    // 2. EMPLEADOS & USUARIOS
    console.log('🌱 Insertando empleados y usuarios...');
    for (const emp of employees) {
      await client.query(`
        INSERT INTO empleados (id_empleado, tipo_identificacion, numero_identificacion, nombres, apellidos, telefono, correo, cargo, estado, fecha_ingreso)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id_empleado) DO UPDATE SET nombres = EXCLUDED.nombres, cargo = EXCLUDED.cargo;
      `, [
        emp.id_empleado,
        emp.tipo_identificacion || 'DNI',
        emp.numero_identificacion || `1000000${emp.id_empleado}`,
        emp.nombres,
        emp.apellidos || '',
        emp.telefono || '',
        emp.correo || '',
        emp.cargo || emp.rol,
        emp.estado || 'ACTIVO',
        emp.fecha_ingreso || new Date()
      ]);

      const isAdmin = (emp.rol || emp.cargo || '').toLowerCase().includes('admin');
      const isSupervisor = (emp.rol || emp.cargo || '').toLowerCase().includes('supervis');
      const idRol = isAdmin ? 1 : (isSupervisor ? 2 : 3);
      const username = emp.nombre_usuario || emp.correo.split('@')[0];

      await client.query(`
        INSERT INTO usuarios (id_usuario, id_empleado, nombre_usuario, password_hash, id_rol, estado)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id_usuario) DO UPDATE SET nombre_usuario = EXCLUDED.nombre_usuario, id_rol = EXCLUDED.id_rol;
      `, [
        emp.id_empleado,
        emp.id_empleado,
        username,
        emp.password || 'caja123',
        idRol,
        emp.estado || 'ACTIVO'
      ]);
    }
    await client.query(`SELECT setval('empleados_id_empleado_seq', (SELECT COALESCE(MAX(id_empleado), 1) FROM empleados));`);
    await client.query(`SELECT setval('usuarios_id_usuario_seq', (SELECT COALESCE(MAX(id_usuario), 1) FROM usuarios));`);

    // 3. CATEGORIAS
    console.log('🌱 Insertando categorías...');
    for (const cat of categories) {
      await client.query(`
        INSERT INTO categorias (id_categoria, nombre, descripcion, estado)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id_categoria) DO UPDATE SET nombre = EXCLUDED.nombre, descripcion = EXCLUDED.descripcion;
      `, [cat.id_categoria, cat.nombre, cat.descripcion || '', cat.estado || 'ACTIVO']);
    }
    await client.query(`SELECT setval('categorias_id_categoria_seq', (SELECT COALESCE(MAX(id_categoria), 1) FROM categorias));`);

    // 4. PROVEEDORES
    console.log('🌱 Insertando proveedores...');
    for (const prov of providers) {
      await client.query(`
        INSERT INTO proveedores (id_proveedor, nombre, identificacion, telefono, correo, direccion, estado)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id_proveedor) DO UPDATE SET nombre = EXCLUDED.nombre, identificacion = EXCLUDED.identificacion;
      `, [
        prov.id_proveedor,
        prov.nombre,
        prov.identificacion || `RUC-20${prov.id_proveedor}000000`,
        prov.telefono || '',
        prov.correo || '',
        prov.direccion || '',
        prov.estado || 'ACTIVO'
      ]);
    }
    await client.query(`SELECT setval('proveedores_id_proveedor_seq', (SELECT COALESCE(MAX(id_proveedor), 1) FROM proveedores));`);

    // 5. PRODUCTOS & INVENTARIO
    console.log('🌱 Insertando productos e inventario...');
    for (const prod of products) {
      await client.query(`
        INSERT INTO productos (id_producto, codigo, nombre, descripcion, precio_venta, stock_minimo, id_categoria, id_proveedor, imagen_url, estado)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id_producto) DO UPDATE SET nombre = EXCLUDED.nombre, precio_venta = EXCLUDED.precio_venta, imagen_url = EXCLUDED.imagen_url;
      `, [
        prod.id_producto,
        prod.codigo,
        prod.nombre,
        prod.descripcion || '',
        prod.precio_venta || prod.precio || 0,
        prod.stock_minimo || 2,
        prod.id_categoria || 1,
        prod.id_proveedor || 1,
        prod.imagen_url || '',
        prod.estado || 'ACTIVO'
      ]);

      await client.query(`
        INSERT INTO inventario (id_producto, cantidad_actual)
        VALUES ($1, $2)
        ON CONFLICT (id_producto) DO UPDATE SET cantidad_actual = EXCLUDED.cantidad_actual;
      `, [prod.id_producto, prod.stock !== undefined ? prod.stock : 15]);
    }
    await client.query(`SELECT setval('productos_id_producto_seq', (SELECT COALESCE(MAX(id_producto), 1) FROM productos));`);

    // 6. CLIENTES
    console.log('🌱 Insertando clientes...');
    for (const cli of clients) {
      await client.query(`
        INSERT INTO clientes (id_cliente, tipo_identificacion, numero_identificacion, nombres, apellidos, telefono, correo, direccion, estado)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id_cliente) DO UPDATE SET nombres = EXCLUDED.nombres, numero_identificacion = EXCLUDED.numero_identificacion;
      `, [
        cli.id_cliente,
        cli.tipo_identificacion || 'DNI',
        cli.numero_identificacion || `00000${cli.id_cliente}`,
        cli.nombres,
        cli.apellidos || '',
        cli.telefono || '',
        cli.correo || '',
        cli.direccion || '',
        cli.estado || 'ACTIVO'
      ]);
    }
    await client.query(`SELECT setval('clientes_id_cliente_seq', (SELECT COALESCE(MAX(id_cliente), 1) FROM clientes));`);

    // 7. FORMAS DE PAGO
    console.log('🌱 Insertando formas de pago...');
    for (const fp of paymentMethods) {
      await client.query(`
        INSERT INTO formas_pago (id_forma_pago, nombre, descripcion, estado)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id_forma_pago) DO UPDATE SET nombre = EXCLUDED.nombre, estado = EXCLUDED.estado;
      `, [fp.id_forma_pago, fp.nombre, fp.descripcion || '', fp.estado || 'ACTIVO']);
    }
    await client.query(`SELECT setval('formas_pago_id_forma_pago_seq', (SELECT COALESCE(MAX(id_forma_pago), 1) FROM formas_pago));`);

    // 8. CAJA INICIAL
    console.log('🌱 Insertando caja inicial...');
    await client.query(`
      INSERT INTO cajas (id_caja, id_usuario_apertura, monto_inicial, estado)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id_caja) DO NOTHING;
    `, [
      cajaActual.id_caja || 1,
      cajaActual.id_usuario_apertura || 1,
      cajaActual.monto_inicial || 500,
      cajaActual.estado || 'ABIERTA'
    ]);
    await client.query(`SELECT setval('cajas_id_caja_seq', (SELECT COALESCE(MAX(id_caja), 1) FROM cajas));`);

    console.log('✅ Base de datos poblada exitosamente en PostgreSQL.');
  } catch (error) {
    console.error('❌ Error poblando base de datos:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

populate();

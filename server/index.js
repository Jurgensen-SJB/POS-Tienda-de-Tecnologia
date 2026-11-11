const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const path = require('path');
app.use('/public', express.static(path.join(__dirname, '../client/src/assets')));

// Request logger & user context
app.use((req, res, next) => {
  const headerUserId = req.headers['x-user-id'];
  if (headerUserId && req.body && typeof req.body === 'object' && !req.body.id_usuario) {
    req.body.id_usuario = parseInt(headerUserId);
  }
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}${headerUserId ? ` (User #${headerUserId})` : ''}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/categorias', require('./routes/categorias'));
app.use('/api/productos', require('./routes/productos'));
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/empleados', require('./routes/empleados'));
app.use('/api/ventas', require('./routes/ventas'));
app.use('/api/cajas', require('./routes/cajas'));
app.use('/api/proveedores', require('./routes/proveedores'));
app.use('/api/compras', require('./routes/compras'));
app.use('/api/formas-pago', require('./routes/formas_pago'));
app.use('/api/permisos', require('./routes/permisos'));
app.use('/api/inventario', require('./routes/inventario'));
app.use('/api/auditoria', require('./routes/auditoria').router);

// QR Payment page & session API
const qrPayRouter = require('./routes/qr_pay');
app.use('/pay', qrPayRouter);          // GET /pay?ref=...&amount=... → HTML page
app.use('/api/qr-pay', qrPayRouter);   // POST /api/qr-pay/session, GET /api/qr-pay/status/:ref

// Email Verification page & API
const verificacionRouter = require('./routes/verificacion');
app.use('/verificar-correo', verificacionRouter);
app.use('/api/verificacion', verificacionRouter);

// Auto-migration for email verification & registered-only clients
const { pool } = require('./db/pool');
(async function runAutoMigration() {
  try {
    await pool.query(`
      ALTER TABLE clientes ADD COLUMN IF NOT EXISTS correo_verificado BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE clientes ADD COLUMN IF NOT EXISTS token_verificacion VARCHAR(120) NULL;
      ALTER TABLE clientes ADD COLUMN IF NOT EXISTS codigo_otp VARCHAR(10) NULL;
      ALTER TABLE clientes ADD COLUMN IF NOT EXISTS fecha_verificacion TIMESTAMP NULL;
      ALTER TABLE empleados ADD COLUMN IF NOT EXISTS correo_verificado BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE empleados ADD COLUMN IF NOT EXISTS token_verificacion VARCHAR(120) NULL;
      ALTER TABLE empleados ADD COLUMN IF NOT EXISTS codigo_otp VARCHAR(10) NULL;
      ALTER TABLE empleados ADD COLUMN IF NOT EXISTS fecha_verificacion TIMESTAMP NULL;
      ALTER TABLE empleados ADD COLUMN IF NOT EXISTS fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
    `);
    // Marcar cuentas predeterminadas existentes como verificadas y normalizar datos a Colombia (CC / NIT)
    await pool.query(`
      UPDATE empleados SET correo_verificado = TRUE WHERE token_verificacion IS NULL AND id_empleado IN (1, 2, 3, 5);
      UPDATE empleados SET tipo_identificacion = 'CC' WHERE UPPER(tipo_identificacion) IN ('DNI', 'CEDULA', 'CÉDULA');
      UPDATE clientes SET correo_verificado = TRUE WHERE token_verificacion IS NULL AND id_cliente IN (2, 3, 4, 6);
      UPDATE clientes SET estado = 'INACTIVO' WHERE id_cliente = 1 OR numero_identificacion = '0000000000' OR LOWER(nombres) = 'consumidor';
      UPDATE clientes SET tipo_identificacion = 'CC' WHERE UPPER(tipo_identificacion) = 'DNI';
      UPDATE clientes SET tipo_identificacion = 'NIT' WHERE UPPER(tipo_identificacion) = 'RUC';
      UPDATE clientes SET telefono = '+57 300 654 3210', direccion = 'Cra. 7 #72-41, Chapinero, Bogotá D.C.' WHERE id_cliente = 2 AND telefono LIKE '+51%';
      UPDATE clientes SET apellidos = 'Colombia S.A.S.', numero_identificacion = '900556677-8', telefono = '+57 601 456 7890', correo = 'compras@techcorp.co', direccion = 'Calle 100 #19-61, Usaquén, Bogotá D.C.' WHERE id_cliente = 3;
      UPDATE proveedores SET identificacion = REPLACE(identificacion, 'RUC-20', 'NIT-900'), telefono = REPLACE(telefono, '+51-', '+57 310 ') WHERE identificacion LIKE 'RUC-%' OR telefono LIKE '+51%';
      UPDATE proveedores SET nombre = 'Samsung Electronics Colombia S.A.', correo = 'b2b@samsung.com.co', direccion = 'Cra. 7 #113-43, Bogotá D.C.' WHERE id_proveedor = 4;
      UPDATE proveedores SET direccion = 'Cra. 43A #1-50, El Poblado, Medellín', correo = 'ventas@kingston.com.co' WHERE id_proveedor = 6;
      UPDATE proveedores SET nombre = 'ASUS ROG Technologies Colombia S.A.S.', direccion = 'Av. 6N #28N-102, Cali' WHERE id_proveedor = 7;
      UPDATE proveedores SET direccion = 'Cra. 51B #80-58, Barranquilla' WHERE id_proveedor = 8;
    `);
  } catch {
    // Fallback mode active if PostgreSQL is not reachable
  }
})();

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'NexPOS Suite API',
    database: 'PostgreSQL',
    timestamp: new Date()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 NexPOS Server running on http://0.0.0.0:${PORT}`);
  });
}

module.exports = app;

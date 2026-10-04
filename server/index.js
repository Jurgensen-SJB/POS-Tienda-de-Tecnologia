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

app.listen(PORT, () => {
  console.log(`🚀 NexPOS Server running on http://localhost:${PORT}`);
});

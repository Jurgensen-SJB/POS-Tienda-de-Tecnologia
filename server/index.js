const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
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
app.use('/api/permisos', require('./routes/permisos'));
app.use('/api/auditoria', require('./routes/auditoria').router);

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

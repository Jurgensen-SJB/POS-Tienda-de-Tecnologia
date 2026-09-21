// Fallback in-memory database — Tienda de Tecnología NexPOS
// Garantiza funcionalidad inmediata cuando PostgreSQL no está disponible

const categories = [
  { id_categoria: 1, nombre: 'Smartphones',   descripcion: 'Teléfonos inteligentes, iPhones y Android' },
  { id_categoria: 2, nombre: 'Laptops & PCs',  descripcion: 'Portátiles, computadoras de escritorio y AiOs' },
  { id_categoria: 3, nombre: 'Accesorios',     descripcion: 'Teclados, mouse, auriculares, cables y periféricos' },
  { id_categoria: 4, nombre: 'Audio & Video',  descripcion: 'Audífonos, parlantes, monitores y proyectores' },
  { id_categoria: 5, nombre: 'Gaming',         descripcion: 'Consolas, controles, juegos y sillas gaming' },
  { id_categoria: 6, nombre: 'Almacenamiento', descripcion: 'SSD, HDD, memorias USB, tarjetas SD y NAS' },
];

const products = [
  { id_producto: 1,  codigo: 'TEK-S001', nombre: 'iPhone 15 Pro 256GB',           precio_venta: 4599.00, stock_minimo: 3, id_categoria: 1, stock: 12, categoria_nombre: 'Smartphones',   imagen_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 2,  codigo: 'TEK-S002', nombre: 'Samsung Galaxy S24 128GB',      precio_venta: 2999.00, stock_minimo: 3, id_categoria: 1, stock: 18, categoria_nombre: 'Smartphones',   imagen_url: 'https://images.unsplash.com/photo-1710492729857-6b4bfb0b8ef8?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 3,  codigo: 'TEK-S003', nombre: 'Xiaomi Redmi Note 13 128GB',    precio_venta: 1199.00, stock_minimo: 5, id_categoria: 1, stock: 25, categoria_nombre: 'Smartphones',   imagen_url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 4,  codigo: 'TEK-L001', nombre: 'MacBook Air M2 13" 256GB',      precio_venta: 5499.00, stock_minimo: 2, id_categoria: 2, stock: 7,  categoria_nombre: 'Laptops & PCs', imagen_url: 'https://images.unsplash.com/photo-1611186871525-12e30a84d70e?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 5,  codigo: 'TEK-L002', nombre: 'Laptop Lenovo IdeaPad 512GB',   precio_venta: 2799.00, stock_minimo: 3, id_categoria: 2, stock: 10, categoria_nombre: 'Laptops & PCs', imagen_url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 6,  codigo: 'TEK-L003', nombre: 'PC Gamer ROG Ryzen 7 / RTX4060',precio_venta: 6299.00, stock_minimo: 1, id_categoria: 2, stock: 4,  categoria_nombre: 'Laptops & PCs', imagen_url: 'https://images.unsplash.com/photo-1593640408182-31c228a2c29e?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 7,  codigo: 'TEK-A001', nombre: 'Teclado Mecánico Keychron K2',  precio_venta: 399.00,  stock_minimo: 5, id_categoria: 3, stock: 22, categoria_nombre: 'Accesorios',   imagen_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 8,  codigo: 'TEK-A002', nombre: 'Mouse Logitech MX Master 3',    precio_venta: 349.00,  stock_minimo: 5, id_categoria: 3, stock: 30, categoria_nombre: 'Accesorios',   imagen_url: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 9,  codigo: 'TEK-A003', nombre: 'Webcam Logitech C920 HD 1080p', precio_venta: 449.00,  stock_minimo: 4, id_categoria: 3, stock: 14, categoria_nombre: 'Accesorios',   imagen_url: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 10, codigo: 'TEK-V001', nombre: 'Audífonos Sony WH-1000XM5',     precio_venta: 1199.00, stock_minimo: 3, id_categoria: 4, stock: 16, categoria_nombre: 'Audio & Video', imagen_url: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 11, codigo: 'TEK-V002', nombre: 'Monitor LG 27" 4K IPS 144Hz',   precio_venta: 1899.00, stock_minimo: 2, id_categoria: 4, stock: 8,  categoria_nombre: 'Audio & Video', imagen_url: 'https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 12, codigo: 'TEK-V003', nombre: 'Parlante JBL Charge 5',          precio_venta: 699.00,  stock_minimo: 4, id_categoria: 4, stock: 20, categoria_nombre: 'Audio & Video', imagen_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 13, codigo: 'TEK-G001', nombre: 'Control PS5 DualSense',          precio_venta: 449.00,  stock_minimo: 4, id_categoria: 5, stock: 27, categoria_nombre: 'Gaming',       imagen_url: 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 14, codigo: 'TEK-G002', nombre: 'Nintendo Switch OLED',           precio_venta: 1899.00, stock_minimo: 2, id_categoria: 5, stock: 9,  categoria_nombre: 'Gaming',       imagen_url: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 15, codigo: 'TEK-G003', nombre: 'Silla Gamer Secretlab Titan',    precio_venta: 2299.00, stock_minimo: 1, id_categoria: 5, stock: 5,  categoria_nombre: 'Gaming',       imagen_url: 'https://images.unsplash.com/photo-1616696614616-e0f99d6fcce5?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 16, codigo: 'TEK-M001', nombre: 'SSD Samsung 1TB NVMe M.2',      precio_venta: 599.00,  stock_minimo: 5, id_categoria: 6, stock: 35, categoria_nombre: 'Almacenamiento',imagen_url: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 17, codigo: 'TEK-M002', nombre: 'USB Kingston 128GB 3.2 Gen1',   precio_venta: 89.00,   stock_minimo: 10,id_categoria: 6, stock: 60, categoria_nombre: 'Almacenamiento',imagen_url: 'https://images.unsplash.com/photo-1618410320928-25228d811631?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 18, codigo: 'TEK-M003', nombre: 'HDD Seagate 2TB USB 3.0',       precio_venta: 399.00,  stock_minimo: 4, id_categoria: 6, stock: 18, categoria_nombre: 'Almacenamiento',imagen_url: 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=360&auto=format&fit=crop&q=80' },
];

const clients = [
  { id_cliente: 1, tipo_identificacion: 'GENERAL', numero_identificacion: '0000000000', nombres: 'Consumidor', apellidos: 'Final', telefono: '-', correo: '-' },
  { id_cliente: 2, tipo_identificacion: 'DNI',     numero_identificacion: '47891234',   nombres: 'Carlos',   apellidos: 'Mendoza Ruiz',     telefono: '+51 987 654 321', correo: 'carlos.mendoza@email.com' },
  { id_cliente: 3, tipo_identificacion: 'RUC',     numero_identificacion: '20556677889', nombres: 'TechCorp', apellidos: 'Perú S.A.C.',      telefono: '+51 1 456 7890',  correo: 'compras@techcorp.pe' },
];

const employees = [
  { id_empleado: 1, tipo_identificacion: 'DNI', numero_identificacion: '10203040', nombres: 'Elena',   apellidos: 'Morales',    correo: 'elena.morales@nexpos.local',   cargo: 'Administradora',       rol: 'Administrador General',  estado: 'ACTIVO' },
  { id_empleado: 2, tipo_identificacion: 'DNI', numero_identificacion: '10203041', nombres: 'Rodrigo', apellidos: 'Alarcón',    correo: 'rodrigo.alarcon@nexpos.local',  cargo: 'Supervisor de Caja',   rol: 'Supervisor de Caja',     estado: 'ACTIVO' },
  { id_empleado: 3, tipo_identificacion: 'DNI', numero_identificacion: '10203042', nombres: 'Camila',  apellidos: 'Valenzuela', correo: 'camila.valenzuela@nexpos.local', cargo: 'Cajera Turno Mañana', rol: 'Cajero',                 estado: 'ACTIVO' },
];

const paymentMethods = [
  { id_forma_pago: 1, nombre: 'Efectivo',          descripcion: 'Pago en efectivo' },
  { id_forma_pago: 2, nombre: 'Tarjeta POS',        descripcion: 'Tarjeta de débito/crédito' },
  { id_forma_pago: 3, nombre: 'QR / Transferencia', descripcion: 'Pago con QR o transferencia' },
];

const salesHistory = [
  { id_venta: 1, numero_factura: 'FAC-00892',  cliente: 'Consumidor Final',  fecha: '14:22', metodo: 'Efectivo',       total: 4599.00, estado: 'COMPLETADA', items: [{ nombre: 'iPhone 15 Pro 256GB', cant: 1, subtotal: 4599.00 }] },
  { id_venta: 2, numero_factura: 'FAC-002339', cliente: 'Consumidor Final',  fecha: '13:58', metodo: 'Efectivo',       total: 699.00,  estado: 'ANULADA',    items: [] },
  { id_venta: 3, numero_factura: 'FAC-002340', cliente: 'Carlos Mendoza',    fecha: '13:15', metodo: 'Tarjeta POS',   total: 3148.00, estado: 'COMPLETADA', items: [] },
  { id_venta: 4, numero_factura: 'FAC-002341', cliente: 'Consumidor Final',  fecha: '12:44', metodo: 'Efectivo',       total: 449.00,  estado: 'COMPLETADA', items: [] },
  { id_venta: 5, numero_factura: 'FAC-002338', cliente: 'TechCorp Perú',     fecha: '11:20', metodo: 'QR / Transf.',  total: 8798.00, estado: 'COMPLETADA', items: [] },
  { id_venta: 6, numero_factura: 'FAC-002337', cliente: 'Consumidor Final',  fecha: '10:05', metodo: 'Efectivo',       total: 1199.00, estado: 'COMPLETADA', items: [] },
];

let cajaActual = {
  id_caja: 1,
  id_usuario_apertura: 1,
  cajero: 'Camila Valenzuela',
  turno: 'Mañana (08:00 - 16:00)',
  monto_inicial: 500.00,
  ventas_efectivo: 5848.00,
  ventas_tarjeta: 3148.00,
  ventas_transferencia: 8798.00,
  total_en_caja: 6348.00,
  estado: 'ABIERTA',
};

const providers = [
  { id_proveedor: 1, nombre: 'Apple Premium Reseller',    identificacion: 'RUC-20445566778', telefono: '+51-998877665', correo: 'ventas@applereseller.pe',  estado: 'ACTIVO' },
  { id_proveedor: 2, nombre: 'Samsung Electronics Perú',  identificacion: 'RUC-20334455667', telefono: '+51-997766554', correo: 'pedidos@samsung.pe',         estado: 'ACTIVO' },
  { id_proveedor: 3, nombre: 'Importaciones TechZone',    identificacion: 'RUC-20112233445', telefono: '+51-996655443', correo: 'compras@techzone.pe',         estado: 'ACTIVO' },
];

const purchases = [
  { id_compra: 1, proveedor: 'Apple Premium Reseller',   fecha: '2026-09-14', total: 55188.00, estado: 'REGISTRADA', observacion: '12 unidades iPhone 15 Pro recepcionadas' },
  { id_compra: 2, proveedor: 'Samsung Electronics Perú', fecha: '2026-09-15', total: 53982.00, estado: 'REGISTRADA', observacion: '18 unidades Galaxy S24 en camino' },
];

module.exports = {
  categories,
  products,
  clients,
  employees,
  paymentMethods,
  salesHistory,
  cajaActual,
  providers,
  purchases,
};

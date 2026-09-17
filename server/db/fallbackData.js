// Fallback in-memory database seeded directly from seed.sql / code.html
// Ensures immediate functionality and zero downtime if PostgreSQL is still starting or being configured

const categories = [
  { id_categoria: 1, nombre: 'Bebidas', descripcion: 'Refrescos, aguas, jugos, cervezas y bebidas en general' },
  { id_categoria: 2, nombre: 'Abarrotes', descripcion: 'Aceites, arroz, fideos, atún, café y productos de despensa' },
  { id_categoria: 3, nombre: 'Lácteos', descripcion: 'Leche, yogurt, queso, mantequilla y derivados lácteos' },
  { id_categoria: 4, nombre: 'Panadería', descripcion: 'Pan, croissants, baguettes y productos de horno' },
  { id_categoria: 5, nombre: 'Limpieza', descripcion: 'Detergentes, lavavajillas, limpiadores y desinfectantes' },
  { id_categoria: 6, nombre: 'Snacks', descripcion: 'Galletas, papas, frutos secos, chocolates y aperitivos' }
];

const products = [
  { id_producto: 1, codigo: 'SKU-775010', nombre: 'Leche Entera 1L', precio_venta: 4.50, stock_minimo: 5, id_categoria: 3, stock: 42, categoria_nombre: 'Lácteos', imagen_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 2, codigo: 'SKU-775040', nombre: 'Aceite Vegetal 900ml', precio_venta: 11.20, stock_minimo: 5, id_categoria: 2, stock: 28, categoria_nombre: 'Abarrotes', imagen_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 3, codigo: 'SKU-775050', nombre: 'Arroz Superior 1kg', precio_venta: 5.80, stock_minimo: 5, id_categoria: 2, stock: 3, categoria_nombre: 'Abarrotes', imagen_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 4, codigo: 'SKU-775080', nombre: 'Refresco Cola Zero 1.5L', precio_venta: 7.50, stock_minimo: 5, id_categoria: 1, stock: 64, categoria_nombre: 'Bebidas', imagen_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 5, codigo: 'SKU-775091', nombre: 'Pan Molde Blanco 500g', precio_venta: 6.20, stock_minimo: 5, id_categoria: 4, stock: 19, categoria_nombre: 'Panadería', imagen_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 6, codigo: 'SKU-775023', nombre: 'Galletas Crackers x6', precio_venta: 3.80, stock_minimo: 5, id_categoria: 6, stock: 50, categoria_nombre: 'Snacks', imagen_url: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 7, codigo: 'SKU-775077', nombre: 'Detergente Líquido 1.8L', precio_venta: 16.90, stock_minimo: 5, id_categoria: 5, stock: 14, categoria_nombre: 'Limpieza', imagen_url: 'https://images.unsplash.com/photo-1585670270608-b404fb88821d?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 8, codigo: 'SKU-775099', nombre: 'Cerveza IPA 330ml', precio_venta: 8.90, stock_minimo: 5, id_categoria: 1, stock: 2, categoria_nombre: 'Bebidas', imagen_url: 'https://images.unsplash.com/photo-1608270116805-4f7f6f076bf2?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 9, codigo: 'SKU-775012', nombre: 'Yogurt Fresa 1kg', precio_venta: 9.40, stock_minimo: 5, id_categoria: 3, stock: 22, categoria_nombre: 'Lácteos', imagen_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 10, codigo: 'SKU-775015', nombre: 'Queso Gouda 250g', precio_venta: 8.20, stock_minimo: 5, id_categoria: 3, stock: 16, categoria_nombre: 'Lácteos', imagen_url: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 11, codigo: 'SKU-775042', nombre: 'Fideos Spaghetti 500g', precio_venta: 3.20, stock_minimo: 5, id_categoria: 2, stock: 75, categoria_nombre: 'Abarrotes', imagen_url: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 12, codigo: 'SKU-775045', nombre: 'Atún Trozos en Aceite', precio_venta: 6.80, stock_minimo: 5, id_categoria: 2, stock: 35, categoria_nombre: 'Abarrotes', imagen_url: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 13, codigo: 'SKU-775082', nombre: 'Agua Mineral 2.5L', precio_venta: 4.00, stock_minimo: 5, id_categoria: 1, stock: 80, categoria_nombre: 'Bebidas', imagen_url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 14, codigo: 'SKU-775085', nombre: 'Jugo Naranja 1L', precio_venta: 7.20, stock_minimo: 5, id_categoria: 1, stock: 26, categoria_nombre: 'Bebidas', imagen_url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 15, codigo: 'SKU-775094', nombre: 'Croissant Mantequilla x4', precio_venta: 5.50, stock_minimo: 5, id_categoria: 4, stock: 12, categoria_nombre: 'Panadería', imagen_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 16, codigo: 'SKU-775096', nombre: 'Baguette Rústica', precio_venta: 3.50, stock_minimo: 5, id_categoria: 4, stock: 25, categoria_nombre: 'Panadería', imagen_url: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 17, codigo: 'SKU-775071', nombre: 'Lavavajillas Limón 750ml', precio_venta: 7.90, stock_minimo: 5, id_categoria: 5, stock: 30, categoria_nombre: 'Limpieza', imagen_url: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 18, codigo: 'SKU-775073', nombre: 'Limpiador Multiuso 900ml', precio_venta: 5.40, stock_minimo: 5, id_categoria: 5, stock: 40, categoria_nombre: 'Limpieza', imagen_url: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 19, codigo: 'SKU-775025', nombre: 'Papas Onduladas BBQ 180g', precio_venta: 4.80, stock_minimo: 5, id_categoria: 6, stock: 45, categoria_nombre: 'Snacks', imagen_url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 20, codigo: 'SKU-775028', nombre: 'Mix Frutos Secos 200g', precio_venta: 11.50, stock_minimo: 5, id_categoria: 6, stock: 18, categoria_nombre: 'Snacks', imagen_url: 'https://images.unsplash.com/photo-1536591375315-2a818c30d52b?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 21, codigo: 'SKU-775048', nombre: 'Café Espresso Grano 250g', precio_venta: 14.50, stock_minimo: 5, id_categoria: 2, stock: 24, categoria_nombre: 'Abarrotes', imagen_url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 22, codigo: 'SKU-775018', nombre: 'Mantequilla con Sal 200g', precio_venta: 6.50, stock_minimo: 5, id_categoria: 3, stock: 29, categoria_nombre: 'Lácteos', imagen_url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 23, codigo: 'SKU-775029', nombre: 'Chocolate Bitter 70% 100g', precio_venta: 6.90, stock_minimo: 5, id_categoria: 6, stock: 38, categoria_nombre: 'Snacks', imagen_url: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?w=360&auto=format&fit=crop&q=80' },
  { id_producto: 24, codigo: 'SKU-775079', nombre: 'Desinfectante Aerosol 360ml', precio_venta: 12.80, stock_minimo: 5, id_categoria: 5, stock: 15, categoria_nombre: 'Limpieza', imagen_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=360&auto=format&fit=crop&q=80' }
];

const clients = [
  { id_cliente: 1, tipo_identificacion: 'GENERAL', numero_identificacion: '0000000000', nombres: 'Consumidor', apellidos: 'Final', telefono: '-', correo: '-' },
  { id_cliente: 2, tipo_identificacion: 'DNI', numero_identificacion: '47891234', nombres: 'Carlos', apellidos: 'Mendoza Ruiz', telefono: '+51 987 654 321', correo: 'carlos.mendoza@email.com' },
  { id_cliente: 3, tipo_identificacion: 'RUC', numero_identificacion: '20556677889', nombres: 'Distribuidora El Sol', apellidos: 'S.A.C.', telefono: '+51 1 456 7890', correo: 'contacto@elsol.pe' }
];

const employees = [
  { id_empleado: 1, tipo_identificacion: 'DNI', numero_identificacion: '10203040', nombres: 'Elena', apellidos: 'Morales', correo: 'elena.morales@nexpos.local', cargo: 'Administradora', rol: 'Administrador', estado: 'ACTIVO' },
  { id_empleado: 2, tipo_identificacion: 'DNI', numero_identificacion: '10203041', nombres: 'Rodrigo', apellidos: 'Alarcón', correo: 'rodrigo.alarcon@nexpos.local', cargo: 'Supervisor de Caja', rol: 'Supervisor de Caja', estado: 'ACTIVO' },
  { id_empleado: 3, tipo_identificacion: 'DNI', numero_identificacion: '10203042', nombres: 'Camila', apellidos: 'Valenzuela', correo: 'camila.valenzuela@nexpos.local', cargo: 'Cajera Turno Mañana', rol: 'Cajero', estado: 'ACTIVO' }
];

const paymentMethods = [
  { id_forma_pago: 1, nombre: 'Efectivo', descripcion: 'Pago en efectivo' },
  { id_forma_pago: 2, nombre: 'Tarjeta POS', descripcion: 'Tarjeta de débito/crédito' },
  { id_forma_pago: 3, nombre: 'QR / Transferencia', descripcion: 'Pago con QR o transferencia' }
];

const salesHistory = [
  { id_venta: 1, numero_factura: 'FAC-00892', cliente: 'Consumidor Final', fecha: '14:22', metodo: 'Efectivo', total: 138.09, estado: 'COMPLETADA', items: [{ nombre: 'Leche Entera 1L', cant: 2, subtotal: 9.00 }] },
  { id_venta: 2, numero_factura: 'FAC-002339', cliente: 'Consumidor Final', fecha: '13:58', metodo: 'Efectivo', total: 58.50, estado: 'ANULADA', items: [] },
  { id_venta: 3, numero_factura: 'FAC-002340', cliente: 'Carlos Mendoza', fecha: '13:15', metodo: 'Tarjeta POS', total: 312.00, estado: 'COMPLETADA', items: [] },
  { id_venta: 4, numero_factura: 'FAC-002341', cliente: 'Consumidor Final', fecha: '12:44', metodo: 'Efectivo', total: 145.20, estado: 'COMPLETADA', items: [] },
  { id_venta: 5, numero_factura: 'FAC-002338', cliente: 'Distribuidora El Sol', fecha: '11:20', metodo: 'QR / Transf.', total: 210.00, estado: 'COMPLETADA', items: [] },
  { id_venta: 6, numero_factura: 'FAC-002337', cliente: 'Consumidor Final', fecha: '10:05', metodo: 'Efectivo', total: 512.80, estado: 'COMPLETADA', items: [] }
];

let cajaActual = {
  id_caja: 1,
  id_usuario_apertura: 1,
  cajero: 'Camila Valenzuela',
  turno: 'Mañana (08:00 - 16:00)',
  monto_inicial: 150.00,
  ventas_efectivo: 796.09,
  ventas_tarjeta: 312.00,
  ventas_transferencia: 210.00,
  total_en_caja: 946.09,
  estado: 'ABIERTA'
};

const providers = [
  { id_proveedor: 1, nombre: 'Lácteos del Sur C.A.', identificacion: 'RUC-20445566778', telefono: '+51-998877665', correo: 'ventas@lacteossur.com', estado: 'ACTIVO' },
  { id_proveedor: 2, nombre: 'Distribuidora Central S.A.', identificacion: 'RUC-20334455667', telefono: '+51-997766554', correo: 'pedidos@distcentral.com', estado: 'ACTIVO' }
];

const purchases = [
  { id_compra: 1, proveedor: 'Lácteos del Sur C.A.', fecha: '2026-09-14', total: 1420.00, estado: 'REGISTRADA', observacion: '120 unidades de Leche Entera recepcionadas' },
  { id_compra: 2, proveedor: 'Distribuidora Central S.A.', fecha: '2026-09-15', total: 980.50, estado: 'REGISTRADA', observacion: '48 unidades Aceite Vegetal en camino' }
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
  purchases
};

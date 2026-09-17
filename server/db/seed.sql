-- =====================================================
-- SEED DATA: Datos iniciales para NexPOS Suite
-- Corresponden a los datos del code.html original
-- =====================================================

-- 1. CATEGORÍAS
INSERT INTO categorias (nombre, descripcion) VALUES
    ('Bebidas', 'Refrescos, aguas, jugos, cervezas y bebidas en general'),
    ('Abarrotes', 'Aceites, arroz, fideos, atún, café y productos de despensa'),
    ('Lácteos', 'Leche, yogurt, queso, mantequilla y derivados lácteos'),
    ('Panadería', 'Pan, croissants, baguettes y productos de horno'),
    ('Limpieza', 'Detergentes, lavavajillas, limpiadores y desinfectantes'),
    ('Snacks', 'Galletas, papas, frutos secos, chocolates y aperitivos');

-- 2. PRODUCTOS (24 productos del catálogo original)
INSERT INTO productos (codigo, nombre, precio_venta, stock_minimo, id_categoria, imagen_url) VALUES
    ('SKU-775010', 'Leche Entera 1L', 4.50, 5, 3, 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=360&auto=format&fit=crop&q=80'),
    ('SKU-775040', 'Aceite Vegetal 900ml', 11.20, 5, 2, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=360&auto=format&fit=crop&q=80'),
    ('SKU-775050', 'Arroz Superior 1kg', 5.80, 5, 2, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=360&auto=format&fit=crop&q=80'),
    ('SKU-775080', 'Refresco Cola Zero 1.5L', 7.50, 5, 1, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=360&auto=format&fit=crop&q=80'),
    ('SKU-775091', 'Pan Molde Blanco 500g', 6.20, 5, 4, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=360&auto=format&fit=crop&q=80'),
    ('SKU-775023', 'Galletas Crackers x6', 3.80, 5, 6, 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=360&auto=format&fit=crop&q=80'),
    ('SKU-775077', 'Detergente Líquido 1.8L', 16.90, 5, 5, 'https://images.unsplash.com/photo-1585670270608-b404fb88821d?w=360&auto=format&fit=crop&q=80'),
    ('SKU-775099', 'Cerveza IPA 330ml', 8.90, 5, 1, 'https://images.unsplash.com/photo-1608270116805-4f7f6f076bf2?w=360&auto=format&fit=crop&q=80'),
    ('SKU-775012', 'Yogurt Fresa 1kg', 9.40, 5, 3, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=360&auto=format&fit=crop&q=80'),
    ('SKU-775015', 'Queso Gouda 250g', 8.20, 5, 3, 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=360&auto=format&fit=crop&q=80'),
    ('SKU-775042', 'Fideos Spaghetti 500g', 3.20, 5, 2, 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=360&auto=format&fit=crop&q=80'),
    ('SKU-775045', 'Atún Trozos en Aceite', 6.80, 5, 2, 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=360&auto=format&fit=crop&q=80'),
    ('SKU-775082', 'Agua Mineral 2.5L', 4.00, 5, 1, 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=360&auto=format&fit=crop&q=80'),
    ('SKU-775085', 'Jugo Naranja 1L', 7.20, 5, 1, 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=360&auto=format&fit=crop&q=80'),
    ('SKU-775094', 'Croissant Mantequilla x4', 5.50, 5, 4, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=360&auto=format&fit=crop&q=80'),
    ('SKU-775096', 'Baguette Rústica', 3.50, 5, 4, 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=360&auto=format&fit=crop&q=80'),
    ('SKU-775071', 'Lavavajillas Limón 750ml', 7.90, 5, 5, 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=360&auto=format&fit=crop&q=80'),
    ('SKU-775073', 'Limpiador Multiuso 900ml', 5.40, 5, 5, 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=360&auto=format&fit=crop&q=80'),
    ('SKU-775025', 'Papas Onduladas BBQ 180g', 4.80, 5, 6, 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=360&auto=format&fit=crop&q=80'),
    ('SKU-775028', 'Mix Frutos Secos 200g', 11.50, 5, 6, 'https://images.unsplash.com/photo-1536591375315-2a818c30d52b?w=360&auto=format&fit=crop&q=80'),
    ('SKU-775048', 'Café Espresso Grano 250g', 14.50, 5, 2, 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=360&auto=format&fit=crop&q=80'),
    ('SKU-775018', 'Mantequilla con Sal 200g', 6.50, 5, 3, 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=360&auto=format&fit=crop&q=80'),
    ('SKU-775029', 'Chocolate Bitter 70% 100g', 6.90, 5, 6, 'https://images.unsplash.com/photo-1548907040-4baa42d10919?w=360&auto=format&fit=crop&q=80'),
    ('SKU-775079', 'Desinfectante Aerosol 360ml', 12.80, 5, 5, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=360&auto=format&fit=crop&q=80');

-- 3. INVENTARIO (stock actual por producto)
INSERT INTO inventario (id_producto, cantidad_actual) VALUES
    (1, 42), (2, 28), (3, 3), (4, 64), (5, 19), (6, 50),
    (7, 14), (8, 2), (9, 22), (10, 16), (11, 75), (12, 35),
    (13, 80), (14, 26), (15, 12), (16, 25), (17, 30), (18, 40),
    (19, 45), (20, 18), (21, 24), (22, 29), (23, 38), (24, 15);

-- 4. CLIENTES
INSERT INTO clientes (tipo_identificacion, numero_identificacion, nombres, apellidos) VALUES
    ('GENERAL', '0000000000', 'Consumidor', 'Final'),
    ('DNI', '47891234', 'Carlos', 'Mendoza Ruiz'),
    ('RUC', '20556677889', 'Distribuidora El Sol', 'S.A.C.');

-- 5. ROLES
INSERT INTO roles (nombre, descripcion) VALUES
    ('Administrador', 'Control Total / Cierres Z / Anulaciones'),
    ('Supervisor de Caja', 'Aperturas / Arqueos X / Descuentos 30%'),
    ('Cajero', 'Cobro Estándar / Emisión de Boletas');

-- 6. PERMISOS
INSERT INTO permisos (nombre, descripcion, modulo) VALUES
    ('ver_pos', 'Acceso al Terminal POS', 'POS'),
    ('cobrar', 'Realizar cobros y emitir comprobantes', 'POS'),
    ('aplicar_descuento', 'Aplicar descuentos a ventas', 'POS'),
    ('anular_venta', 'Anular ventas completadas', 'POS'),
    ('ver_caja', 'Ver control de caja', 'CAJA'),
    ('abrir_caja', 'Apertura de caja', 'CAJA'),
    ('cerrar_caja', 'Cierre de caja (Z)', 'CAJA'),
    ('corte_parcial', 'Realizar corte parcial (X)', 'CAJA'),
    ('ver_inventario', 'Ver catálogo e inventario', 'INVENTARIO'),
    ('crear_producto', 'Crear nuevos productos', 'INVENTARIO'),
    ('editar_producto', 'Editar productos existentes', 'INVENTARIO'),
    ('ver_clientes', 'Ver directorio de clientes', 'CLIENTES'),
    ('crear_cliente', 'Registrar nuevos clientes', 'CLIENTES'),
    ('ver_empleados', 'Ver lista de empleados', 'EMPLEADOS'),
    ('crear_empleado', 'Registrar nuevos empleados', 'EMPLEADOS'),
    ('ver_auditoria', 'Ver registro de auditoría', 'AUDITORIA'),
    ('ver_compras', 'Ver compras y proveedores', 'COMPRAS'),
    ('crear_compra', 'Registrar compras', 'COMPRAS');

-- 7. ROL_PERMISO (Administrador = todos los permisos)
INSERT INTO rol_permiso (id_rol, id_permiso)
SELECT 1, id_permiso FROM permisos;

-- Supervisor = POS + CAJA + INVENTARIO (lectura) + CLIENTES
INSERT INTO rol_permiso (id_rol, id_permiso)
SELECT 2, id_permiso FROM permisos WHERE modulo IN ('POS', 'CAJA', 'CLIENTES') OR nombre IN ('ver_inventario', 'ver_empleados');

-- Cajero = POS básico + ver caja
INSERT INTO rol_permiso (id_rol, id_permiso) VALUES
    (3, 1), (3, 2), (3, 5), (3, 12);

-- 8. EMPLEADOS
INSERT INTO empleados (tipo_identificacion, numero_identificacion, nombres, apellidos, correo, cargo, fecha_ingreso) VALUES
    ('DNI', '10203040', 'Elena', 'Morales', 'elena.morales@nexpos.local', 'Administradora', '2022-01-15'),
    ('DNI', '10203041', 'Rodrigo', 'Alarcón', 'rodrigo.alarcon@nexpos.local', 'Supervisor de Caja', '2022-06-01'),
    ('DNI', '10203042', 'Camila', 'Valenzuela', 'camila.valenzuela@nexpos.local', 'Cajera Turno Mañana', '2023-03-10');

-- 9. USUARIOS (password_hash es placeholder - usar bcrypt en producción)
INSERT INTO usuarios (id_empleado, id_rol, nombre_usuario, password_hash) VALUES
    (1, 1, 'elena.morales', '$2b$10$placeholder_hash_admin'),
    (2, 2, 'rodrigo.alarcon', '$2b$10$placeholder_hash_supervisor'),
    (3, 3, 'camila.valenzuela', '$2b$10$placeholder_hash_cajero');

-- 10. FORMAS DE PAGO
INSERT INTO formas_pago (nombre, descripcion) VALUES
    ('Efectivo', 'Pago en efectivo con cálculo de vuelto'),
    ('Tarjeta POS', 'Pago con tarjeta de débito o crédito vía datáfono'),
    ('QR / Transferencia', 'Pago por código QR dinámico o transferencia bancaria');

-- 11. CAJA ABIERTA (Turno Mañana)
INSERT INTO cajas (id_usuario_apertura, monto_inicial, estado) VALUES
    (1, 150.00, 'ABIERTA');

-- 12. PROVEEDORES
INSERT INTO proveedores (nombre, identificacion, telefono, correo) VALUES
    ('Lácteos del Sur C.A.', 'RUC-20445566778', '+51-998877665', 'ventas@lacteossur.com'),
    ('Distribuidora Central S.A.', 'RUC-20334455667', '+51-997766554', 'pedidos@distcentral.com');

-- 13. VENTAS INICIALES (historial del turno)
INSERT INTO ventas (id_cliente, id_usuario, id_caja, subtotal, descuento_total, impuesto, total, estado) VALUES
    (1, 1, 1, 123.19, 6.16, 21.06, 138.09, 'COMPLETADA'),
    (1, 1, 1, 49.58, 0.00, 8.92, 58.50, 'ANULADA'),
    (2, 1, 1, 264.41, 0.00, 47.59, 312.00, 'COMPLETADA'),
    (1, 1, 1, 123.05, 0.00, 22.15, 145.20, 'COMPLETADA'),
    (3, 1, 1, 177.97, 0.00, 32.03, 210.00, 'COMPLETADA'),
    (1, 1, 1, 434.58, 0.00, 78.22, 512.80, 'COMPLETADA');

-- Actualizar fecha_anulacion para la venta anulada
UPDATE ventas SET fecha_anulacion = CURRENT_TIMESTAMP, usuario_anulacion = 1 WHERE id_venta = 2;

-- 14. FACTURAS
INSERT INTO facturas (numero_factura, id_venta) VALUES
    ('FAC-00892', 1),
    ('FAC-002339', 2),
    ('FAC-002340', 3),
    ('FAC-002341', 4),
    ('FAC-002338', 5),
    ('FAC-002337', 6);

-- Anular factura de la venta anulada
UPDATE facturas SET estado = 'ANULADA' WHERE id_venta = 2;

-- 15. PAGOS_VENTA
INSERT INTO pagos_venta (id_venta, id_forma_pago, monto) VALUES
    (1, 1, 138.09),
    (2, 1, 58.50),
    (3, 2, 312.00),
    (4, 1, 145.20),
    (5, 3, 210.00),
    (6, 1, 512.80);

-- 16. PEDIDOS PROVEEDOR
INSERT INTO pedidos_proveedor (id_proveedor, id_usuario, estado, observacion) VALUES
    (1, 1, 'RECIBIDO', '120 unidades de Leche Entera recepcionadas'),
    (2, 1, 'PENDIENTE', '48 unidades Aceite Vegetal en camino');

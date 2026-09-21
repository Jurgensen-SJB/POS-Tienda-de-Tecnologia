-- =====================================================
-- SEED DATA: Datos iniciales para Tienda de Tecnología
-- Especializada en Laptops, Smartphones, Hardware y Periféricos
-- =====================================================

-- 1. CATEGORÍAS TECNOLÓGICAS
INSERT INTO categorias (nombre, descripcion) VALUES
    ('Smartphones & Tablets', 'Teléfonos inteligentes, iPhones, Android y tablets de última generación'),
    ('Laptops & Computadores', 'Portátiles gamers, ultrabooks, PCs de escritorio y estaciones de trabajo'),
    ('Componentes & Hardware', 'Procesadores, tarjetas gráficas, placas madre y memorias RAM'),
    ('Periféricos & Gaming', 'Teclados mecánicos, mouse gamer, auriculares y mandos'),
    ('Audio & Video', 'Audífonos inalámbricos, monitores de alta tasa de refresco y cámaras'),
    ('Almacenamiento & Redes', 'Discos de estado sólido SSD NVMe, routers WiFi 6 y hubs');

-- 2. PRODUCTOS TECNOLÓGICOS (24 productos con imágenes y especificaciones)
INSERT INTO productos (codigo, nombre, descripcion, precio_venta, stock_minimo, id_categoria, imagen_url) VALUES
    -- Smartphones & Tablets (Cat 1)
    ('TEK-S001', 'iPhone 15 Pro 256GB Titanio', 'Chip A17 Pro, Cámara 48MP, Pantalla Super Retina XDR 120Hz', 1199.00, 3, 1, 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=360&auto=format&fit=crop&q=80'),
    ('TEK-S002', 'Samsung Galaxy S24 Ultra 256GB', 'Snapdragon 8 Gen 3, S-Pen integrado, Cámara 200MP con IA', 1249.00, 3, 1, 'https://images.unsplash.com/photo-1710492729857-6b4bfb0b8ef8?w=360&auto=format&fit=crop&q=80'),
    ('TEK-S003', 'Xiaomi Redmi Note 13 Pro+ 5G', '256GB, 12GB RAM, Pantalla AMOLED Curva 1.5K 120Hz', 389.00, 5, 1, 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=360&auto=format&fit=crop&q=80'),
    ('TEK-S004', 'iPad Air 11" M2 128GB Wi-Fi', 'Pantalla Liquid Retina, compatible con Apple Pencil Pro', 599.00, 3, 1, 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=360&auto=format&fit=crop&q=80'),

    -- Laptops & Computadores (Cat 2)
    ('TEK-L001', 'MacBook Air 13.6" Chip M2', '8-Core CPU, 8GB RAM Unificada, 256GB SSD, Color Medianoche', 1099.00, 2, 2, 'https://images.unsplash.com/photo-1611186871525-12e30a84d70e?w=360&auto=format&fit=crop&q=80'),
    ('TEK-L002', 'Laptop ASUS ROG Strix G16', 'Core i7-13650HX, RTX 4060 8GB, 16GB DDR5, 512GB NVMe, 165Hz', 1399.00, 2, 2, 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=360&auto=format&fit=crop&q=80'),
    ('TEK-L003', 'Laptop Lenovo ThinkPad E14 Gen 5', 'Ryzen 7 7730U, 16GB RAM, 512GB SSD, Pantalla 14" FHD IPS', 849.00, 4, 2, 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=360&auto=format&fit=crop&q=80'),
    ('TEK-L004', 'PC Gamer NexCore RTX 4070', 'Intel Core i7-14700F, 32GB RAM DDR5, SSD 1TB NVMe, Refrigeración Líquida', 1699.00, 2, 2, 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=360&auto=format&fit=crop&q=80'),

    -- Componentes & Hardware (Cat 3)
    ('TEK-C001', 'Procesador AMD Ryzen 7 7800X3D', '8 Núcleos / 16 Hilos, 5.0 GHz Max Boost, 104MB Cache 3D V-Cache', 389.00, 4, 3, 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=360&auto=format&fit=crop&q=80'),
    ('TEK-C002', 'Tarjeta Gráfica RTX 4070 Super 12GB', 'GeForce RTX 4070 SUPER OC Edition 12GB GDDR6X, DLSS 3', 649.00, 3, 3, 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=360&auto=format&fit=crop&q=80'),
    ('TEK-C003', 'Memoria RAM Corsair Vengeance 32GB', 'Kit 2x16GB DDR5 6000MHz CL30 RGB compatible XMP y EXPO', 129.00, 6, 3, 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=360&auto=format&fit=crop&q=80'),
    ('TEK-C004', 'Placa Madre ASUS ROG Strix B650-A', 'Socket AM5, PCIe 5.0, WiFi 6E, 2.5Gb Ethernet, Aura Sync', 229.00, 3, 3, 'https://images.unsplash.com/photo-1555617778-02518510b9fa?w=360&auto=format&fit=crop&q=80'),

    -- Periféricos & Gaming (Cat 4)
    ('TEK-P001', 'Teclado Mecánico Keychron K2 Wireless', 'Interruptores Mecánicos Gateron G Pro Brown, Bluetooth / Cable, RGB', 99.00, 5, 4, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=360&auto=format&fit=crop&q=80'),
    ('TEK-P002', 'Mouse Gamer Logitech G502 X PLUS', 'Sensor HERO 25K, Switches Híbridos LIGHTFORCE, RGB Lightsync', 139.00, 6, 4, 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=360&auto=format&fit=crop&q=80'),
    ('TEK-P003', 'Auriculares HyperX Cloud III Wireless', 'Transductores de 53 mm angulados, Audio espacial DTS Headphone:X, 120h batería', 149.00, 5, 4, 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=360&auto=format&fit=crop&q=80'),
    ('TEK-P004', 'Control Inalámbrico PS5 DualSense', 'Retroalimentación háptica, gatillos adaptativos y micrófono integrado', 69.00, 8, 4, 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=360&auto=format&fit=crop&q=80'),

    -- Audio & Video (Cat 5)
    ('TEK-A001', 'Audífonos Sony WH-1000XM5 ANC', 'Cancelación de ruido adaptativa, Hi-Res Audio inalámbrico LDAC, 30h batería', 349.00, 4, 5, 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=360&auto=format&fit=crop&q=80'),
    ('TEK-A002', 'Monitor LG UltraGear 27" 165Hz QHD', 'Panel Nano IPS 1ms, resolución 2560x1440, G-Sync Compatible, HDR400', 289.00, 3, 5, 'https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=360&auto=format&fit=crop&q=80'),
    ('TEK-A003', 'Parlante Bluetooth JBL Charge 5', 'Sonido profesional JBL Original Pro, 20 horas de batería, IP67 impermeable', 159.00, 5, 5, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=360&auto=format&fit=crop&q=80'),
    ('TEK-A004', 'Webcam Logitech C920 Pro HD', 'Full HD 1080p a 30fps, enfoque automático y micrófonos estéreo duales', 79.00, 6, 5, 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=360&auto=format&fit=crop&q=80'),

    -- Almacenamiento & Redes (Cat 6)
    ('TEK-M001', 'SSD NVMe Samsung 990 PRO 2TB', 'PCIe 4.0 NVMe M.2 2280, Lecturas secuenciales hasta 7450 MB/s', 179.00, 8, 6, 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=360&auto=format&fit=crop&q=80'),
    ('TEK-M002', 'SSD NVMe Kingston NV2 1TB', 'PCIe 4.0 x4 M.2 2280, Lectura hasta 3500 MB/s, bajo consumo térmico', 69.00, 10, 6, 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=360&auto=format&fit=crop&q=80'),
    ('TEK-M003', 'Router ASUS ROG Rapture WiFi 6', 'Dual-Band Gaming Router GT-AX6000, 2 puertos 2.5G WAN/LAN, AiProtection Pro', 249.00, 4, 6, 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=360&auto=format&fit=crop&q=80'),
    ('TEK-M004', 'Hub USB-C Anker 8 en 1 4K HDMI', 'PowerExpand 8-in-1, Power Delivery 100W, HDMI 4K 60Hz, Gigabit Ethernet', 55.00, 12, 6, 'https://images.unsplash.com/photo-1618410320928-25228d811631?w=360&auto=format&fit=crop&q=80');

-- 3. INVENTARIO (existencias de cada producto)
INSERT INTO inventario (id_producto, cantidad_actual) VALUES
    (1, 15), (2, 12), (3, 24), (4, 10),
    (5, 8),  (6, 6),  (7, 14), (8, 5),
    (9, 18), (10, 9), (11, 25), (12, 11),
    (13, 22), (14, 30), (15, 16), (16, 28),
    (17, 14), (18, 12), (19, 20), (20, 19),
    (21, 35), (22, 45), (23, 10), (24, 40);

-- 4. CLIENTES
INSERT INTO clientes (tipo_identificacion, numero_identificacion, nombres, apellidos, telefono, correo) VALUES
    ('GENERAL', '0000000000', 'Consumidor', 'Final', '-', '-'),
    ('DNI', '47891234', 'Carlos', 'Mendoza Ruiz', '+51 987 654 321', 'carlos.mendoza@email.com'),
    ('RUC', '20556677889', 'TechCorp', 'Perú S.A.C.', '+51 1 456 7890', 'compras@techcorp.pe');

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
    ('DNI', '10203040', 'Elena', 'Morales', 'elena.morales@nexpos.local', 'Administradora General', '2022-01-15'),
    ('DNI', '10203041', 'Rodrigo', 'Alarcón', 'rodrigo.alarcon@nexpos.local', 'Supervisor de Caja', '2022-06-01'),
    ('DNI', '10203042', 'Camila', 'Valenzuela', 'camila.valenzuela@nexpos.local', 'Especialista en Ventas', '2023-03-10');

-- 9. USUARIOS
INSERT INTO usuarios (id_empleado, id_rol, nombre_usuario, password_hash) VALUES
    (1, 1, 'elena.morales', '$2b$10$placeholder_hash_admin'),
    (2, 2, 'rodrigo.alarcon', '$2b$10$placeholder_hash_supervisor'),
    (3, 3, 'camila.valenzuela', '$2b$10$placeholder_hash_cajero');

-- 10. FORMAS DE PAGO
INSERT INTO formas_pago (nombre, descripcion) VALUES
    ('Efectivo', 'Pago en efectivo con cálculo de cambio'),
    ('Tarjeta POS', 'Tarjeta de débito o crédito / Terminal POS'),
    ('QR / Transferencia', 'Transferencia bancaria o billetera digital');

-- 11. CAJA ABIERTA
INSERT INTO cajas (id_usuario_apertura, monto_inicial, estado) VALUES
    (1, 350.00, 'ABIERTA');

-- 12. PROVEEDORES TECNOLÓGICOS
INSERT INTO proveedores (nombre, identificacion, telefono, correo) VALUES
    ('TechDistributor International Inc.', 'RUC-20601234567', '+51-998877665', 'ventas@techdistributor.com'),
    ('NexCore Hardware Mayorista S.A.', 'RUC-20519876543', '+51-997766554', 'pedidos@nexcorehw.com');

-- 13. VENTAS INICIALES (historial tecnológico)
INSERT INTO ventas (id_cliente, id_usuario, id_caja, subtotal, descuento_total, impuesto, total, estado) VALUES
    (1, 1, 1, 1016.10, 50.00, 173.90, 1140.00, 'COMPLETADA'),
    (1, 1, 1, 126.27, 0.00, 22.73, 149.00, 'ANULADA'),
    (2, 1, 1, 244.92, 0.00, 44.08, 289.00, 'COMPLETADA'),
    (1, 1, 1, 83.90, 0.00, 15.10, 99.00, 'COMPLETADA'),
    (3, 1, 1, 1440.68, 0.00, 259.32, 1700.00, 'COMPLETADA'),
    (1, 1, 1, 295.76, 0.00, 53.24, 349.00, 'COMPLETADA');

UPDATE ventas SET fecha_anulacion = CURRENT_TIMESTAMP, usuario_anulacion = 1 WHERE id_venta = 2;

-- 14. FACTURAS
INSERT INTO facturas (numero_factura, id_venta) VALUES
    ('FAC-00892', 1),
    ('FAC-002339', 2),
    ('FAC-002340', 3),
    ('FAC-002341', 4),
    ('FAC-002338', 5),
    ('FAC-002337', 6);

UPDATE facturas SET estado = 'ANULADA' WHERE id_venta = 2;

-- 15. PAGOS_VENTA
INSERT INTO pagos_venta (id_venta, id_forma_pago, monto) VALUES
    (1, 1, 1140.00),
    (2, 1, 149.00),
    (3, 2, 289.00),
    (4, 1, 99.00),
    (5, 3, 1700.00),
    (6, 1, 349.00);

-- 16. PEDIDOS PROVEEDOR
INSERT INTO pedidos_proveedor (id_proveedor, id_usuario, estado, observacion) VALUES
    (1, 1, 'RECIBIDO', '20 unidades de Laptops y Smartphones recepcionados'),
    (2, 1, 'PENDIENTE', '50 unidades de SSD NVMe y RAM DDR5 en camino');

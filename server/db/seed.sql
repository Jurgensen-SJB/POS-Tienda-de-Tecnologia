-- =====================================================
-- SEED DATA: Reflejo exacto y actualizado de la base de datos
-- NexPOS Suite Tienda de Tecnologia
-- =====================================================

-- 1. PROVEEDORES
INSERT INTO proveedores (id_proveedor, nombre, identificacion, telefono, correo, direccion, estado) VALUES
  (1, 'TechDistributor Colombia S.A.S.', 'NIT-900601234-5', '+57 310 998 8776', 'ventas@techdistributor.co', 'Av. El Dorado #68B-85, Bogotá D.C.', 'ACTIVO'),
  (2, 'NexCore Hardware Mayorista S.A.S.', 'NIT-900519876-4', '+57 311 997 7665', 'pedidos@nexcorehw.co', 'Av. Libertadores #15-40, Cúcuta', 'ACTIVO'),
  (3, 'Apple Colombia S.A.S.', 'NIT-900612345-6', '+57 312 991 1223', 'distribuidores@apple.co', 'Cra. 11 #82-01, Bogotá D.C.', 'INACTIVO'),
  (4, 'Samsung Electronics Colombia S.A.', 'NIT-830028931-5', '+57 314 992 2334', 'b2b@samsung.com.co', 'Cra. 7 #113-43, Bogotá D.C.', 'ACTIVO'),
  (5, 'Logitech Distribuciones Colombia', 'NIT-900845678-9', '+57 315 993 3445', 'ventas@logitech-latam.com', 'Calle 93A #11-28, Bogotá D.C.', 'ACTIVO'),
  (6, 'Kingston Technology Colombia', 'NIT-900956789-0', '+57 316 994 4556', 'ventas@kingston.com.co', 'Cra. 43A #1-50, El Poblado, Medellín', 'ACTIVO'),
  (7, 'ASUS ROG Technologies Colombia S.A.S.', 'NIT-900998877-6', '+57 317 998 8001', 'soporte@asus-colombia.com', 'Av. 6N #28N-102, Cali', 'ACTIVO'),
  (8, 'MSI Gaming Colombia S.A.S.', 'NIT-900456789-1', '+57 318 998 8112', 'ventas@msi.com.co', 'Cra. 51B #80-58, Barranquilla', 'ACTIVO')
ON CONFLICT (id_proveedor) DO UPDATE SET nombre = EXCLUDED.nombre, identificacion = EXCLUDED.identificacion;
SELECT setval('proveedores_id_proveedor_seq', (SELECT MAX(id_proveedor) FROM proveedores));

-- 2. CATEGORIAS
INSERT INTO categorias (id_categoria, nombre, descripcion, estado) VALUES
  (1, "Smartphones & Tablets", "Teléfonos inteligentes, iPhones, Android y tablets de última generación", "ACTIVO"),
  (2, "Laptops & Computadores", "Portátiles gamers, ultrabooks, PCs de escritorio y estaciones de trabajo", "ACTIVO"),
  (3, "Componentes & Hardware", "Procesadores, tarjetas gráficas, placas madre y memorias RAM", "ACTIVO"),
  (4, "Periféricos & Gaming", "Teclados mecánicos, mouse gamer, auriculares y mandos", "ACTIVO"),
  (5, "Audio & Video", "Audífonos inalámbricos, monitores de alta tasa de refresco y cámaras", "ACTIVO"),
  (6, "Almacenamiento & Redes", "Discos de estado sólido SSD NVMe, routers WiFi 6 y hubs", "ACTIVO"),
  (7, "Realidad Virtual, Drones & Robótica", "Visores VR, drones con cámara 4K y accesorios", "ACTIVO"),
  (8, "Drones", "Bonitos", "INACTIVO"),
  (9, "Wearables & Relojes Inteligentes", "Smartwatches, pulseras de actividad y bandas deportivas con sensores biométricos", "ACTIVO")
ON CONFLICT (id_categoria) DO UPDATE SET nombre = EXCLUDED.nombre;
SELECT setval('categorias_id_categoria_seq', (SELECT MAX(id_categoria) FROM categorias));

-- 3. PRODUCTOS
INSERT INTO productos (id_producto, codigo, nombre, descripcion, precio_venta, stock_minimo, id_categoria, id_proveedor, imagen_url, estado) VALUES
  (1, "TEK-S001", "iPhone 15 Pro 256GB Titanio", "Chip A17 Pro, Cámara 48MP, Pantalla Super Retina XDR 120Hz", 1199.00, 3, 1, 1, "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=360&auto=format&fit=crop&q=80", "ACTIVO"),
  (2, "TEK-S002", "Samsung Galaxy S24 Ultra 256GB", "Snapdragon 8 Gen 3, S-Pen integrado, Cámara 200MP con IA", 1249.00, 3, 1, 4, "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=360&auto=format&fit=crop&q=80", "ACTIVO"),
  (3, "TEK-S003", "Xiaomi Redmi Note 13 Pro+ 5G", "256GB, 12GB RAM, Pantalla AMOLED Curva 1.5K 120Hz", 389.00, 5, 1, 5, "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=360&auto=format&fit=crop&q=80", "ACTIVO"),
  (4, "TEK-S004", "iPad Air 11\" M2 128GB Wi-Fi", "Pantalla Liquid Retina, compatible con Apple Pencil Pro", 599.00, 3, 1, 1, "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=360&auto=format&fit=crop&q=80", "ACTIVO"),
  (5, "TEK-L001", "MacBook Air 13.6\" Chip M2", "8-Core CPU, 8GB RAM Unificada, 256GB SSD, Color Medianoche", 1099.00, 2, 2, 4, "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=360&auto=format&fit=crop&q=80", "ACTIVO"),
  (6, "TEK-L002", "Laptop ASUS ROG Strix G16", "Core i7-13650HX, RTX 4060 8GB, 16GB DDR5, 512GB NVMe, 165Hz", 1399.00, 2, 2, 5, "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=360&auto=format&fit=crop&q=80", "ACTIVO"),
  (7, "TEK-L003", "Laptop Lenovo ThinkPad E14 Gen 5", "Ryzen 7 7730U, 16GB RAM, 512GB SSD, Pantalla 14\" FHD IPS", 849.00, 4, 2, 1, "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=360&auto=format&fit=crop&q=80", "ACTIVO"),
  (8, "TEK-L004", "PC Gamer NexCore RTX 4070", "Intel Core i7-14700F, 32GB RAM DDR5, SSD 1TB NVMe, Refrigeración Líquida", 1699.00, 2, 2, 4, "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=360&auto=format&fit=crop&q=80", "ACTIVO"),
  (9, "TEK-C001", "Procesador AMD Ryzen 7 7800X3D", "8 Núcleos / 16 Hilos, 5.0 GHz Max Boost, 104MB Cache 3D V-Cache", 389.00, 4, 3, 5, "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=360&auto=format&fit=crop&q=80", "ACTIVO"),
  (10, "TEK-C002", "Tarjeta Gráfica RTX 4070 Super 12GB", "GeForce RTX 4070 SUPER OC Edition 12GB GDDR6X, DLSS 3", 649.00, 3, 3, 1, "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=360&auto=format&fit=crop&q=80", "ACTIVO"),
  (11, "TEK-C003", "Memoria RAM Corsair Vengeance 32GB", "Kit 2x16GB DDR5 6000MHz CL30 RGB compatible XMP y EXPO", 129.00, 6, 3, 4, "https://images.unsplash.com/photo-1562976540-1502c2145186?w=360&auto=format&fit=crop&q=80", "ACTIVO"),
  (12, "TEK-C004", "Placa Madre ASUS ROG Strix B650-A", "Socket AM5, PCIe 5.0, WiFi 6E, 2.5Gb Ethernet, Aura Sync", 229.00, 3, 3, 5, "https://images.unsplash.com/photo-1555617778-02518510b9fa?w=360&auto=format&fit=crop&q=80", "ACTIVO"),
  (13, "TEK-P001", "Teclado Mecánico Keychron K2 Wireless", "Interruptores Mecánicos Gateron G Pro Brown, Bluetooth / Cable, RGB", 99.00, 5, 4, 1, "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=360&auto=format&fit=crop&q=80", "INACTIVO"),
  (14, "TEK-P002", "Mouse Gamer Logitech G502 X PLUS", "Sensor HERO 25K, Switches Híbridos LIGHTFORCE, RGB Lightsync", 139.00, 6, 4, 4, "https://images.unsplash.com/photo-1527814050087-3793815479db?w=360&auto=format&fit=crop&q=80", "ACTIVO"),
  (15, "TEK-P003", "Auriculares HyperX Cloud III Wireless", "Transductores de 53 mm angulados, Audio espacial DTS Headphone:X, 120h batería", 149.00, 5, 4, 5, "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=360&auto=format&fit=crop&q=80", "ACTIVO"),
  (16, "TEK-P004", "Control Inalámbrico PS5 DualSense", "Retroalimentación háptica, gatillos adaptativos y micrófono integrado", 69.00, 8, 4, 1, "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=360&auto=format&fit=crop&q=80", "ACTIVO"),
  (17, "TEK-A001", "Audífonos Sony WH-1000XM5 ANC", "Cancelación de ruido adaptativa, Hi-Res Audio inalámbrico LDAC, 30h batería", 349.00, 4, 5, 4, "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=360&auto=format&fit=crop&q=80", "ACTIVO"),
  (18, "TEK-A002", "Monitor LG UltraGear 27\" 165Hz QHD", "Panel Nano IPS 1ms, resolución 2560x1440, G-Sync Compatible, HDR400", 289.00, 3, 5, 5, "https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=360&auto=format&fit=crop&q=80", "ACTIVO"),
  (19, "TEK-A003", "Parlante Bluetooth JBL Charge 5", "Sonido profesional JBL Original Pro, 20 horas de batería, IP67 impermeable", 159.00, 5, 5, 1, "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=360&auto=format&fit=crop&q=80", "ACTIVO"),
  (20, "TEK-A004", "Webcam Logitech C920 Pro HD", "Full HD 1080p a 30fps, enfoque automático y micrófonos estéreo duales", 79.00, 6, 5, 4, "https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=360&auto=format&fit=crop&q=80", "ACTIVO"),
  (21, "TEK-M001", "SSD NVMe Samsung 990 PRO 2TB", "PCIe 4.0 NVMe M.2 2280, Lecturas secuenciales hasta 7450 MB/s", 179.00, 8, 6, 5, "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=360&auto=format&fit=crop&q=80", "ACTIVO"),
  (22, "TEK-M002", "SSD NVMe Kingston NV2 1TB", "PCIe 4.0 x4 M.2 2280, Lectura hasta 3500 MB/s, bajo consumo térmico", 69.00, 10, 6, 1, "https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=360&auto=format&fit=crop&q=80", "ACTIVO"),
  (23, "TEK-M003", "Router ASUS ROG Rapture WiFi 6", "Dual-Band Gaming Router GT-AX6000, 2 puertos 2.5G WAN/LAN, AiProtection Pro", 249.00, 4, 6, 4, "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=360&auto=format&fit=crop&q=80", "ACTIVO"),
  (24, "TEK-M004", "Hub USB-C Anker 8 en 1 4K HDMI", "PowerExpand 8-in-1, Power Delivery 100W, HDMI 4K 60Hz, Gigabit Ethernet", 55.00, 12, 6, 5, "https://images.unsplash.com/photo-1618410320928-25228d811631?w=360&auto=format&fit=crop&q=80", "ACTIVO")
ON CONFLICT (id_producto) DO UPDATE SET nombre = EXCLUDED.nombre, precio_venta = EXCLUDED.precio_venta, imagen_url = EXCLUDED.imagen_url, id_proveedor = EXCLUDED.id_proveedor;
SELECT setval('productos_id_producto_seq', (SELECT MAX(id_producto) FROM productos));

-- 4. INVENTARIO
INSERT INTO inventario (id_producto, cantidad_actual) VALUES
  (1, 20),
  (2, 3),
  (3, 23),
  (4, 18),
  (5, 8),
  (6, 10),
  (7, 6),
  (8, 4),
  (9, 18),
  (10, 4),
  (11, 25),
  (12, 11),
  (13, 22),
  (14, 28),
  (15, 16),
  (16, 26),
  (17, 14),
  (18, 12),
  (19, 20),
  (20, 19),
  (21, 35),
  (22, 45),
  (23, 6),
  (24, 40)
ON CONFLICT (id_producto) DO UPDATE SET cantidad_actual = EXCLUDED.cantidad_actual;

-- 5. CLIENTES
INSERT INTO clientes (id_cliente, tipo_identificacion, numero_identificacion, nombres, apellidos, telefono, correo, direccion, correo_verificado, estado) VALUES
  (2, 'CC', '1020478912', 'Carlos', 'Mendoza Ruiz', '+57 300 654 3210', 'carlos.mendoza@email.com', 'Cra. 7 #72-41, Chapinero, Bogotá D.C.', TRUE, 'ACTIVO'),
  (3, 'NIT', '900556677-8', 'TechCorp', 'Colombia S.A.S.', '+57 601 456 7890', 'compras@techcorp.co', 'Calle 100 #19-61, Usaquén, Bogotá D.C.', TRUE, 'ACTIVO'),
  (4, 'CC', '1032345678', 'Valentina', 'Torres', '+57 300 456 7890', 'valentina.torres@email.com', 'Cra 15 #88-20, Bogotá D.C.', TRUE, 'ACTIVO'),
  (5, 'CC', '1015433333', 'Juan', 'Gómez', '+57 310 555 1234', 'juan.gomez@email.com', 'Calle 72 #10-34, Bogotá D.C.', FALSE, 'ACTIVO'),
  (6, 'CC', '1098723456', 'Camila', 'Pérez', '+57 315 888 9900', 'camila.perez@email.com', 'Av. El Dorado #68, Bogotá D.C.', TRUE, 'ACTIVO')
ON CONFLICT (id_cliente) DO UPDATE SET nombres = EXCLUDED.nombres, correo = EXCLUDED.correo, correo_verificado = EXCLUDED.correo_verificado;
SELECT setval('clientes_id_cliente_seq', (SELECT MAX(id_cliente) FROM clientes));


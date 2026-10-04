-- =====================================================
-- BASE DE DATOS: tienda_tecnologia
-- Sistema de Gestión para Tienda de Tecnología
-- Motor: PostgreSQL 14+
-- Adaptado desde MySQL 8.0 → PostgreSQL
-- =====================================================

-- =====================================================
-- 1. TABLA: CATEGORIAS
-- =====================================================
CREATE TABLE IF NOT EXISTS categorias (
    id_categoria SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255),
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
        CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_categoria_nombre UNIQUE (nombre)
);

-- =====================================================
-- 2. TABLA: PROVEEDORES
-- =====================================================
CREATE TABLE IF NOT EXISTS proveedores (
    id_proveedor SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    identificacion VARCHAR(50),
    telefono VARCHAR(30),
    correo VARCHAR(150),
    direccion VARCHAR(200),
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
        CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_proveedor_identificacion UNIQUE (identificacion)
);

-- =====================================================
-- 3. TABLA: PRODUCTOS
-- =====================================================
CREATE TABLE IF NOT EXISTS productos (
    id_producto SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio_venta DECIMAL(12,2) NOT NULL,
    stock_minimo INT NOT NULL DEFAULT 0,
    id_categoria INT NOT NULL,
    id_proveedor INT NULL,
    imagen_url TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
        CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_producto_codigo UNIQUE (codigo),
    CONSTRAINT chk_producto_precio CHECK (precio_venta >= 0),
    CONSTRAINT chk_producto_stock_minimo CHECK (stock_minimo >= 0),
    CONSTRAINT fk_producto_categoria
        FOREIGN KEY (id_categoria)
        REFERENCES categorias(id_categoria)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_producto_proveedor
        FOREIGN KEY (id_proveedor)
        REFERENCES proveedores(id_proveedor)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- =====================================================
-- 4. TABLA: CLIENTES
-- =====================================================
CREATE TABLE IF NOT EXISTS clientes (
    id_cliente SERIAL PRIMARY KEY,
    tipo_identificacion VARCHAR(30) NOT NULL,
    numero_identificacion VARCHAR(50) NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100),
    telefono VARCHAR(30),
    correo VARCHAR(150),
    direccion VARCHAR(200),
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
        CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_cliente_identificacion UNIQUE (numero_identificacion)
);

-- =====================================================
-- 5. TABLA: EMPLEADOS
-- =====================================================
CREATE TABLE IF NOT EXISTS empleados (
    id_empleado SERIAL PRIMARY KEY,
    tipo_identificacion VARCHAR(30) NOT NULL,
    numero_identificacion VARCHAR(50) NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    telefono VARCHAR(30),
    correo VARCHAR(150),
    cargo VARCHAR(100),
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
        CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    fecha_ingreso DATE NOT NULL,
    CONSTRAINT uq_empleado_identificacion UNIQUE (numero_identificacion)
);

-- =====================================================
-- 6. TABLA: ROLES
-- =====================================================
CREATE TABLE IF NOT EXISTS roles (
    id_rol SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255),
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
        CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    CONSTRAINT uq_rol_nombre UNIQUE (nombre)
);

-- =====================================================
-- 7. TABLA: PERMISOS
-- =====================================================
CREATE TABLE IF NOT EXISTS permisos (
    id_permiso SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255),
    modulo VARCHAR(100) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
        CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    CONSTRAINT uq_permiso_nombre UNIQUE (nombre)
);

-- =====================================================
-- 8. TABLA: ROL_PERMISO (M:N)
-- =====================================================
CREATE TABLE IF NOT EXISTS rol_permiso (
    id_rol INT NOT NULL,
    id_permiso INT NOT NULL,
    PRIMARY KEY (id_rol, id_permiso),
    CONSTRAINT fk_rol_permiso_rol
        FOREIGN KEY (id_rol)
        REFERENCES roles(id_rol)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_rol_permiso_permiso
        FOREIGN KEY (id_permiso)
        REFERENCES permisos(id_permiso)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- =====================================================
-- 9. TABLA: USUARIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario SERIAL PRIMARY KEY,
    id_empleado INT NOT NULL,
    id_rol INT NOT NULL,
    nombre_usuario VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
        CHECK (estado IN ('ACTIVO', 'INACTIVO', 'BLOQUEADO')),
    ultimo_acceso TIMESTAMP NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_usuario_nombre UNIQUE (nombre_usuario),
    CONSTRAINT uq_usuario_empleado UNIQUE (id_empleado),
    CONSTRAINT fk_usuario_empleado
        FOREIGN KEY (id_empleado)
        REFERENCES empleados(id_empleado)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_usuario_rol
        FOREIGN KEY (id_rol)
        REFERENCES roles(id_rol)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =====================================================
-- 10. TABLA: FORMAS_PAGO
-- =====================================================
CREATE TABLE IF NOT EXISTS formas_pago (
    id_forma_pago SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255),
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
        CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    CONSTRAINT uq_forma_pago_nombre UNIQUE (nombre)
);

-- =====================================================
-- 11. TABLA: CAJAS
-- =====================================================
CREATE TABLE IF NOT EXISTS cajas (
    id_caja SERIAL PRIMARY KEY,
    id_usuario_apertura INT NOT NULL,
    fecha_apertura TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    monto_inicial DECIMAL(12,2) NOT NULL DEFAULT 0,
    id_usuario_cierre INT NULL,
    fecha_cierre TIMESTAMP NULL,
    monto_final DECIMAL(12,2) NULL,
    diferencia DECIMAL(12,2) NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'ABIERTA'
        CHECK (estado IN ('ABIERTA', 'CERRADA')),
    CONSTRAINT chk_caja_monto_inicial CHECK (monto_inicial >= 0),
    CONSTRAINT fk_caja_usuario_apertura
        FOREIGN KEY (id_usuario_apertura)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_caja_usuario_cierre
        FOREIGN KEY (id_usuario_cierre)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =====================================================
-- 12. TABLA: VENTAS
-- =====================================================
CREATE TABLE IF NOT EXISTS ventas (
    id_venta SERIAL PRIMARY KEY,
    id_cliente INT NULL,
    id_usuario INT NOT NULL,
    id_caja INT NOT NULL,
    fecha_venta TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    descuento_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    impuesto DECIMAL(12,2) NOT NULL DEFAULT 0,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    estado VARCHAR(20) NOT NULL DEFAULT 'COMPLETADA'
        CHECK (estado IN ('COMPLETADA', 'ANULADA')),
    fecha_anulacion TIMESTAMP NULL,
    usuario_anulacion INT NULL,
    CONSTRAINT chk_venta_subtotal CHECK (subtotal >= 0),
    CONSTRAINT chk_venta_descuento CHECK (descuento_total >= 0),
    CONSTRAINT chk_venta_total CHECK (total >= 0),
    CONSTRAINT fk_venta_cliente
        FOREIGN KEY (id_cliente)
        REFERENCES clientes(id_cliente)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_venta_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_venta_caja
        FOREIGN KEY (id_caja)
        REFERENCES cajas(id_caja)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_venta_usuario_anulacion
        FOREIGN KEY (usuario_anulacion)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =====================================================
-- 13. TABLA: DETALLE_VENTA
-- =====================================================
CREATE TABLE IF NOT EXISTS detalle_venta (
    id_detalle_venta SERIAL PRIMARY KEY,
    id_venta INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(12,2) NOT NULL,
    descuento DECIMAL(12,2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(12,2) NOT NULL,
    CONSTRAINT chk_detalle_venta_cantidad CHECK (cantidad > 0),
    CONSTRAINT chk_detalle_venta_precio CHECK (precio_unitario >= 0),
    CONSTRAINT chk_detalle_venta_descuento CHECK (descuento >= 0),
    CONSTRAINT chk_detalle_venta_subtotal CHECK (subtotal >= 0),
    CONSTRAINT fk_detalle_venta_venta
        FOREIGN KEY (id_venta)
        REFERENCES ventas(id_venta)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_detalle_venta_producto
        FOREIGN KEY (id_producto)
        REFERENCES productos(id_producto)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =====================================================
-- 14. TABLA: FACTURAS
-- =====================================================
CREATE TABLE IF NOT EXISTS facturas (
    id_factura SERIAL PRIMARY KEY,
    numero_factura VARCHAR(50) NOT NULL,
    id_venta INT NOT NULL,
    fecha_emision TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) NOT NULL DEFAULT 'GENERADA'
        CHECK (estado IN ('GENERADA', 'ANULADA')),
    CONSTRAINT uq_factura_numero UNIQUE (numero_factura),
    CONSTRAINT uq_factura_venta UNIQUE (id_venta),
    CONSTRAINT fk_factura_venta
        FOREIGN KEY (id_venta)
        REFERENCES ventas(id_venta)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =====================================================
-- 15. TABLA: PAGOS_VENTA
-- =====================================================
CREATE TABLE IF NOT EXISTS pagos_venta (
    id_pago SERIAL PRIMARY KEY,
    id_venta INT NOT NULL,
    id_forma_pago INT NOT NULL,
    monto DECIMAL(12,2) NOT NULL,
    referencia VARCHAR(150) NULL,
    CONSTRAINT chk_pago_monto CHECK (monto > 0),
    CONSTRAINT fk_pago_venta
        FOREIGN KEY (id_venta)
        REFERENCES ventas(id_venta)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_pago_forma
        FOREIGN KEY (id_forma_pago)
        REFERENCES formas_pago(id_forma_pago)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =====================================================
-- 16. TABLA: INVENTARIO
-- =====================================================
CREATE TABLE IF NOT EXISTS inventario (
    id_inventario SERIAL PRIMARY KEY,
    id_producto INT NOT NULL,
    cantidad_actual INT NOT NULL DEFAULT 0,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_inventario_producto UNIQUE (id_producto),
    CONSTRAINT chk_inventario_cantidad CHECK (cantidad_actual >= 0),
    CONSTRAINT fk_inventario_producto
        FOREIGN KEY (id_producto)
        REFERENCES productos(id_producto)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =====================================================
-- 17. TABLA: PEDIDOS_PROVEEDOR
-- =====================================================
CREATE TABLE IF NOT EXISTS pedidos_proveedor (
    id_pedido SERIAL PRIMARY KEY,
    id_proveedor INT NOT NULL,
    id_usuario INT NOT NULL,
    fecha_pedido TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_recepcion TIMESTAMP NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado IN ('PENDIENTE', 'RECIBIDO', 'CANCELADO')),
    observacion TEXT NULL,
    CONSTRAINT fk_pedido_proveedor
        FOREIGN KEY (id_proveedor)
        REFERENCES proveedores(id_proveedor)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_pedido_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =====================================================
-- 18. TABLA: DETALLE_PEDIDO
-- =====================================================
CREATE TABLE IF NOT EXISTS detalle_pedido (
    id_detalle_pedido SERIAL PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad_solicitada INT NOT NULL,
    CONSTRAINT chk_detalle_pedido_cantidad CHECK (cantidad_solicitada > 0),
    CONSTRAINT fk_detalle_pedido_pedido
        FOREIGN KEY (id_pedido)
        REFERENCES pedidos_proveedor(id_pedido)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_detalle_pedido_producto
        FOREIGN KEY (id_producto)
        REFERENCES productos(id_producto)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =====================================================
-- 19. TABLA: COMPRAS
-- =====================================================
CREATE TABLE IF NOT EXISTS compras (
    id_compra SERIAL PRIMARY KEY,
    id_proveedor INT NOT NULL,
    id_pedido INT NULL,
    id_usuario INT NOT NULL,
    fecha_compra TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    estado VARCHAR(20) NOT NULL DEFAULT 'REGISTRADA'
        CHECK (estado IN ('REGISTRADA', 'ANULADA')),
    CONSTRAINT chk_compra_subtotal CHECK (subtotal >= 0),
    CONSTRAINT chk_compra_total CHECK (total >= 0),
    CONSTRAINT fk_compra_proveedor
        FOREIGN KEY (id_proveedor)
        REFERENCES proveedores(id_proveedor)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_compra_pedido
        FOREIGN KEY (id_pedido)
        REFERENCES pedidos_proveedor(id_pedido)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_compra_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =====================================================
-- 20. TABLA: DETALLE_COMPRA
-- =====================================================
CREATE TABLE IF NOT EXISTS detalle_compra (
    id_detalle_compra SERIAL PRIMARY KEY,
    id_compra INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL,
    costo_unitario DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    CONSTRAINT chk_detalle_compra_cantidad CHECK (cantidad > 0),
    CONSTRAINT chk_detalle_compra_costo CHECK (costo_unitario >= 0),
    CONSTRAINT chk_detalle_compra_subtotal CHECK (subtotal >= 0),
    CONSTRAINT fk_detalle_compra_compra
        FOREIGN KEY (id_compra)
        REFERENCES compras(id_compra)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_detalle_compra_producto
        FOREIGN KEY (id_producto)
        REFERENCES productos(id_producto)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =====================================================
-- 21. TABLA: MOVIMIENTOS_INVENTARIO
-- =====================================================
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id_movimiento SERIAL PRIMARY KEY,
    id_producto INT NOT NULL,
    id_usuario INT NOT NULL,
    tipo_movimiento VARCHAR(20) NOT NULL
        CHECK (tipo_movimiento IN ('ENTRADA', 'SALIDA', 'AJUSTE', 'DEVOLUCION')),
    cantidad INT NOT NULL,
    existencia_anterior INT NOT NULL,
    existencia_nueva INT NOT NULL,
    origen VARCHAR(100) NOT NULL,
    id_referencia INT NULL,
    fecha_movimiento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observacion VARCHAR(255) NULL,
    CONSTRAINT chk_movimiento_cantidad CHECK (cantidad > 0),
    CONSTRAINT chk_movimiento_existencia_anterior CHECK (existencia_anterior >= 0),
    CONSTRAINT chk_movimiento_existencia_nueva CHECK (existencia_nueva >= 0),
    CONSTRAINT fk_movimiento_producto
        FOREIGN KEY (id_producto)
        REFERENCES productos(id_producto)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_movimiento_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =====================================================
-- 22. TABLA: REGISTRO_OPERACIONES (Auditoría)
-- =====================================================
CREATE TABLE IF NOT EXISTS registro_operaciones (
    id_registro SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    operacion VARCHAR(20) NOT NULL
        CHECK (operacion IN ('CREAR', 'MODIFICAR', 'DESACTIVAR', 'ANULAR')),
    tabla_afectada VARCHAR(100) NOT NULL,
    id_registro_afectado INT NOT NULL,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    datos_anteriores JSONB NULL,
    datos_nuevos JSONB NULL,
    CONSTRAINT fk_registro_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =====================================================
-- FUNCIÓN: Actualizar fecha_actualizacion automáticamente
-- =====================================================
CREATE OR REPLACE FUNCTION update_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar fecha_actualizacion
CREATE OR REPLACE TRIGGER trg_productos_updated
    BEFORE UPDATE ON productos
    FOR EACH ROW EXECUTE FUNCTION update_fecha_actualizacion();

CREATE OR REPLACE TRIGGER trg_clientes_updated
    BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_fecha_actualizacion();

CREATE OR REPLACE TRIGGER trg_proveedores_updated
    BEFORE UPDATE ON proveedores
    FOR EACH ROW EXECUTE FUNCTION update_fecha_actualizacion();

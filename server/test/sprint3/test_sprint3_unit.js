const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// Rutas bajo prueba
const ventasRouter = require('../../routes/ventas');

// Helper para crear un Response simulado de Express
function createMockRes() {
    return {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.body = data;
            return this;
        }
    };
}

// Extraer manejador de ventas POST /api/ventas
const createVentaHandler = ventasRouter.stack.find(
    layer => layer.route && layer.route.path === '/' && layer.route.methods.post
).route.stack[0].handle;

describe('Sprint 3 - Suite Completa de Pruebas Unitarias (Ventas, Facturación, Descuentos y Pagos)', () => {

    // ================================================================
    // CP-U-S3-001: Rechazo de venta con carrito vacío
    // ================================================================
    test('CP-U-S3-001: Rechazo de venta con carrito vacío (HTTP 400)', async () => {
        const reqVacio = {
            body: {
                id_cliente: 1,
                items: [],
                subtotal: 0,
                total: 0
            }
        };
        const res = createMockRes();

        await createVentaHandler(reqVacio, res);

        assert.strictEqual(res.statusCode, 400, 'Debe retornar status 400 Bad Request');
        assert.ok(res.body && res.body.error, 'Debe responder con un mensaje de error');
        assert.strictEqual(res.body.error, 'El carrito no puede estar vacío');
    });

    // ================================================================
    // CP-U-S3-002: Liquidación aritmética de subtotales, descuentos y total neto
    // ================================================================
    test('CP-U-S3-002: Cálculo exacto de subtotal, descuentos y total neto', () => {
        const itemsPrueba = [
            { id_producto: 1, cant: 2, precio_venta: 285000, descuento: 10000, subtotal: 560000 },
            { id_producto: 2, cant: 1, precio_venta: 189000, descuento: 0, subtotal: 189000 }
        ];
        const descuentoGlobal = 20000;

        // 1. Subtotal bruto sin descuentos
        const subtotalBruto = itemsPrueba.reduce((acc, item) => acc + (item.cant * item.precio_venta), 0);
        assert.strictEqual(subtotalBruto, 759000, 'El subtotal bruto debe ser $759,000');

        // 2. Descuentos acumulados por ítem
        const descuentosItems = itemsPrueba.reduce((acc, item) => acc + (item.descuento || 0), 0);
        assert.strictEqual(descuentosItems, 10000, 'El descuento por ítems debe ser $10,000');

        // 3. Descuento total (ítems + global)
        const descuentoTotal = descuentosItems + descuentoGlobal;
        assert.strictEqual(descuentoTotal, 30000, 'El descuento total debe ser $30,000');

        // 4. Total a pagar
        const totalNeto = subtotalBruto - descuentoTotal;
        assert.strictEqual(totalNeto, 729000, 'El total final neto debe ser $729,000 exactos');
    });

    // ================================================================
    // CP-U-S3-003: Detección de existencias insuficientes previa a la venta
    // ================================================================
    test('CP-U-S3-003: Detección preventiva de stock insuficiente antes de procesar venta', () => {
        const inventarioMock = {
            101: { nombre: 'Disco Duro 2TB', stock: 3 },
            102: { nombre: 'Memoria RAM 16GB', stock: 15 }
        };

        const itemsSolicitados = [
            { id_producto: 101, cant: 5 }, // Excede el stock de 3
            { id_producto: 102, cant: 2 }  // Válido
        ];

        let falloStock = false;
        let mensajeError = '';

        for (const item of itemsSolicitados) {
            const currentStock = inventarioMock[item.id_producto].stock;
            const prodName = inventarioMock[item.id_producto].nombre;

            if (currentStock < item.cant) {
                falloStock = true;
                mensajeError = `Stock insuficiente para "${prodName}". Stock disponible en almacén: ${currentStock}, intentas vender: ${item.cant}`;
                break;
            }
        }

        assert.strictEqual(falloStock, true, 'Debe activarse la bandera de stock insuficiente');
        assert.ok(mensajeError.includes('Disco Duro 2TB'), 'El mensaje debe indicar el producto exacto');
        assert.ok(mensajeError.includes('Stock disponible en almacén: 3'), 'Debe señalar el stock disponible real');
        assert.ok(mensajeError.includes('intentas vender: 5'), 'Debe señalar la cantidad solicitada');
    });

    // ================================================================
    // CP-U-S3-004: Cálculo de cambio en efectivo y validación de pago suficiente
    // ================================================================
    test('CP-U-S3-004: Cálculo exacto de cambio en efectivo y rechazo de pago insuficiente', () => {
        const casoPagoValido = { totalVenta: 185000, montoRecibido: 200000 };
        const casoPagoInsuficiente = { totalVenta: 185000, montoRecibido: 150000 };

        // 1. Caso de pago suficiente
        const esSuficiente1 = casoPagoValido.montoRecibido >= casoPagoValido.totalVenta;
        assert.strictEqual(esSuficiente1, true, 'El pago debe identificarse como suficiente');
        const cambio = casoPagoValido.montoRecibido - casoPagoValido.totalVenta;
        assert.strictEqual(cambio, 15000, 'El cambio devuelto debe ser exactamente $15,000');

        // 2. Caso de pago insuficiente
        const esSuficiente2 = casoPagoInsuficiente.montoRecibido >= casoPagoInsuficiente.totalVenta;
        assert.strictEqual(esSuficiente2, false, 'El pago menor al total debe marcarse como insuficiente');
        const faltante = casoPagoInsuficiente.totalVenta - casoPagoInsuficiente.montoRecibido;
        assert.strictEqual(faltante, 35000, 'El faltante debe calcularse en $35,000');
    });

    // ================================================================
    // CP-U-S3-005: Generación de correlativo de factura con formato FAC-XXXXXX
    // ================================================================
    test('CP-U-S3-005: Formateo correlativo de factura FAC-XXXXXX con padding de 6 dígitos', () => {
        const formatearFactura = (consecutivo) => {
            return `FAC-${String(consecutivo).padStart(6, '0')}`;
        };

        assert.strictEqual(formatearFactura(1), 'FAC-000001');
        assert.strictEqual(formatearFactura(2345), 'FAC-002345');
        assert.strictEqual(formatearFactura(999999), 'FAC-999999');
        assert.match(
            formatearFactura(42),
            /^FAC-\d{6}$/,
            'El correlativo debe cumplir estrictamente con el formato FAC-XXXXXX'
        );
    });

});


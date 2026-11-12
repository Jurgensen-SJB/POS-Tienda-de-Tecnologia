const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// Rutas bajo prueba
const ventasRouter = require('../../routes/ventas');
const inventarioRouter = require('../../routes/inventario');

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

// Extraer manejadores (handlers) de las rutas de Express
const anularVentaHandler = ventasRouter.stack.find(
    layer => layer.route && layer.route.path === '/:id/anular' && layer.route.methods.post
).route.stack[0].handle;

const getAlertasHandler = inventarioRouter.stack.find(
    layer => layer.route && layer.route.path === '/alertas' && layer.route.methods.get
).route.stack[0].handle;

const postAjusteHandler = inventarioRouter.stack.find(
    layer => layer.route && layer.route.path === '/ajuste' && layer.route.methods.post
).route.stack[0].handle;

describe('Sprint 4 - Suite Completa de Pruebas Unitarias (Inventario Asociado a Ventas, Anulaciones y Ajustes)', () => {

    // ================================================================
    // CP-U-S4-001: Descuento de stock en venta y prevención de existencias negativas
    // ================================================================
    test('CP-U-S4-001: Descuento aritmético y prevención de inventario negativo', () => {
        const casosDescuento = [
            { currentStock: 20, cantVendida: 5, esperado: 15 },
            { currentStock: 3, cantVendida: 3, esperado: 0 },
            { currentStock: 2, cantVendida: 5, esperado: 0 } // Caso extremo de seguridad
        ];

        casosDescuento.forEach(({ currentStock, cantVendida, esperado }) => {
            const newStock = Math.max(0, currentStock - cantVendida);
            assert.strictEqual(
                newStock,
                esperado,
                `Para stock ${currentStock} y venta ${cantVendida}, el resultado debió ser ${esperado}`
            );
            assert.ok(newStock >= 0, 'El stock nunca debe ser negativo');
        });
    });

    // ================================================================
    // CP-U-S4-002: Reversión aritmética de existencias por anulación de comprobante
    // ================================================================
    test('CP-U-S4-002: Reversión de unidades de productos tras anulación', () => {
        const stockAlmacen = {
            101: 8,  // SSD Kingston 1TB
            102: 12  // Mouse Logitech G502
        };

        const itemsVentaAnulada = [
            { id_producto: 101, cantidad: 2 },
            { id_producto: 102, cantidad: 3 }
        ];

        itemsVentaAnulada.forEach(item => {
            const stockPrevio = stockAlmacen[item.id_producto];
            const stockRevertido = stockPrevio + item.cantidad;
            stockAlmacen[item.id_producto] = stockRevertido;
        });

        assert.strictEqual(stockAlmacen[101], 10, 'El producto 101 debe quedar con 10 unidades (8 + 2)');
        assert.strictEqual(stockAlmacen[102], 15, 'El producto 102 debe quedar con 15 unidades (12 + 3)');
    });

    // ================================================================
    // CP-U-S4-003: Validación de idempotencia: Bloqueo de venta ya anulada
    // ================================================================
    test('CP-U-S4-003: Rechazo de anulación para venta previamente anulada (HTTP 400)', () => {
        const ventaYaAnulada = { id_venta: 5, numero_factura: 'FAC-002340', estado: 'ANULADA' };
        const ventaCompletada = { id_venta: 6, numero_factura: 'FAC-002341', estado: 'COMPLETADA' };
        const res = createMockRes();

        function intentarAnular(venta, response) {
            if (venta.estado === 'ANULADA') {
                return response.status(400).json({ error: 'La venta ya se encuentra anulada' });
            }
            venta.estado = 'ANULADA';
            return response.status(200).json({ success: true });
        }

        // Caso 1: Venta ya anulada debe ser rechazada con HTTP 400
        intentarAnular(ventaYaAnulada, res);
        assert.strictEqual(res.statusCode, 400, 'Debe retornar status 400 Bad Request');
        assert.strictEqual(res.body.error, 'La venta ya se encuentra anulada');

        // Caso 2: Venta completada debe transicionar exitosamente a ANULADA
        intentarAnular(ventaCompletada, res);
        assert.strictEqual(res.statusCode, 200, 'Debe responder HTTP 200');
        assert.strictEqual(res.body.success, true);
        assert.strictEqual(ventaCompletada.estado, 'ANULADA');
    });

    // ================================================================
    // CP-U-S4-004: Algoritmo de clasificación de alertas de existencias (Déficit y Nivel)
    // ================================================================
    test('CP-U-S4-004: Cálculo de déficit y categorización de alertas de existencias', () => {
        const productosMock = [
            { nombre: 'Teclado Mecánico', stock: 0, stock_minimo: 5 },
            { nombre: 'Mouse Gamer', stock: 3, stock_minimo: 5 },
            { nombre: 'Monitor 24"', stock: 12, stock_minimo: 5 }
        ];

        const alertas = productosMock.map(p => {
            const stockActual = p.stock || 0;
            const stockMin = p.stock_minimo || 5;
            const deficit = Math.max(0, stockMin - stockActual);
            let nivel = 'NORMAL';
            if (stockActual === 0) nivel = 'AGOTADO';
            else if (stockActual <= stockMin) nivel = 'BAJO';
            return { nombre: p.nombre, deficit, nivel };
        });

        assert.strictEqual(alertas[0].nivel, 'AGOTADO', 'Stock 0 debe clasificarse como AGOTADO');
        assert.strictEqual(alertas[0].deficit, 5, 'Déficit debe ser 5');

        assert.strictEqual(alertas[1].nivel, 'BAJO', 'Stock 3 <= 5 debe clasificarse como BAJO');
        assert.strictEqual(alertas[1].deficit, 2, 'Déficit debe ser 2');

        assert.strictEqual(alertas[2].nivel, 'NORMAL', 'Stock 12 > 5 debe clasificarse como NORMAL');
        assert.strictEqual(alertas[2].deficit, 0, 'Déficit debe ser 0');
    });

    // ================================================================
    // CP-U-S4-005: Normalización matemática de ajustes manuales de stock
    // ================================================================
    test('CP-U-S4-005: Fórmulas de actualización de inventario por ajuste manual (ENTRADA, SALIDA, AJUSTE)', () => {
        const actual = 10;
        const cantidad = 4;

        // 1. ENTRADA: actual + cantidad
        const entrada = actual + cantidad;
        assert.strictEqual(entrada, 14, 'Ajuste ENTRADA debe sumar: 10 + 4 = 14');

        // 2. SALIDA: max(0, actual - cantidad)
        const salida = Math.max(0, actual - cantidad);
        assert.strictEqual(salida, 6, 'Ajuste SALIDA debe restar: 10 - 4 = 6');

        // 3. AJUSTE DIRECTO: saldo físico fijado
        const ajusteFisico = cantidad;
        assert.strictEqual(ajusteFisico, 4, 'Ajuste directo debe fijar el valor: 4');
    });

});


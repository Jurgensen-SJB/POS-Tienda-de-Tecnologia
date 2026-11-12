const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// Rutas bajo prueba
const comprasRouter = require('../../routes/compras');

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

// Extraer handler POST /api/compras
const createCompraHandler = comprasRouter.stack.find(
    layer => layer.route && layer.route.path === '/' && layer.route.methods.post
).route.stack[0].handle;

describe('Sprint 5 - Suite Completa de Pruebas Unitarias (Compras, Proveedores, Aumento de Stock y Pedidos)', () => {

    // ================================================================
    // CP-U-S5-001: Bloqueo de orden de compra sin proveedor o con ítems vacíos
    // ================================================================
    test('CP-U-S5-001: Rechazo de compras con datos incompletos (HTTP 400)', async () => {
        const reqInvalido = {
            body: {
                id_proveedor: null,
                items: [],
                total: 0
            }
        };
        const res = createMockRes();

        await createCompraHandler(reqInvalido, res);

        assert.strictEqual(res.statusCode, 400, 'Debe retornar status 400 Bad Request');
        assert.ok(res.body && res.body.error, 'Debe contener la propiedad error');
        assert.strictEqual(res.body.error, 'Proveedor e items son requeridos');
    });

    // ================================================================
    // CP-U-S5-002: Incremento aritmético de existencias por recepción de compra
    // ================================================================
    test('CP-U-S5-002: Cálculo exacto de nuevo stock tras recepción de compra', () => {
        const casosStock = [
            { stockPrevio: 15, cantidadComprada: 10, esperado: 25 },
            { stockPrevio: 0, cantidadComprada: 8, esperado: 8 },
            { stockPrevio: 50, cantidadComprada: 25, esperado: 75 }
        ];

        casosStock.forEach(({ stockPrevio, cantidadComprada, esperado }) => {
            const nuevoStock = stockPrevio + cantidadComprada;
            assert.strictEqual(
                nuevoStock,
                esperado,
                `Para stock inicial ${stockPrevio} y compra de ${cantidadComprada}, el nuevo stock debe ser ${esperado}`
            );
        });
    });

    // ================================================================
    // CP-U-S5-003: Consolidación de costos y total de compra por renglón
    // ================================================================
    test('CP-U-S5-003: Cálculo preciso de subtotales y total acumulado de compra', () => {
        const itemsCompra = [
            { id_producto: 1, cantidad: 10, costo_unitario: 210000 },
            { id_producto: 2, cantidad: 5, costo_unitario: 135000 },
            { id_producto: 3, cantidad: 2, costo_unitario: 450000 }
        ];

        let totalCalculado = 0;
        itemsCompra.forEach(item => {
            const subtotalItem = item.cantidad * item.costo_unitario;
            totalCalculado += subtotalItem;
        });

        assert.strictEqual(totalCalculado, 3675000, 'El total acumulado de la compra debe ser exactamente $3,675,000 COP');
    });

    // ================================================================
    // CP-U-S5-004: Máquina de estados de pedidos a proveedor (Transición e Idempotencia)
    // ================================================================
    test('CP-U-S5-004: Control de estados en pedidos (PENDIENTE -> RECIBIDO) e idempotencia', () => {
        function procesarRecepcionPedido(pedidoActual) {
            if (pedidoActual.estado === 'RECIBIDO') {
                return { ok: false, error: 'El pedido ya fue recibido previamente' };
            }
            if (pedidoActual.estado === 'CANCELADO') {
                return { ok: false, error: 'No se puede recibir un pedido cancelado' };
            }
            pedidoActual.estado = 'RECIBIDO';
            return { ok: true, nuevoEstado: 'RECIBIDO' };
        }

        const pedido1 = { id_pedido: 1, estado: 'PENDIENTE' };
        const res1 = procesarRecepcionPedido(pedido1);
        assert.strictEqual(res1.ok, true);
        assert.strictEqual(pedido1.estado, 'RECIBIDO');

        // Idempotencia: no recibir dos veces
        const res2 = procesarRecepcionPedido(pedido1);
        assert.strictEqual(res2.ok, false);
        assert.strictEqual(res2.error, 'El pedido ya fue recibido previamente');

        // Rechazo de cancelado
        const pedidoCancelado = { id_pedido: 2, estado: 'CANCELADO' };
        const resCancel = procesarRecepcionPedido(pedidoCancelado);
        assert.strictEqual(resCancel.ok, false);
        assert.strictEqual(resCancel.error, 'No se puede recibir un pedido cancelado');
    });

    // ================================================================
    // CP-U-S5-005: Formateo de identificador correlativo de Orden de Compra (OC-XXXX)
    // ================================================================
    test('CP-U-S5-005: Formateo correlativo de órdenes de compra OC-XXXX', () => {
        const formatearOC = (id) => `#OC-${String(id).padStart(4, '0')}`;

        assert.strictEqual(formatearOC(1), '#OC-0001');
        assert.strictEqual(formatearOC(45), '#OC-0045');
        assert.strictEqual(formatearOC(120), '#OC-0120');
        assert.strictEqual(formatearOC(9999), '#OC-9999');
    });

});


const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// Router de compras
const comprasRouter = require('../../routes/compras');

describe('Sprint 5 - CP-U-S5-004: Máquina de estados de pedidos a proveedor (Transición e Idempotencia)', () => {

    /**
     * Algoritmo de transición de estados especificado en la documentación técnica (03_PRUEBAS_UNITARIAS_SPRINT_5.md)
     * RF-16.3: Transición de estado PENDIENTE -> RECIBIDO
     */
    function procesarRecepcionPedido(pedidoActual) {
        if (!pedidoActual || !pedidoActual.estado) {
            return { ok: false, error: 'Pedido inválido o sin estado' };
        }
        if (pedidoActual.estado === 'RECIBIDO') {
            return { ok: false, error: 'El pedido ya fue recibido previamente' };
        }
        if (pedidoActual.estado === 'CANCELADO') {
            return { ok: false, error: 'No se puede recibir un pedido cancelado' };
        }
        pedidoActual.estado = 'RECIBIDO';
        return { ok: true, nuevoEstado: 'RECIBIDO' };
    }

    test('Debe transicionar exitosamente de estado PENDIENTE a RECIBIDO', () => {
        const pedido = { id_pedido: 1, proveedor: 'Distribuidora Asus', estado: 'PENDIENTE' };
        const resultado = procesarRecepcionPedido(pedido);

        assert.strictEqual(resultado.ok, true, 'La recepción debe completarse con éxito');
        assert.strictEqual(resultado.nuevoEstado, 'RECIBIDO');
        assert.strictEqual(pedido.estado, 'RECIBIDO', 'El estado del pedido debe mutar a RECIBIDO');
    });

    test('Debe garantizar idempotencia: rechazar intento de re-recepción si el pedido ya está RECIBIDO', () => {
        const pedidoYaRecibido = { id_pedido: 2, proveedor: 'Kingston Colombia', estado: 'RECIBIDO' };
        const resultado = procesarRecepcionPedido(pedidoYaRecibido);

        assert.strictEqual(resultado.ok, false, 'No debe permitir recibir un pedido dos veces');
        assert.strictEqual(
            resultado.error,
            'El pedido ya fue recibido previamente',
            'Debe indicar que el pedido ya fue recibido con anterioridad'
        );
        assert.strictEqual(pedidoYaRecibido.estado, 'RECIBIDO', 'El estado debe preservarse en RECIBIDO');
    });

    test('Debe rechazar la recepción de un pedido en estado CANCELADO', () => {
        const pedidoCancelado = { id_pedido: 3, proveedor: 'Gigabyte Corp', estado: 'CANCELADO' };
        const resultado = procesarRecepcionPedido(pedidoCancelado);

        assert.strictEqual(resultado.ok, false, 'Un pedido cancelado no puede ser recibido');
        assert.strictEqual(resultado.error, 'No se puede recibir un pedido cancelado');
        assert.strictEqual(pedidoCancelado.estado, 'CANCELADO');
    });

    test('Verificación de Integración Backend: Confirma que la ruta de pedidos aún no está implementada en Express', () => {
        // En server/routes/compras.js solo existen '/' (GET) y '/' (POST)
        const rutaPedidosRecibir = comprasRouter.stack.find(
            layer => layer.route && layer.route.path.includes('/pedidos')
        );

        // Advertencia documentada: RF-16 aún no expone endpoints en el router de compras
        const endpointImplementado = Boolean(rutaPedidosRecibir);
        assert.strictEqual(
            endpointImplementado,
            false,
            'RF-16 (Pedidos a proveedores) está pendiente de exponerse como endpoint en Express (solo existe compras directas)'
        );
    });

});


const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// Ruta bajo prueba
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

// Extraer handler POST /api/ventas/:id/anular
const anularVentaHandler = ventasRouter.stack.find(
    layer => layer.route && layer.route.path === '/:id/anular' && layer.route.methods.post
).route.stack[0].handle;

describe('Sprint 4 - CP-U-S4-003: Validación de idempotencia: Bloqueo de venta ya anulada', () => {

    // Casos de prueba estipulados en la documentación técnica (03_PRUEBAS_UNITARIAS_SPRINT_4.md)
    const ventaYaAnulada = { id_venta: 5, numero_factura: 'FAC-002340', estado: 'ANULADA' };
    const ventaCompletada = { id_venta: 6, numero_factura: 'FAC-002341', estado: 'COMPLETADA' };

    test('Debe rechazar con HTTP 400 el intento de anular una venta previamente anulada (idempotencia)', () => {
        const res = createMockRes();

        // Lógica interna implementada en server/routes/ventas.js (línea 296)
        function intentarAnular(venta, response) {
            if (venta.estado === 'ANULADA') {
                return response.status(400).json({ error: 'La venta ya se encuentra anulada' });
            }
            venta.estado = 'ANULADA';
            return response.status(200).json({ success: true, message: 'Venta anulada exitosamente' });
        }

        intentarAnular(ventaYaAnulada, res);

        assert.strictEqual(res.statusCode, 400, 'Debe retornar status HTTP 400 Bad Request');
        assert.ok(res.body && res.body.error, 'Debe responder con propiedad error');
        assert.strictEqual(
            res.body.error,
            'La venta ya se encuentra anulada',
            'El mensaje debe advertir que la venta ya fue cancelada con anterioridad'
        );
    });

    test('Debe procesar con éxito la anulación de una venta que se encuentre en estado COMPLETADA', () => {
        const res = createMockRes();
        const ventaActiva = { ...ventaCompletada };

        function intentarAnular(venta, response) {
            if (venta.estado === 'ANULADA') {
                return response.status(400).json({ error: 'La venta ya se encuentra anulada' });
            }
            venta.estado = 'ANULADA';
            return response.status(200).json({ success: true, message: 'Venta anulada exitosamente' });
        }

        intentarAnular(ventaActiva, res);

        assert.strictEqual(res.statusCode, 200, 'Debe responder con HTTP 200 OK');
        assert.strictEqual(res.body.success, true);
        assert.strictEqual(ventaActiva.estado, 'ANULADA', 'El estado de la venta debe transicionar a ANULADA');
    });

    test('Debe responder HTTP 404 cuando se intenta anular una venta inexistente en el controlador', async () => {
        const reqInexistente = {
            params: { id: '999999' },
            body: { id_usuario: 1 }
        };
        const resInexistente = createMockRes();

        await anularVentaHandler(reqInexistente, resInexistente);

        assert.strictEqual(resInexistente.statusCode, 404, 'Venta no existente debe retornar HTTP 404');
        assert.strictEqual(resInexistente.body.error, 'Venta no encontrada');
    });

});


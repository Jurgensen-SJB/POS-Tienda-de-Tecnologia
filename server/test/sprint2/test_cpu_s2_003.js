const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// Ruta bajo prueba
const clientesRouter = require('../../routes/clientes');

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

// Extraer handler PATCH /api/clientes/:id/estado
const patchEstadoHandler = clientesRouter.stack.find(
    layer => layer.route && layer.route.path === '/:id/estado' && layer.route.methods.patch
).route.stack[0].handle;

describe('Sprint 2 - CP-U-S2-003: Validación de estados permitidos en clientes', () => {

    test('Debe rechazar estados no permitidos (ELIMINADO, SUSPENDIDO) con HTTP 400', async () => {
        const estadosInvalidos = ['ELIMINADO', 'SUSPENDIDO', 'BLOQUEADO', ''];

        for (const estadoInvalido of estadosInvalidos) {
            const req = {
                params: { id: '1' },
                body: { estado: estadoInvalido }
            };
            const res = createMockRes();

            await patchEstadoHandler(req, res);

            assert.strictEqual(
                res.statusCode,
                400,
                `El estado '${estadoInvalido}' debió ser rechazado con 400`
            );
            assert.ok(res.body && res.body.error, 'Debe retornar mensaje de error');
            assert.match(res.body.error, /Estado debe ser ACTIVO o INACTIVO/i);
        }
    });

    test('Debe permitir y normalizar a mayúsculas estados válidos (ACTIVO, INACTIVO, minúsculas)', async () => {
        // Prueba con 'activo' en minúsculas
        const req = {
            params: { id: '1' },
            body: { estado: 'activo' }
        };
        const res = createMockRes();

        await patchEstadoHandler(req, res);

        assert.strictEqual(res.statusCode, 200, 'Debe responder HTTP 200 OK');
        assert.strictEqual(res.body.success, true);
        assert.strictEqual(res.body.cliente.estado, 'ACTIVO', 'Debe normalizarse a ACTIVO en mayúsculas');
    });

    test('Debe actualizar correctamente el estado a INACTIVO', async () => {
        const req = {
            params: { id: '1' },
            body: { estado: 'INACTIVO' }
        };
        const res = createMockRes();

        await patchEstadoHandler(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body.success, true);
        assert.strictEqual(res.body.cliente.estado, 'INACTIVO');
    });

    test('Evaluación de la matriz unitaria de criterios de aceptación de estados', () => {
        const allowed = ['ACTIVO', 'INACTIVO'];
        const estadosDePrueba = [
            { estado: 'ELIMINADO', esperadoValido: false },
            { estado: 'SUSPENDIDO', esperadoValido: false },
            { estado: 'ACTIVO', esperadoValido: true },
            { estado: 'INACTIVO', esperadoValido: true },
            { estado: 'activo', esperadoValido: true } // Debe normalizarse a uppercase
        ];

        estadosDePrueba.forEach(({ estado, esperadoValido }) => {
            const isValid = Boolean(estado && allowed.includes(estado.toUpperCase()));
            assert.strictEqual(
                isValid,
                esperadoValido,
                `La validación para el estado '${estado}' falló`
            );
        });
    });

});

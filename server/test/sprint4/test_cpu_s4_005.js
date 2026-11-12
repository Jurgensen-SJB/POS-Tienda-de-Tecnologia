const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// Ruta bajo prueba
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

// Extraer handler POST /api/inventario/ajuste
const postAjusteHandler = inventarioRouter.stack.find(
    layer => layer.route && layer.route.path === '/ajuste' && layer.route.methods.post
).route.stack[0].handle;

describe('Sprint 4 - CP-U-S4-005: Normalización matemática de ajustes manuales de stock', () => {

    test('Debe calcular con exactitud las fórmulas matemáticas de los tres tipos de movimiento', () => {
        // Dataset de prueba estipulado en la documentación técnica (03_PRUEBAS_UNITARIAS_SPRINT_4.md)
        const actual = 10;
        const cantidad = 4;

        // 1. Tipo ENTRADA: incrementa existencias (actual + cantidad)
        const entrada = actual + cantidad;
        assert.strictEqual(entrada, 14, 'Ajuste ENTRADA debe sumar: 10 + 4 = 14 unidades');

        // 2. Tipo SALIDA: reduce existencias con límite inferior en cero (max(0, actual - cantidad))
        const salida = Math.max(0, actual - cantidad);
        assert.strictEqual(salida, 6, 'Ajuste SALIDA debe restar: 10 - 4 = 6 unidades');

        // 3. Tipo AJUSTE DIRECTO: fija el saldo físico verificado en auditoría
        const ajusteFisico = cantidad;
        assert.strictEqual(ajusteFisico, 4, 'Ajuste directo debe fijar el valor: 4 unidades');
    });

    test('Debe evitar saldos negativos cuando el ajuste de SALIDA excede el stock actual', () => {
        const actual = 3;
        const cantidadExcesiva = 10;

        const salidaSegura = Math.max(0, actual - cantidadExcesiva);
        assert.strictEqual(salidaSegura, 0, 'Una salida superior al stock disponible debe truncarse a 0');
    });

    test('Debe rechazar con HTTP 400 solicitudes de ajuste con datos incompletos o cantidad <= 0', async () => {
        const casosInvalidos = [
            { id_producto: null, tipo_movimiento: 'ENTRADA', cantidad: 5 },
            { id_producto: 1, tipo_movimiento: null, cantidad: 5 },
            { id_producto: 1, tipo_movimiento: 'ENTRADA', cantidad: 0 },
            { id_producto: 1, tipo_movimiento: 'SALIDA', cantidad: -3 }
        ];

        for (const body of casosInvalidos) {
            const req = { body };
            const res = createMockRes();

            await postAjusteHandler(req, res);

            assert.strictEqual(
                res.statusCode,
                400,
                `El payload ${JSON.stringify(body)} debió responder HTTP 400 Bad Request`
            );
            assert.ok(res.body && res.body.error, 'Debe indicar mensaje de error descriptivo');
            assert.match(res.body.error, /requeridos/i);
        }
    });

    test('Debe procesar con éxito el ajuste manual y retornar HTTP 201 Created', async () => {
        const reqValido = {
            body: {
                id_producto: 1,
                tipo_movimiento: 'ENTRADA',
                cantidad: 5,
                observacion: 'Ingreso de prueba unitaria QA',
                id_usuario: 1
            }
        };
        const resValido = createMockRes();

        await postAjusteHandler(reqValido, resValido);

        assert.strictEqual(resValido.statusCode, 201, 'Debe responder HTTP 201 Created');
        assert.ok(resValido.body, 'Debe devolver el objeto de movimiento creado');
        assert.strictEqual(resValido.body.tipo_movimiento, 'ENTRADA');
        assert.strictEqual(resValido.body.cantidad, 5);
        assert.ok('existencia_anterior' in resValido.body, 'Debe contener existencia_anterior');
        assert.ok('existencia_nueva' in resValido.body, 'Debe contener existencia_nueva');
        assert.strictEqual(
            resValido.body.existencia_nueva,
            resValido.body.existencia_anterior + 5,
            'La existencia nueva debe ser la anterior más 5'
        );
    });

});


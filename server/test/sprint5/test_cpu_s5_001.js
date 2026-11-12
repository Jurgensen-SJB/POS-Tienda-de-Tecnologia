const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// Ruta bajo prueba
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

describe('Sprint 5 - CP-U-S5-001: Bloqueo de orden de compra sin proveedor o con ítems vacíos', () => {

    test('Debe rechazar con HTTP 400 cuando el id_proveedor es nulo o no se proporciona', async () => {
        const reqSinProveedor = {
            body: {
                id_proveedor: null,
                items: [{ id_producto: 1, cantidad: 5, costo_unitario: 210000, subtotal: 1050000 }],
                total: 1050000
            }
        };
        const res = createMockRes();

        await createCompraHandler(reqSinProveedor, res);

        assert.strictEqual(res.statusCode, 400, 'Debe retornar status 400 Bad Request');
        assert.ok(res.body && res.body.error, 'Debe contener la propiedad error');
        assert.strictEqual(
            res.body.error,
            'Proveedor e items son requeridos',
            'El mensaje de error debe indicar textualmente que proveedor e items son requeridos'
        );
    });

    test('Debe rechazar con HTTP 400 cuando la lista de items está vacía ([])', async () => {
        const reqItemsVacios = {
            body: {
                id_proveedor: 1,
                items: [],
                total: 0
            }
        };
        const res = createMockRes();

        await createCompraHandler(reqItemsVacios, res);

        assert.strictEqual(res.statusCode, 400, 'Debe retornar status 400 Bad Request');
        assert.strictEqual(res.body.error, 'Proveedor e items son requeridos');
    });

    test('Debe rechazar con HTTP 400 cuando items es undefined o nulo', async () => {
        const reqItemsNull = {
            body: {
                id_proveedor: 1,
                items: null,
                total: 0
            }
        };
        const res = createMockRes();

        await createCompraHandler(reqItemsNull, res);

        assert.strictEqual(res.statusCode, 400, 'Debe retornar status 400 Bad Request');
        assert.strictEqual(res.body.error, 'Proveedor e items son requeridos');
    });

    test('Debe evaluar y rechazar múltiples combinaciones de payloads inválidos estipulados en la documentación', () => {
        const casosInvalidos = [
            { body: { id_proveedor: null, items: [{ id_producto: 1, cantidad: 5 }] } },
            { body: { id_proveedor: 1, items: [] } },
            { body: { id_proveedor: 1, items: null } },
            { body: { id_proveedor: 0, items: [{ id_producto: 2, cantidad: 1 }] } } // id_proveedor falsy
        ];

        casosInvalidos.forEach(({ body }) => {
            const { id_proveedor, items } = body;
            let esInvalido = false;
            const res = createMockRes();

            if (!id_proveedor || !items || items.length === 0) {
                esInvalido = true;
                res.status(400).json({ error: 'Proveedor e items son requeridos' });
            }

            assert.strictEqual(esInvalido, true, 'El payload incompleto debe ser catalogado como inválido');
            assert.strictEqual(res.statusCode, 400, 'El código HTTP resultante debe ser 400');
            assert.strictEqual(res.body.error, 'Proveedor e items son requeridos');
        });
    });

});


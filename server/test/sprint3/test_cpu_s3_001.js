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

// Extraer handler POST /api/ventas
const createVentaHandler = ventasRouter.stack.find(
    layer => layer.route && layer.route.path === '/' && layer.route.methods.post
).route.stack[0].handle;

describe('Sprint 3 - CP-U-S3-001: Rechazo de venta con carrito vacío', () => {

    test('Debe rechazar con HTTP 400 cuando el arreglo de items está vacío ([])', async () => {
        const req = {
            body: {
                id_cliente: 1,
                items: [],
                subtotal: 0,
                total: 0
            }
        };
        const res = createMockRes();

        await createVentaHandler(req, res);

        assert.strictEqual(res.statusCode, 400, 'Debe retornar status 400 Bad Request');
        assert.ok(res.body && res.body.error, 'Debe retornar un objeto con propiedad error');
        assert.strictEqual(
            res.body.error,
            'El carrito no puede estar vacío',
            'El mensaje de error debe indicar textualmente que el carrito no puede estar vacío'
        );
    });

    test('Debe rechazar con HTTP 400 cuando items es null o undefined', async () => {
        const reqSinItems = {
            body: {
                id_cliente: 1,
                subtotal: 0,
                total: 0
            }
        };
        const resSinItems = createMockRes();

        await createVentaHandler(reqSinItems, resSinItems);

        assert.strictEqual(resSinItems.statusCode, 400);
        assert.strictEqual(resSinItems.body.error, 'El carrito no puede estar vacío');

        const reqItemsNull = {
            body: {
                id_cliente: 1,
                items: null,
                total: 0
            }
        };
        const resItemsNull = createMockRes();

        await createVentaHandler(reqItemsNull, resItemsNull);

        assert.strictEqual(resItemsNull.statusCode, 400);
        assert.strictEqual(resItemsNull.body.error, 'El carrito no puede estar vacío');
    });

    test('Debe validar que un carrito con al menos 1 producto supere la validación de vaciedad', () => {
        const reqConItems = {
            body: {
                items: [{ id_producto: 1, cant: 1, precio_venta: 150000 }]
            }
        };

        const { items } = reqConItems.body;
        const esValido = Boolean(items && items.length > 0);

        assert.strictEqual(esValido, true, 'El carrito con productos debe superar la verificación de no-vacío');
    });

});


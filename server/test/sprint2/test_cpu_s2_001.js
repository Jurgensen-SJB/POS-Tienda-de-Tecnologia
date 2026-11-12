const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// Ruta bajo prueba
const productosRouter = require('../../routes/productos');

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

// Extraer handler POST /api/productos
const createProductoHandler = productosRouter.stack.find(
    layer => layer.route && layer.route.path === '/' && layer.route.methods.post
).route.stack[0].handle;

describe('Sprint 2 - CP-U-S2-001: Validación de campos obligatorios al crear producto', () => {

    test('Debe rechazar con HTTP 400 cuando faltan código, precio y categoría', async () => {
        // Mock de Request con campos faltantes según especificación
        const req = {
            body: {
                nombre: 'Teclado Mecánico RGB',
                // Faltan codigo, precio_venta e id_categoria
                descripcion: 'Switches azules'
            }
        };
        const res = createMockRes();

        await createProductoHandler(req, res);

        assert.strictEqual(res.statusCode, 400, 'El status HTTP debe ser 400 Bad Request');
        assert.ok(res.body && res.body.error, 'Debe retornar un objeto con propiedad error');
        assert.match(
            res.body.error,
            /Faltan campos obligatorios/i,
            'El mensaje debe indicar campos obligatorios (código, nombre, precio, categoría)'
        );
    });

    test('Debe rechazar con HTTP 400 si falta el código SKU', async () => {
        const req = {
            body: {
                nombre: 'Mouse Gamer',
                precio_venta: 85000,
                id_categoria: 4
            }
        };
        const res = createMockRes();

        await createProductoHandler(req, res);

        assert.strictEqual(res.statusCode, 400);
        assert.match(res.body.error, /obligatorios/i);
    });

    test('Debe rechazar con HTTP 400 si falta el nombre del producto', async () => {
        const req = {
            body: {
                codigo: 'MOU-GAM-001',
                precio_venta: 85000,
                id_categoria: 4
            }
        };
        const res = createMockRes();

        await createProductoHandler(req, res);

        assert.strictEqual(res.statusCode, 400);
        assert.match(res.body.error, /obligatorios/i);
    });

    test('Debe rechazar con HTTP 400 si falta el precio de venta', async () => {
        const req = {
            body: {
                codigo: 'MOU-GAM-001',
                nombre: 'Mouse Gamer',
                id_categoria: 4
            }
        };
        const res = createMockRes();

        await createProductoHandler(req, res);

        assert.strictEqual(res.statusCode, 400);
        assert.match(res.body.error, /obligatorios/i);
    });

    test('Debe rechazar con HTTP 400 si falta la categoría', async () => {
        const req = {
            body: {
                codigo: 'MOU-GAM-001',
                nombre: 'Mouse Gamer',
                precio_venta: 85000
            }
        };
        const res = createMockRes();

        await createProductoHandler(req, res);

        assert.strictEqual(res.statusCode, 400);
        assert.match(res.body.error, /obligatorios/i);
    });

});

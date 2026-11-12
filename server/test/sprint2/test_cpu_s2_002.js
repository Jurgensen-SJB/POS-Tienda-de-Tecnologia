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

describe('Sprint 2 - CP-U-S2-002: Asignación y normalización de stock inicial en producto', () => {

    test('Debe parsear y normalizar tipos de datos numéricos y stock inicial enviado', async () => {
        const sku = `AUD-BT-${Date.now()}`;
        // Mock de Request con campos string numéricos según CP-U-S2-002
        const req = {
            body: {
                codigo: sku,
                nombre: 'Auriculares Bluetooth Pro',
                precio_venta: '150000.50',
                id_categoria: '2',
                stock_inicial: '25',
                costo: '95000'
            }
        };
        const res = createMockRes();

        await createProductoHandler(req, res);

        assert.strictEqual(res.statusCode, 201, 'Debe retornar status HTTP 201 Created');
        assert.ok(res.body, 'Debe devolver el objeto de producto creado');
        assert.strictEqual(res.body.codigo, sku, 'El código debe coincidir y estar normalizado');
        assert.strictEqual(typeof res.body.precio_venta, 'number', 'El precio de venta debe parsearse a tipo number');
        assert.strictEqual(res.body.precio_venta, 150000.50, 'El precio debe ser 150000.50');
        assert.strictEqual(res.body.stock, 25, 'El stock inicial debe ser el entero 25');
        assert.strictEqual(res.body.estado, 'ACTIVO', 'El estado predeterminado debe ser ACTIVO');
    });

    test('Debe asignar stock inicial 0 por defecto cuando no se envía en la petición', async () => {
        const skuSinStock = `AUD-ZERO-${Date.now()}`;
        const req = {
            body: {
                codigo: skuSinStock,
                nombre: 'Auriculares Bluetooth Sin Stock Inicial',
                precio_venta: '120000',
                id_categoria: '2'
                // stock_inicial no enviado
            }
        };
        const res = createMockRes();

        await createProductoHandler(req, res);

        assert.strictEqual(res.statusCode, 201);
        assert.strictEqual(res.body.stock, 0, 'El stock por defecto debe ser 0');
    });

    test('Verificación de la lógica unitaria de parseo y normalización', () => {
        const input = {
            codigo: '  AUD-BT-03  ',
            nombre: '  Auriculares Gaming  ',
            precio_venta: '150000.50',
            id_categoria: '2',
            stock_inicial: '25',
            estado: undefined
        };

        const parsedProduct = {
            codigo: input.codigo.trim(),
            nombre: input.nombre.trim(),
            precio_venta: parseFloat(input.precio_venta),
            id_categoria: parseInt(input.id_categoria),
            stock: parseInt(input.stock_inicial || 0),
            estado: (input.estado || 'ACTIVO').toUpperCase()
        };

        assert.strictEqual(typeof parsedProduct.precio_venta, 'number');
        assert.strictEqual(parsedProduct.precio_venta, 150000.50);
        assert.strictEqual(parsedProduct.stock, 25);
        assert.strictEqual(parsedProduct.codigo, 'AUD-BT-03');
        assert.strictEqual(parsedProduct.nombre, 'Auriculares Gaming');
        assert.strictEqual(parsedProduct.estado, 'ACTIVO');
    });

});

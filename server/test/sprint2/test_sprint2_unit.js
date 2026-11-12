const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// Rutas bajo prueba
const productosRouter = require('../../routes/productos');
const clientesRouter = require('../../routes/clientes');
const categoriasRouter = require('../../routes/categorias');
const proveedoresRouter = require('../../routes/proveedores');

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
const createProductoHandler = productosRouter.stack.find(
    layer => layer.route && layer.route.path === '/' && layer.route.methods.post
).route.stack[0].handle;

const patchClienteEstadoHandler = clientesRouter.stack.find(
    layer => layer.route && layer.route.path === '/:id/estado' && layer.route.methods.patch
).route.stack[0].handle;

const createCategoriaHandler = categoriasRouter.stack.find(
    layer => layer.route && layer.route.path === '/' && layer.route.methods.post
).route.stack[0].handle;

const getProveedoresHandler = proveedoresRouter.stack.find(
    layer => layer.route && layer.route.path === '/' && layer.route.methods.get
).route.stack[0].handle;

describe('Sprint 2 - Suite Completa de Pruebas Unitarias (Catálogo: Productos, Clientes, Categorías y Proveedores)', () => {

    // ================================================================
    // CP-U-S2-001: Validación de campos obligatorios al crear producto
    // ================================================================
    test('CP-U-S2-001: Rechazo de producto sin campos obligatorios (HTTP 400)', async () => {
        const req = {
            body: {
                nombre: 'Teclado Mecánico RGB',
                descripcion: 'Switches azules'
                // Faltan: codigo, precio_venta, id_categoria
            }
        };
        const res = createMockRes();

        await createProductoHandler(req, res);

        assert.strictEqual(res.statusCode, 400, 'El status HTTP debe ser 400 Bad Request');
        assert.ok(res.body && res.body.error, 'Debe retornar objeto con mensaje de error');
        assert.match(res.body.error, /Faltan campos obligatorios/i);
    });

    // ================================================================
    // CP-U-S2-002: Asignación y normalización de stock inicial en producto
    // ================================================================
    test('CP-U-S2-002: Parseo y normalización numérica de producto y stock inicial', async () => {
        const sku = `AUD-BT-${Date.now()}`;
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

        assert.strictEqual(res.statusCode, 201, 'Debe retornar status HTTP 201');
        assert.strictEqual(typeof res.body.precio_venta, 'number', 'El precio debe ser de tipo numérico');
        assert.strictEqual(res.body.precio_venta, 150000.50, 'El precio debe coincidir con 150000.50');
        assert.strictEqual(res.body.stock, 25, 'El stock asignado debe ser 25');
        assert.strictEqual(res.body.estado, 'ACTIVO', 'El estado predeterminado debe ser ACTIVO');
    });

    // ================================================================
    // CP-U-S2-003: Validación de estados permitidos en clientes
    // ================================================================
    test('CP-U-S2-003: Validación estricta y normalización de estados en clientes', async () => {
        // 1. Estado inválido debe responder 400
        const reqInvalido = {
            params: { id: '1' },
            body: { estado: 'ELIMINADO' }
        };
        const resInvalido = createMockRes();
        await patchClienteEstadoHandler(reqInvalido, resInvalido);
        assert.strictEqual(resInvalido.statusCode, 400, 'Estado no permitido debe retornar 400');
        assert.match(resInvalido.body.error, /Estado debe ser ACTIVO o INACTIVO/i);

        // 2. Estado válido en minúsculas se normaliza a ACTIVO
        const reqValido = {
            params: { id: '1' },
            body: { estado: 'activo' }
        };
        const resValido = createMockRes();
        await patchClienteEstadoHandler(reqValido, resValido);
        assert.strictEqual(resValido.statusCode, 200, 'Estado válido debe responder 200');
        assert.strictEqual(resValido.body.cliente.estado, 'ACTIVO');
    });

    // ================================================================
    // CP-U-S2-004: Sanitización y obligatoriedad del nombre de categoría
    // ================================================================
    test('CP-U-S2-004: Sanitización trim() y rechazo de nombres vacíos en categoría', async () => {
        // 1. Nombre con espacios en blanco solamente debe ser rechazado
        const reqVacio = {
            body: { nombre: '     ' }
        };
        const resVacio = createMockRes();
        await createCategoriaHandler(reqVacio, resVacio);
        assert.strictEqual(resVacio.statusCode, 400);
        assert.match(resVacio.body.error, /El nombre de la categoría es requerido/i);

        // 2. Nombre con espacios a los extremos debe ser sanitizado con trim()
        const reqSanitizado = {
            body: { nombre: '  Monitores y Pantallas  ' }
        };
        const resSanitizado = createMockRes();
        await createCategoriaHandler(reqSanitizado, resSanitizado);
        assert.strictEqual(resSanitizado.statusCode, 201);
        assert.strictEqual(resSanitizado.body.nombre, 'Monitores y Pantallas');
    });

    // ================================================================
    // CP-U-S2-005: Algoritmo de filtrado in-memory de proveedores (Fallback)
    // ================================================================
    test('CP-U-S2-005: Filtrado multicriterio de proveedores en búsqueda y estado', async () => {
        const req = {
            query: { q: 'TechDistributor', estado: 'ACTIVO' }
        };
        const res = createMockRes();

        await getProveedoresHandler(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert.ok(Array.isArray(res.body));
        assert.ok(res.body.length > 0, 'Debe devolver proveedores encontrados');
        assert.ok(res.body.every(p => p.estado === 'ACTIVO'));
        assert.ok(res.body.some(p => p.nombre.toLowerCase().includes('techdistributor')));
    });

});

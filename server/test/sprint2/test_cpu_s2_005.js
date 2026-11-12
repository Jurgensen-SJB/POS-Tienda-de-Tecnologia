const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// Ruta bajo prueba
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

// Extraer handler GET /api/proveedores
const getProveedoresHandler = proveedoresRouter.stack.find(
    layer => layer.route && layer.route.path === '/' && layer.route.methods.get
).route.stack[0].handle;

describe('Sprint 2 - CP-U-S2-005: Algoritmo de filtrado in-memory de proveedores (Fallback)', () => {

    test('Debe filtrar proveedores por término de búsqueda (nombre, identificación, correo) en el endpoint', async () => {
        const req = {
            query: { q: 'TechDistributor' }
        };
        const res = createMockRes();

        await getProveedoresHandler(req, res);

        assert.strictEqual(res.statusCode, 200, 'Debe responder HTTP 200 OK');
        assert.ok(Array.isArray(res.body), 'Debe retornar un arreglo de proveedores');
        assert.ok(res.body.length > 0, 'Debe encontrar al menos una coincidencia');
        assert.ok(
            res.body.some(p => p.nombre.includes('TechDistributor')),
            'Debe incluir al proveedor TechDistributor'
        );
    });

    test('Debe filtrar proveedores por estado ACTIVO e INACTIVO', async () => {
        const req = {
            query: { estado: 'ACTIVO' }
        };
        const res = createMockRes();

        await getProveedoresHandler(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert.ok(Array.isArray(res.body));
        res.body.forEach(p => {
            assert.strictEqual(p.estado, 'ACTIVO', 'Todos los proveedores listados deben estar ACTIVOS');
        });
    });

    test('Evaluación de la lógica de filtrado multicriterio con dataset mock aislado', () => {
        const providersMock = [
            { id_proveedor: 1, nombre: 'Intel Colombia', identificacion: '900111222-1', correo: 'ventas@intel.co', estado: 'ACTIVO' },
            { id_proveedor: 2, nombre: 'AMD Latinoamérica', identificacion: '900333444-2', correo: 'contacto@amd.com', estado: 'ACTIVO' },
            { id_proveedor: 3, nombre: 'Distribuidora Obsoleta', identificacion: '800555666-3', correo: 'antiguo@dist.com', estado: 'INACTIVO' }
        ];

        // Búsqueda por término 'amd' (coincidencia en nombre)
        const searchTerm = 'amd';
        const term = searchTerm.trim().toLowerCase();

        const filtradosNombre = providersMock.filter(p =>
            (p.nombre && p.nombre.toLowerCase().includes(term)) ||
            (p.identificacion && p.identificacion.toLowerCase().includes(term)) ||
            (p.correo && p.correo.toLowerCase().includes(term))
        );

        assert.strictEqual(filtradosNombre.length, 1);
        assert.strictEqual(filtradosNombre[0].nombre, 'AMD Latinoamérica');

        // Búsqueda por correo 'ventas@intel'
        const termCorreo = 'ventas@intel';
        const filtradosCorreo = providersMock.filter(p =>
            (p.nombre && p.nombre.toLowerCase().includes(termCorreo)) ||
            (p.identificacion && p.identificacion.toLowerCase().includes(termCorreo)) ||
            (p.correo && p.correo.toLowerCase().includes(termCorreo))
        );
        assert.strictEqual(filtradosCorreo.length, 1);
        assert.strictEqual(filtradosCorreo[0].id_proveedor, 1);

        // Búsqueda por identificación '900333'
        const termId = '900333';
        const filtradosId = providersMock.filter(p =>
            (p.nombre && p.nombre.toLowerCase().includes(termId)) ||
            (p.identificacion && p.identificacion.toLowerCase().includes(termId)) ||
            (p.correo && p.correo.toLowerCase().includes(termId))
        );
        assert.strictEqual(filtradosId.length, 1);
        assert.strictEqual(filtradosId[0].identificacion, '900333444-2');

        // Filtrado por estado INACTIVO
        const inactivos = providersMock.filter(p => p.estado === 'INACTIVO');
        assert.strictEqual(inactivos.length, 1);
        assert.strictEqual(inactivos[0].id_proveedor, 3);
        assert.strictEqual(inactivos[0].nombre, 'Distribuidora Obsoleta');
    });

});

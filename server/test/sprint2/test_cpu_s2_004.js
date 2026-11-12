const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// Ruta bajo prueba
const categoriasRouter = require('../../routes/categorias');

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

// Extraer handler POST /api/categorias
const createCategoriaHandler = categoriasRouter.stack.find(
    layer => layer.route && layer.route.path === '/' && layer.route.methods.post
).route.stack[0].handle;

describe('Sprint 2 - CP-U-S2-004: Sanitización y obligatoriedad del nombre de categoría', () => {

    test('Debe rechazar con HTTP 400 nombres vacíos, compuestos sólo por espacios o nulos', async () => {
        const nombresInvalidos = ['', '   ', '      ', null, undefined];

        for (const nombre of nombresInvalidos) {
            const req = {
                body: {
                    nombre,
                    descripcion: 'Descripción de prueba'
                }
            };
            const res = createMockRes();

            await createCategoriaHandler(req, res);

            assert.strictEqual(
                res.statusCode,
                400,
                `El nombre '${nombre}' debió ser rechazado con HTTP 400`
            );
            assert.ok(res.body && res.body.error, 'Debe devolver un mensaje de error');
            assert.match(
                res.body.error,
                /El nombre de la categoría es requerido/i,
                'Debe indicar que el nombre es requerido'
            );
        }
    });

    test('Debe sanitizar con trim() los espacios en blanco iniciales y finales al crear categoría', async () => {
        const req = {
            body: {
                nombre: '  Monitores y Pantallas  ',
                descripcion: 'Pantallas gaming y paneles IPS'
            }
        };
        const res = createMockRes();

        await createCategoriaHandler(req, res);

        assert.strictEqual(res.statusCode, 201, 'Debe retornar HTTP 201 Created');
        assert.ok(res.body, 'Debe retornar la categoría creada');
        assert.strictEqual(
            res.body.nombre,
            'Monitores y Pantallas',
            'El nombre debe estar limpio sin espacios en los extremos'
        );
        assert.strictEqual(res.body.total_productos, 0, 'total_productos inicial debe ser 0');
    });

    test('Evaluación unitaria de la lógica de sanitización y detección de strings vacíos', () => {
        const nombresInvalidos = ['', '   ', null, undefined];

        nombresInvalidos.forEach(nombre => {
            const esInvalido = !nombre || !nombre.trim();
            assert.strictEqual(esInvalido, true, `El valor '${nombre}' debió considerarse inválido`);
        });

        const nombreValido = '  Monitores y Pantallas  ';
        const saneado = nombreValido.trim();
        assert.strictEqual(saneado, 'Monitores y Pantallas');
        assert.ok(saneado.length > 0);
    });

});

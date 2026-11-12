const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// Rutas bajo prueba
const authRouter = require('../../routes/auth');
const empleadosRouter = require('../../routes/empleados');
const { registrarOperacion } = require('../../routes/auditoria');

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
const loginHandler = authRouter.stack.find(
    layer => layer.route && layer.route.path === '/login' && layer.route.methods.post
).route.stack[0].handle;

const createEmpleadoHandler = empleadosRouter.stack.find(
    layer => layer.route && layer.route.path === '/' && layer.route.methods.post
).route.stack[0].handle;

const deleteEmpleadoHandler = empleadosRouter.stack.find(
    layer => layer.route && layer.route.path === '/:id' && layer.route.methods.delete
).route.stack[0].handle;

describe('Sprint 1 - Pruebas Unitarias (Usuarios, Roles, Seguridad y Auditoría)', () => {

    // ================================================================
    // CP-U-S1-001: Autenticación con credenciales válidas
    // ================================================================
    test('CP-U-S1-001: Autenticación con credenciales válidas', async () => {
        const req = {
            body: {
                identifier: 'admin',
                password: 'caja123'
            }
        };
        const res = createMockRes();

        await loginHandler(req, res);

        assert.strictEqual(res.statusCode, 200, 'Debe responder HTTP 200');
        assert.ok(res.body, 'Debe retornar el objeto de usuario');
        assert.strictEqual(res.body.nombre_usuario, 'elena.morales', 'El usuario devuelto debe ser elena.morales');
        assert.strictEqual(res.body.password, undefined, 'CRÍTICO: No debe exponer el hash ni clave en la respuesta');
    });

    // ================================================================
    // CP-U-S1-002: Rechazo de autenticación con contraseña incorrecta
    // ================================================================
    test('CP-U-S1-002: Rechazo con contraseña incorrecta', async () => {
        const req = {
            body: {
                identifier: 'admin',
                password: 'WrongPassword_2026!'
            }
        };
        const res = createMockRes();

        await loginHandler(req, res);

        assert.strictEqual(res.statusCode, 401, 'Debe retornar HTTP 401 Unauthorized');
        assert.match(res.body.error, /Credenciales inválidas/i, 'El mensaje debe indicar credenciales inválidas');
    });

    // ================================================================
    // CP-U-S1-003: Validación de payload de creación de empleado
    // ================================================================
    test('CP-U-S1-003: Rechazo por campos obligatorios faltantes al crear empleado', async () => {
        const req = {
            body: {
                tipo_identificacion: 'DNI',
                numero_identificacion: '', // Campo obligatorio vacío
                nombres: '',               // Campo obligatorio vacío
                apellidos: ''              // Campo obligatorio vacío
            }
        };
        const res = createMockRes();

        await createEmpleadoHandler(req, res);

        assert.strictEqual(res.statusCode, 400, 'Debe retornar HTTP 400 Bad Request');
        assert.match(res.body.error, /obligatorios/i, 'Debe indicar que identificación, nombres y apellidos son obligatorios');
    });

    // ================================================================
    // CP-U-S1-004: Inactivación lógica de empleado (borrado lógico)
    // ================================================================
    test('CP-U-S1-004: Borrado lógico — inactivar sin eliminar físicamente', async () => {
        const req = {
            params: { id: '3' } // ID de Camila Valenzuela (Cajera)
        };
        const res = createMockRes();

        await deleteEmpleadoHandler(req, res);

        assert.strictEqual(res.statusCode, 200, 'Debe responder HTTP 200');
        assert.strictEqual(res.body.success, true, 'Debe confirmar éxito');
        assert.strictEqual(res.body.empleado.estado, 'INACTIVO', 'El estado del empleado debe cambiar a INACTIVO');
        assert.ok(res.body.empleado.id_empleado, 'El registro sigue existiendo en el sistema con su ID');
    });

    // ================================================================
    // CP-U-S1-005: Inserción en bitácora de auditoría (tolerante a fallos)
    // ================================================================
    test('CP-U-S1-005: Registro atómico en bitácora de auditoría', async () => {
        const operacionData = {
            id_usuario: 1,
            operacion: 'CREAR',
            tabla_afectada: 'empleados',
            id_registro_afectado: 99,
            descripcion: 'Registro de prueba unitaria en auditoría'
        };

        const log = await registrarOperacion(operacionData);

        assert.ok(log, 'Debe generar el objeto de auditoría');
        assert.strictEqual(log.operacion, 'CREAR', 'La operación registrada debe ser CREAR');
        assert.strictEqual(log.tabla_afectada, 'empleados', 'La tabla afectada debe ser empleados');
        assert.ok(log.fecha_hora, 'Debe incluir timestamp de fecha_hora');
    });

});

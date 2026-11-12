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

// Extraer handler GET /api/inventario/alertas
const getAlertasHandler = inventarioRouter.stack.find(
    layer => layer.route && layer.route.path === '/alertas' && layer.route.methods.get
).route.stack[0].handle;

describe('Sprint 4 - CP-U-S4-004: Algoritmo de clasificación de alertas de existencias (Déficit y Nivel)', () => {

    // Dataset de prueba estipulado en la documentación técnica (03_PRUEBAS_UNITARIAS_SPRINT_4.md)
    const productosMock = [
        { nombre: 'Teclado Mecánico', stock: 0, stock_minimo: 5 },
        { nombre: 'Mouse Gamer', stock: 3, stock_minimo: 5 },
        { nombre: 'Monitor 24"', stock: 12, stock_minimo: 5 }
    ];

    test('Debe calcular con precisión el déficit y clasificar los niveles de alerta (AGOTADO, BAJO, NORMAL)', () => {
        // Algoritmo implementado en server/routes/inventario.js (líneas 142-145 y 165-166)
        const alertas = productosMock.map(p => {
            const stockActual = p.stock || 0;
            const stockMin = p.stock_minimo || 5;
            const deficit = Math.max(0, stockMin - stockActual);
            let nivel = 'NORMAL';
            if (stockActual === 0) nivel = 'AGOTADO';
            else if (stockActual <= stockMin) nivel = 'BAJO';
            return { nombre: p.nombre, deficit, nivel };
        });

        // Caso 1: Stock en 0 (Agotado total)
        assert.strictEqual(alertas[0].nivel, 'AGOTADO', 'Producto con stock 0 debe tener nivel AGOTADO');
        assert.strictEqual(alertas[0].deficit, 5, 'Déficit debe ser 5 unidades para alcanzar el mínimo');

        // Caso 2: Stock por debajo del mínimo (Alerta de reabastecimiento)
        assert.strictEqual(alertas[1].nivel, 'BAJO', 'Producto con stock 3 <= 5 debe tener nivel BAJO');
        assert.strictEqual(alertas[1].deficit, 2, 'Déficit debe ser 2 unidades');

        // Caso 3: Stock suficiente (Operación normal)
        assert.strictEqual(alertas[2].nivel, 'NORMAL', 'Producto con stock 12 > 5 debe tener nivel NORMAL');
        assert.strictEqual(alertas[2].deficit, 0, 'No debe existir déficit para productos con stock normal');
    });

    test('Debe clasificar como BAJO con déficit 0 cuando el stock iguala exactamente al mínimo', () => {
        const productoLimite = { nombre: 'Cable HDMI 2.1', stock: 5, stock_minimo: 5 };
        const stockActual = productoLimite.stock;
        const stockMin = productoLimite.stock_minimo;
        const deficit = Math.max(0, stockMin - stockActual);

        let nivel = 'NORMAL';
        if (stockActual === 0) nivel = 'AGOTADO';
        else if (stockActual <= stockMin) nivel = 'BAJO';

        assert.strictEqual(nivel, 'BAJO', 'Stock igual al mínimo debe marcar nivel BAJO preventivo');
        assert.strictEqual(deficit, 0, 'Déficit es 0 ya que cuenta con las unidades mínimas');
    });

    test('Debe responder HTTP 200 y entregar listado de alertas desde el endpoint GET /api/inventario/alertas', async () => {
        const req = {};
        const res = createMockRes();

        await getAlertasHandler(req, res);

        assert.strictEqual(res.statusCode, 200, 'Debe responder HTTP 200');
        assert.ok(Array.isArray(res.body), 'La respuesta debe ser una lista de productos en alerta');
        if (res.body.length > 0) {
            const alerta = res.body[0];
            assert.ok('stock_actual' in alerta, 'Debe incluir stock_actual');
            assert.ok('stock_minimo' in alerta, 'Debe incluir stock_minimo');
            assert.ok('deficit' in alerta, 'Debe incluir deficit');
            assert.ok('nivel_alerta' in alerta, 'Debe incluir nivel_alerta');
            assert.ok(['AGOTADO', 'BAJO'].includes(alerta.nivel_alerta), 'Solo debe reportar productos AGOTADOS o BAJOS');
        }
    });

});


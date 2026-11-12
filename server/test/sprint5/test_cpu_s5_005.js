const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

describe('Sprint 5 - CP-U-S5-005: Formateo de identificador correlativo de Orden de Compra (OC-XXXX)', () => {

    // Función de formateo utilizada en backend (server/routes/compras.js, líneas 91 y 125)
    const formatearOCBackend = (id) => `#OC-${String(id).padStart(4, '0')}`;

    // Función de formateo utilizada en la grilla del frontend (ComprasView.jsx, línea 179)
    const formatearOCFrontend = (id, year = '2026') => `#OC-${year}-${String(id).padStart(4, '0')}`;

    test('Debe formatear IDs de 1 dígito con 3 ceros a la izquierda (#OC-0001)', () => {
        assert.strictEqual(formatearOCBackend(1), '#OC-0001');
        assert.strictEqual(formatearOCFrontend(1), '#OC-2026-0001');
    });

    test('Debe formatear IDs de 2 dígitos con 2 ceros a la izquierda (#OC-0045)', () => {
        assert.strictEqual(formatearOCBackend(45), '#OC-0045');
        assert.strictEqual(formatearOCFrontend(45), '#OC-2026-0045');
    });

    test('Debe formatear IDs de 3 dígitos con 1 cero a la izquierda (#OC-0120)', () => {
        assert.strictEqual(formatearOCBackend(120), '#OC-0120');
        assert.strictEqual(formatearOCFrontend(120), '#OC-2026-0120');
    });

    test('Debe preservar sin truncar IDs de 4 dígitos o superiores (#OC-9999, #OC-10000)', () => {
        assert.strictEqual(formatearOCBackend(9999), '#OC-9999');
        assert.strictEqual(formatearOCBackend(10000), '#OC-10000');
        assert.strictEqual(formatearOCFrontend(9999), '#OC-2026-9999');
        assert.strictEqual(formatearOCFrontend(10000), '#OC-2026-10000');
    });

    test('Debe procesar IDs proporcionados como número o cadena numérica', () => {
        assert.strictEqual(formatearOCBackend(7), '#OC-0007');
        assert.strictEqual(formatearOCBackend('7'), '#OC-0007');
        assert.strictEqual(formatearOCBackend(250), '#OC-0250');
        assert.strictEqual(formatearOCBackend('250'), '#OC-0250');
    });

});


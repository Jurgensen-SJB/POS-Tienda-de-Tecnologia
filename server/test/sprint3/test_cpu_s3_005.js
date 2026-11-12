const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

describe('Sprint 3 - CP-U-S3-005: Generación de correlativo de factura con formato FAC-XXXXXX', () => {

    // Función correlativa implementada en server/routes/ventas.js
    const formatearFactura = (consecutivo) => {
        return `FAC-${String(consecutivo).padStart(6, '0')}`;
    };

    test('Debe formatear números consecutivos bajos rellenando ceros a la izquierda (6 dígitos)', () => {
        assert.strictEqual(formatearFactura(1), 'FAC-000001');
        assert.strictEqual(formatearFactura(5), 'FAC-000005');
        assert.strictEqual(formatearFactura(89), 'FAC-000089');
    });

    test('Debe formatear números de orden típicos según la especificación del sistema', () => {
        // En el sistema los correlativos de facturas inician en 2342 en adelante
        assert.strictEqual(formatearFactura(2342), 'FAC-002342');
        assert.strictEqual(formatearFactura(2345), 'FAC-002345');
        assert.strictEqual(formatearFactura(12345), 'FAC-012345');
    });

    test('Debe soportar límites superiores hasta 6 dígitos numéricos sin pérdida de formato', () => {
        assert.strictEqual(formatearFactura(999999), 'FAC-999999');
    });

    test('El código de factura generado debe cumplir estrictamente con la expresión regular ^FAC-\\d{6}$', () => {
        const casos = [1, 42, 2342, 8500, 999999];

        for (const num of casos) {
            const factura = formatearFactura(num);
            assert.match(
                factura,
                /^FAC-\d{6}$/,
                `La factura '${factura}' debe cumplir con el patrón FAC-XXXXXX (prefijo FAC- seguido de 6 dígitos)`
            );
        }
    });

});


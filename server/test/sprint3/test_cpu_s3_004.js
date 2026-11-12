const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

describe('Sprint 3 - CP-U-S3-004: Cálculo de cambio en efectivo y validación de pago suficiente', () => {

    function procesarPagoEfectivo(totalVenta, montoRecibido) {
        const esSuficiente = montoRecibido >= totalVenta;
        if (!esSuficiente) {
            return {
                valido: false,
                cambio: 0,
                faltante: totalVenta - montoRecibido,
                mensaje: `Pago insuficiente. Faltan $${(totalVenta - montoRecibido).toLocaleString()} para cubrir el total`
            };
        }
        return {
            valido: true,
            cambio: montoRecibido - totalVenta,
            faltante: 0,
            mensaje: 'Pago completado con éxito'
        };
    }

    test('Debe calcular con exactitud el cambio a entregar cuando el monto recibido supera el total', () => {
        // Caso estipulado en la documentación oficial: total $185,000 con billete de $200,000
        const casoPagoValido = { totalVenta: 185000, montoRecibido: 200000 };

        const resultado = procesarPagoEfectivo(casoPagoValido.totalVenta, casoPagoValido.montoRecibido);

        assert.strictEqual(resultado.valido, true, 'El pago debe considerarse válido');
        assert.strictEqual(resultado.cambio, 15000, 'El cambio devuelto debe ser exactamente $15,000');
        assert.strictEqual(resultado.faltante, 0);
    });

    test('Debe rechazar pagos con efectivo insuficiente y calcular el faltante', () => {
        // Caso estipulado en la documentación: total $185,000 recibiendo $150,000
        const casoPagoInsuficiente = { totalVenta: 185000, montoRecibido: 150000 };

        const resultado = procesarPagoEfectivo(casoPagoInsuficiente.totalVenta, casoPagoInsuficiente.montoRecibido);

        assert.strictEqual(resultado.valido, false, 'El pago debe ser marcado como insuficiente');
        assert.strictEqual(resultado.cambio, 0, 'No debe generarse cambio');
        assert.strictEqual(resultado.faltante, 35000, 'El faltante debe ser exactamente $35,000');
        assert.match(resultado.mensaje, /insuficiente/i);
    });

    test('Debe procesar pagos con importe exacto sin generar cambio (cambio = 0)', () => {
        const casoPagoExacto = { totalVenta: 75000, montoRecibido: 75000 };

        const resultado = procesarPagoEfectivo(casoPagoExacto.totalVenta, casoPagoExacto.montoRecibido);

        assert.strictEqual(resultado.valido, true);
        assert.strictEqual(resultado.cambio, 0, 'El cambio debe ser $0 cuando el pago es exacto');
        assert.strictEqual(resultado.faltante, 0);
    });

});


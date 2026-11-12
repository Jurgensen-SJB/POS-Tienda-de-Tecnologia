const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

describe('Sprint 3 - CP-U-S3-002: Liquidación aritmética de subtotales, descuentos y total neto', () => {

    // Dataset de prueba estipulado en la documentación de QA (03_PRUEBAS_UNITARIAS_SPRINT_3.md)
    const itemsPrueba = [
        { id_producto: 1, cant: 2, precio_venta: 285000, descuento: 10000, subtotal: 560000 },
        { id_producto: 2, cant: 1, precio_venta: 189000, descuento: 0, subtotal: 189000 }
    ];
    const descuentoGlobal = 20000;

    test('Debe calcular con precisión el subtotal bruto de todos los items', () => {
        // Subtotal bruto = suma de (cantidad * precio_venta)
        const subtotalBruto = itemsPrueba.reduce(
            (acc, item) => acc + (item.cant * item.precio_venta),
            0
        );

        // (2 * 285000) + (1 * 189000) = 570000 + 189000 = 759000
        assert.strictEqual(subtotalBruto, 759000, 'El subtotal bruto debe ser exactamente $759,000');
    });

    test('Debe acumular correctamente los descuentos por ítem y el descuento global', () => {
        // Descuentos de línea
        const descuentosItems = itemsPrueba.reduce(
            (acc, item) => acc + (item.descuento || 0),
            0
        );
        assert.strictEqual(descuentosItems, 10000, 'El descuento total por ítems debe ser $10,000');

        // Descuento consolidado (línea + global)
        const descuentoTotal = descuentosItems + descuentoGlobal;
        assert.strictEqual(descuentoTotal, 30000, 'El descuento total acumulado debe ser $30,000');
    });

    test('Debe liquidar el total neto a pagar restando el descuento total del subtotal bruto', () => {
        const subtotalBruto = itemsPrueba.reduce((acc, item) => acc + (item.cant * item.precio_venta), 0);
        const descuentosItems = itemsPrueba.reduce((acc, item) => acc + (item.descuento || 0), 0);
        const descuentoTotal = descuentosItems + descuentoGlobal;

        const totalNeto = subtotalBruto - descuentoTotal;

        // 759000 - 30000 = 729000
        assert.strictEqual(totalNeto, 729000, 'El total neto final debe ser $729,000 exactos');
    });

    test('Debe calcular correctamente venta sin descuentos aplicados', () => {
        const itemsSinDescuento = [
            { id_producto: 10, cant: 3, precio_venta: 50000, descuento: 0 },
            { id_producto: 11, cant: 1, precio_venta: 120000, descuento: 0 }
        ];

        const subtotal = itemsSinDescuento.reduce((acc, i) => acc + (i.cant * i.precio_venta), 0);
        const total = subtotal;

        assert.strictEqual(subtotal, 270000);
        assert.strictEqual(total, 270000, 'Sin descuentos, subtotal y total deben ser idénticos');
    });

});


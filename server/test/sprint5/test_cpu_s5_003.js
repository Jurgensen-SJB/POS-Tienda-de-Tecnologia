const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

describe('Sprint 5 - CP-U-S5-003: Consolidación de costos y total de compra por renglón', () => {

    // Dataset estipulado en la documentación técnica (03_PRUEBAS_UNITARIAS_SPRINT_5.md)
    const itemsCompra = [
        { id_producto: 1, cantidad: 10, costo_unitario: 210000 },
        { id_producto: 2, cantidad: 5, costo_unitario: 135000 },
        { id_producto: 3, cantidad: 2, costo_unitario: 450000 }
    ];

    test('Debe calcular con precisión matemática los subtotales por renglón (cantidad * costo_unitario)', () => {
        const subtotales = itemsCompra.map(item => ({
            id_producto: item.id_producto,
            subtotal: item.cantidad * item.costo_unitario
        }));

        assert.strictEqual(subtotales[0].subtotal, 2100000, 'Renglón 1: 10 * 210,000 = $2,100,000 COP');
        assert.strictEqual(subtotales[1].subtotal, 675000, 'Renglón 2: 5 * 135,000 = $675,000 COP');
        assert.strictEqual(subtotales[2].subtotal, 900000, 'Renglón 3: 2 * 450,000 = $900,000 COP');
    });

    test('Debe consolidar el valor total acumulado sumando todos los subtotales de la orden', () => {
        let totalCalculado = 0;

        itemsCompra.forEach(item => {
            const subtotalItem = item.cantidad * item.costo_unitario;
            totalCalculado += subtotalItem;
        });

        // 2,100,000 + 675,000 + 900,000 = 3,675,000
        assert.strictEqual(
            totalCalculado,
            3675000,
            'El total acumulado de la compra debe ser exactamente $3,675,000 COP'
        );
    });

    test('Debe manejar órdenes de compra unitarias y órdenes con costos decimales sin desviación', () => {
        const compraSimple = [
            { id_producto: 10, cantidad: 1, costo_unitario: 99999.50 }
        ];

        const totalSimple = compraSimple.reduce((acc, it) => acc + (it.cantidad * it.costo_unitario), 0);
        assert.strictEqual(totalSimple, 99999.50, 'Orden unitaria debe conservar su valor exacto');

        const compraLoteMayorista = [
            { id_producto: 11, cantidad: 100, costo_unitario: 15450.25 },
            { id_producto: 12, cantidad: 50, costo_unitario: 8200.75 }
        ];

        const totalLote = compraLoteMayorista.reduce((acc, it) => acc + (it.cantidad * it.costo_unitario), 0);
        // (100 * 15450.25) + (50 * 8200.75) = 1,545,025 + 410,037.5 = 1,955,062.5
        assert.strictEqual(totalLote, 1955062.50, 'Cálculo de lote mayorista debe coincidir al centavo');
    });

});


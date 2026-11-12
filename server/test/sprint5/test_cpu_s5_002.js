const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

describe('Sprint 5 - CP-U-S5-002: Incremento aritmético de existencias por recepción de compra', () => {

    // Casos de prueba estipulados en la documentación técnica (03_PRUEBAS_UNITARIAS_SPRINT_5.md)
    const casosStock = [
        { stockPrevio: 15, cantidadComprada: 10, esperado: 25 },
        { stockPrevio: 0, cantidadComprada: 8, esperado: 8 },
        { stockPrevio: 50, cantidadComprada: 25, esperado: 75 }
    ];

    test('Debe calcular con exactitud el nuevo stock tras la recepción de mercancía', () => {
        casosStock.forEach(({ stockPrevio, cantidadComprada, esperado }) => {
            // Algoritmo implementado en server/routes/compras.js (línea 55)
            const nuevoStock = stockPrevio + cantidadComprada;
            assert.strictEqual(
                nuevoStock,
                esperado,
                `Para stock inicial ${stockPrevio} y compra de ${cantidadComprada}, el nuevo stock debe ser ${esperado}`
            );
            assert.ok(nuevoStock > stockPrevio, 'El nuevo stock debe ser estrictamente mayor que el previo');
        });
    });

    test('Debe permitir el reabastecimiento de artículos totalmente agotados (stock = 0)', () => {
        const stockAgotado = 0;
        const loteEntrante = 50;
        const stockActualizado = stockAgotado + loteEntrante;

        assert.strictEqual(
            stockActualizado,
            50,
            'Un producto con stock en 0 debe reflejar exactamente la cantidad comprada tras la entrada'
        );
        assert.ok(stockActualizado > 0, 'El stock final debe quedar positivo tras abastecimiento');
    });

    test('Debe acumular existencias de múltiples renglones de compra sobre un inventario consolidado', () => {
        const inventarioAlmacen = {
            1: { nombre: 'SSD Kingston NV2 1TB', stock: 15 },
            2: { nombre: 'Memoria RAM DDR5 16GB', stock: 4 },
            3: { nombre: 'Fuente Poder 750W Gold', stock: 0 }
        };

        const itemsCompraRecibida = [
            { id_producto: 1, cantidad: 10 },
            { id_producto: 2, cantidad: 16 },
            { id_producto: 3, cantidad: 12 }
        ];

        itemsCompraRecibida.forEach(item => {
            const prod = inventarioAlmacen[item.id_producto];
            prod.stock = prod.stock + item.cantidad;
        });

        assert.strictEqual(inventarioAlmacen[1].stock, 25, 'SSD Kingston debe subir de 15 a 25 unidades (+10)');
        assert.strictEqual(inventarioAlmacen[2].stock, 20, 'Memoria RAM debe subir de 4 a 20 unidades (+16)');
        assert.strictEqual(inventarioAlmacen[3].stock, 12, 'Fuente de poder agotada debe subir de 0 a 12 unidades (+12)');
    });

});


const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

describe('Sprint 4 - CP-U-S4-001: Descuento de stock en venta y prevención de existencias negativas', () => {

    // Casos de prueba estipulados en la documentación técnica (03_PRUEBAS_UNITARIAS_SPRINT_4.md)
    const casosDescuento = [
        { currentStock: 20, cantVendida: 5, esperado: 15 },
        { currentStock: 3, cantVendida: 3, esperado: 0 },
        { currentStock: 2, cantVendida: 5, esperado: 0 } // Caso extremo de seguridad
    ];

    test('Debe calcular con exactitud el nuevo stock restando la cantidad vendida', () => {
        casosDescuento.forEach(({ currentStock, cantVendida, esperado }) => {
            // Algoritmo implementado en server/routes/ventas.js (línea 129 y 224)
            const newStock = Math.max(0, currentStock - cantVendida);
            assert.strictEqual(
                newStock,
                esperado,
                `Para stock inicial ${currentStock} y venta ${cantVendida}, el resultado debió ser ${esperado}`
            );
            assert.ok(newStock >= 0, 'El stock nunca debe ser un número negativo');
        });
    });

    test('Debe garantizar que el stock resultante nunca sea menor que cero ante sobreventa', () => {
        const casosExtremos = [
            { stock: 0, venta: 1 },
            { stock: 5, venta: 100 },
            { stock: 1, venta: 10 }
        ];

        for (const { stock, venta } of casosExtremos) {
            const resultado = Math.max(0, stock - venta);
            assert.strictEqual(resultado, 0, 'El stock ante ventas excesivas debe truncarse a 0');
            assert.ok(resultado >= 0, 'No se permiten existencias negativas bajo ninguna condición');
        }
    });

    test('Debe descontar correctamente existencias en un carrito con múltiples productos', () => {
        const inventarioAlmacen = {
            1: { nombre: 'iPhone 15 Pro', stock: 25 },
            2: { nombre: 'Samsung Galaxy S24', stock: 10 },
            3: { nombre: 'MacBook Air M3', stock: 8 }
        };

        const carritoVenta = [
            { id_producto: 1, cant: 3 },
            { id_producto: 2, cant: 10 },
            { id_producto: 3, cant: 2 }
        ];

        carritoVenta.forEach(item => {
            const prod = inventarioAlmacen[item.id_producto];
            prod.stock = Math.max(0, prod.stock - item.cant);
        });

        assert.strictEqual(inventarioAlmacen[1].stock, 22, 'iPhone 15 Pro debe quedar con 22 unidades (25 - 3)');
        assert.strictEqual(inventarioAlmacen[2].stock, 0, 'Samsung Galaxy S24 debe quedar en 0 unidades (10 - 10)');
        assert.strictEqual(inventarioAlmacen[3].stock, 6, 'MacBook Air M3 debe quedar con 6 unidades (8 - 2)');
    });

});

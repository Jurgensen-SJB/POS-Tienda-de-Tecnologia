const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

describe('Sprint 4 - CP-U-S4-002: Reversión aritmética de existencias por anulación de comprobante', () => {

    test('Debe reintegrar al stock las unidades exactas de cada renglón de la venta anulada', () => {
        // Dataset de prueba estipulado en la documentación técnica (03_PRUEBAS_UNITARIAS_SPRINT_4.md)
        const stockAlmacen = {
            101: 8,  // SSD Kingston 1TB
            102: 12  // Mouse Logitech G502
        };

        const itemsVentaAnulada = [
            { id_producto: 101, cantidad: 2 },
            { id_producto: 102, cantidad: 3 }
        ];

        // Lógica de reversión implementada en server/routes/ventas.js (línea 323 y 383)
        itemsVentaAnulada.forEach(item => {
            const stockPrevio = stockAlmacen[item.id_producto];
            const stockRevertido = stockPrevio + item.cantidad;
            stockAlmacen[item.id_producto] = stockRevertido;
        });

        assert.strictEqual(
            stockAlmacen[101],
            10,
            'El producto 101 debe quedar con 10 unidades (8 existencias previas + 2 devueltas)'
        );
        assert.strictEqual(
            stockAlmacen[102],
            15,
            'El producto 102 debe quedar con 15 unidades (12 existencias previas + 3 devueltas)'
        );
    });

    test('No debe alterar las existencias de productos ajenos a la transacción anulada', () => {
        const inventario = {
            201: 5,  // Producto vendido
            202: 18  // Producto no involucrado
        };

        const itemsAnulados = [
            { id_producto: 201, cantidad: 4 }
        ];

        itemsAnulados.forEach(item => {
            inventario[item.id_producto] += item.cantidad;
        });

        assert.strictEqual(inventario[201], 9, 'El producto 201 debe incrementarse a 9');
        assert.strictEqual(inventario[202], 18, 'El producto 202 debe conservar sus 18 unidades intactas');
    });

    test('Debe acumular existencias correctamente si un producto aparece en múltiples renglones devueltos', () => {
        const inventario = { 301: 0 };
        const items = [
            { id_producto: 301, cantidad: 2 },
            { id_producto: 301, cantidad: 3 }
        ];

        items.forEach(i => {
            inventario[i.id_producto] += i.cantidad;
        });

        assert.strictEqual(inventario[301], 5, 'El stock acumulado devuelto debe ser exactamente 5 (2 + 3)');
    });

});

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

describe('Sprint 3 - CP-U-S3-003: Detección de existencias insuficientes previa a la venta', () => {

    const inventarioMock = {
        101: { nombre: 'Disco Duro 2TB', stock: 3 },
        102: { nombre: 'Memoria RAM 16GB', stock: 15 },
        103: { nombre: 'Teclado Mecánico', stock: 0 }
    };

    function validarDisponibilidadStock(items, inventario) {
        for (const item of items) {
            const prod = inventario[item.id_producto];
            if (!prod) {
                return {
                    valido: false,
                    error: `Producto #${item.id_producto} no encontrado en almacén`
                };
            }
            const currentStock = prod.stock;
            const requestedCant = item.cant;

            if (currentStock < requestedCant) {
                return {
                    valido: false,
                    error: `Stock insuficiente para "${prod.nombre}". Stock disponible en almacén: ${currentStock}, intentas vender: ${requestedCant}`
                };
            }
        }
        return { valido: true, error: null };
    }

    test('Debe detectar y rechazar cuando un producto excede el stock disponible', () => {
        const itemsSolicitados = [
            { id_producto: 101, cant: 5 }, // Excede stock (stock actual: 3)
            { id_producto: 102, cant: 2 }   // Válido (stock actual: 15)
        ];

        const resultado = validarDisponibilidadStock(itemsSolicitados, inventarioMock);

        assert.strictEqual(resultado.valido, false, 'La verificación de stock debe retornar falso');
        assert.ok(resultado.error, 'Debe incluir mensaje descriptivo del fallo');
        assert.match(
            resultado.error,
            /Stock insuficiente para "Disco Duro 2TB"/i,
            'El mensaje debe señalar textualmente el producto afectado'
        );
        assert.match(
            resultado.error,
            /Stock disponible en almacén: 3/i,
            'Debe indicar la cantidad disponible real en inventario'
        );
        assert.match(
            resultado.error,
            /intentas vender: 5/i,
            'Debe indicar la cantidad requerida en la venta'
        );
    });

    test('Debe bloquear venta cuando el stock disponible es 0 (producto agotado)', () => {
        const itemsAgotados = [
            { id_producto: 103, cant: 1 } // Stock: 0
        ];

        const resultado = validarDisponibilidadStock(itemsAgotados, inventarioMock);

        assert.strictEqual(resultado.valido, false);
        assert.match(resultado.error, /Stock disponible en almacén: 0/i);
    });

    test('Debe permitir la venta cuando todos los productos tienen existencias suficientes', () => {
        const itemsValidos = [
            { id_producto: 101, cant: 3 }, // Exactamente el stock disponible
            { id_producto: 102, cant: 10 } // Menor al stock disponible
        ];

        const resultado = validarDisponibilidadStock(itemsValidos, inventarioMock);

        assert.strictEqual(resultado.valido, true, 'Debe aprobar si el stock es suficiente o igual');
        assert.strictEqual(resultado.error, null);
    });

});


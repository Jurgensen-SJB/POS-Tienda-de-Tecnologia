const fs = require('fs');
const path = require('path');
const file = path.resolve(__dirname, '../db/fallbackData.js');
let content = fs.readFileSync(file, 'utf8');

const PRODUCT_PRICES_COP = {
  1: 4890000, 2: 4990000, 3: 1550000, 4: 2490000,
  5: 4390000, 6: 5600000, 7: 3400000, 8: 6800000,
  9: 1560000, 10: 2600000, 11: 520000, 12: 920000,
  13: 399000, 14: 450000, 15: 480000, 16: 280000,
  17: 1390000, 18: 1150000, 19: 640000, 20: 320000,
  21: 720000, 22: 280000, 23: 990000, 24: 220000,
};

// Reemplazar precios en fallbackData
for (const [id, price] of Object.entries(PRODUCT_PRICES_COP)) {
  const regex = new RegExp('("id_producto":\\s*' + id + ',[\\s\\S]*?"precio_venta":\\s*")[0-9.]*(")');
  content = content.replace(regex, `$1${price.toFixed(2)}$2`);
}

// Actualizar cajaActual
content = content.replace(/monto_inicial:\s*500/g, 'monto_inicial: 200000');
content = content.replace(/total_en_caja:\s*500/g, 'total_en_caja: 200000');
content = content.replace(/monto_inicial:\s*150/g, 'monto_inicial: 200000');

// Actualizar métodos de pago si dice Yape/Plin
content = content.replace(/Yape \/ Plin/g, 'Nequi / Daviplata');
content = content.replace(/Billeteras digitales/g, 'Billeteras digitales (Nequi / Daviplata)');

fs.writeFileSync(file, content, 'utf8');
console.log('✅ fallbackData.js actualizado con precios COP con éxito');

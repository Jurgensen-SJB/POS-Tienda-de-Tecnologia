/**
 * Utilidades para formatear moneda y números en Pesos Colombianos (COP)
 */

/**
 * Formatea un número como Peso Colombiano (COP).
 * Ejemplo:
 *   formatCOP(150000) => "$ 150.000"
 *   formatCOP(4890000) => "$ 4.890.000"
 *   formatCOP(0) => "$ 0"
 */
export const formatCOP = (val) => {
  const num = Math.round(parseFloat(val) || 0);
  return '$ ' + num.toLocaleString('es-CO');
};

/**
 * Formatea únicamente el número con separadores de miles estilo Colombia (punto).
 * Ejemplo:
 *   formatNumberCOP(150000) => "150.000"
 */
export const formatNumberCOP = (val) => {
  const num = Math.round(parseFloat(val) || 0);
  return num.toLocaleString('es-CO');
};

/**
 * Alias de conveniencia
 */
export const formatMoney = formatCOP;

export default formatCOP;

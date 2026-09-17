const API_BASE = 'http://localhost:5000/api';

async function fetchJson(url, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`API error on ${url}:`, err.message);
    throw err;
  }
}

export const api = {
  // Autenticación
  login: (identifier, password) => fetchJson('/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password }) }),

  // Productos
  getProducts: () => fetchJson('/productos'),
  getProduct: (id) => fetchJson(`/productos/${id}`),
  createProduct: (data) => fetchJson('/productos', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => fetchJson(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => fetchJson(`/productos/${id}`, { method: 'DELETE' }),

  // Categorías
  getCategories: () => fetchJson('/categorias'),
  createCategory: (data) => fetchJson('/categorias', { method: 'POST', body: JSON.stringify(data) }),

  // Clientes
  getClients: () => fetchJson('/clientes'),
  createClient: (data) => fetchJson('/clientes', { method: 'POST', body: JSON.stringify(data) }),

  // Empleados / Usuarios
  getEmployees: () => fetchJson('/empleados'),
  createEmployee: (data) => fetchJson('/empleados', { method: 'POST', body: JSON.stringify(data) }),

  // Ventas & Checkout
  getSales: () => fetchJson('/ventas'),
  checkout: (data) => fetchJson('/ventas', { method: 'POST', body: JSON.stringify(data) }),
  anularSale: (id) => fetchJson(`/ventas/${id}/anular`, { method: 'POST' }),

  // Cajas
  getCajaActual: () => fetchJson('/cajas/actual'),
  aperturaCaja: (data) => fetchJson('/cajas/apertura', { method: 'POST', body: JSON.stringify(data) }),
  cierreCaja: (data) => fetchJson('/cajas/cierre', { method: 'POST', body: JSON.stringify(data) }),

  // Proveedores
  getProviders: () => fetchJson('/proveedores'),
  createProvider: (data) => fetchJson('/proveedores', { method: 'POST', body: JSON.stringify(data) }),

  // Compras
  getPurchases: () => fetchJson('/compras'),
  createPurchase: (data) => fetchJson('/compras', { method: 'POST', body: JSON.stringify(data) }),
};

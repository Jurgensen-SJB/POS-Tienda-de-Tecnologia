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
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/productos${query ? '?' + query : ''}`);
  },
  getProduct: (id) => fetchJson(`/productos/${id}`),
  createProduct: (data) => fetchJson('/productos', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => fetchJson(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleProductStatus: (id, estado) => fetchJson(`/productos/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) }),
  deleteProduct: (id) => fetchJson(`/productos/${id}`, { method: 'DELETE' }),

  // Categorías
  getCategories: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/categorias${query ? '?' + query : ''}`);
  },
  getCategory: (id) => fetchJson(`/categorias/${id}`),
  createCategory: (data) => fetchJson('/categorias', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) => fetchJson(`/categorias/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleCategoryStatus: (id, estado) => fetchJson(`/categorias/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) }),

  // Clientes
  getClients: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/clientes${query ? '?' + query : ''}`);
  },
  getClient: (id) => fetchJson(`/clientes/${id}`),
  createClient: (data) => fetchJson('/clientes', { method: 'POST', body: JSON.stringify(data) }),
  updateClient: (id, data) => fetchJson(`/clientes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleClientStatus: (id, estado) => fetchJson(`/clientes/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) }),

  // Empleados / Usuarios
  getEmployees: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/empleados${query ? '?' + query : ''}`);
  },
  getEmployee: (id) => fetchJson(`/empleados/${id}`),
  createEmployee: (data) => fetchJson('/empleados', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (id, data) => fetchJson(`/empleados/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleEmployeeStatus: (id, estado) => fetchJson(`/empleados/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) }),
  deactivateEmployee: (id) => fetchJson(`/empleados/${id}`, { method: 'DELETE' }),

  // Ventas & Checkout
  getSales: () => fetchJson('/ventas'),
  checkout: (data) => fetchJson('/ventas', { method: 'POST', body: JSON.stringify(data) }),
  anularSale: (id) => fetchJson(`/ventas/${id}/anular`, { method: 'POST' }),

  // Cajas
  getCajaActual: () => fetchJson('/cajas/actual'),
  aperturaCaja: (data) => fetchJson('/cajas/apertura', { method: 'POST', body: JSON.stringify(data) }),
  cierreCaja: (data) => fetchJson('/cajas/cierre', { method: 'POST', body: JSON.stringify(data) }),

  // Proveedores
  getProviders: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/proveedores${query ? '?' + query : ''}`);
  },
  getProvider: (id) => fetchJson(`/proveedores/${id}`),
  createProvider: (data) => fetchJson('/proveedores', { method: 'POST', body: JSON.stringify(data) }),
  updateProvider: (id, data) => fetchJson(`/proveedores/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleProviderStatus: (id, estado) => fetchJson(`/proveedores/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) }),

  // Compras
  getPurchases: () => fetchJson('/compras'),
  createPurchase: (data) => fetchJson('/compras', { method: 'POST', body: JSON.stringify(data) }),

  // Permisos
  getAllPermisos: () => fetchJson('/permisos'),
  getPermisosByUsuario: (id_usuario) => fetchJson(`/permisos/usuario/${id_usuario}`),
  getPermisosByRol: (id_rol) => fetchJson(`/permisos/rol/${id_rol}`),
  updatePermisosByRol: (id_rol, permisos) => fetchJson(`/permisos/rol/${id_rol}`, { method: 'PUT', body: JSON.stringify({ permisos }) }),

  // Auditoría y Registro de Operaciones
  getAuditoria: () => fetchJson('/auditoria'),
  createAuditoria: (data) => fetchJson('/auditoria', { method: 'POST', body: JSON.stringify(data) }),
};

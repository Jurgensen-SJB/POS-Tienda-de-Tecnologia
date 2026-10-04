const API_BASE = 'http://localhost:5000/api';

function getStoredUser() {
  try {
    const raw = localStorage.getItem('pos_current_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function fetchJson(url, options = {}) {
  const user = getStoredUser();
  const headers = {
    'Content-Type': 'application/json',
    ...(user?.id_usuario ? {
      'x-user-id': String(user.id_usuario),
      'x-user-name': user.nombre_usuario || user.nombre || 'Usuario',
      'x-user-role': user.rol || 'Usuario'
    } : {}),
    ...options.headers,
  };

  let body = options.body;
  if (body && typeof body === 'string') {
    try {
      const parsed = JSON.parse(body);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        if (!parsed.id_usuario && user?.id_usuario) {
          parsed.id_usuario = user.id_usuario;
          body = JSON.stringify(parsed);
        }
      }
    } catch (_) {}
  }

  try {
    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
      body,
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
  toggleProductStatus: (id, estado, extra = {}) => fetchJson(`/productos/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado, ...extra }) }),
  deleteProduct: (id, extra = {}) => fetchJson(`/productos/${id}`, { method: 'DELETE', body: JSON.stringify(extra) }),

  // Categorías
  getCategories: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/categorias${query ? '?' + query : ''}`);
  },
  getCategory: (id) => fetchJson(`/categorias/${id}`),
  createCategory: (data) => fetchJson('/categorias', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) => fetchJson(`/categorias/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleCategoryStatus: (id, estado, extra = {}) => fetchJson(`/categorias/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado, ...extra }) }),

  // Clientes
  getClients: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/clientes${query ? '?' + query : ''}`);
  },
  getClient: (id) => fetchJson(`/clientes/${id}`),
  createClient: (data) => fetchJson('/clientes', { method: 'POST', body: JSON.stringify(data) }),
  updateClient: (id, data) => fetchJson(`/clientes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleClientStatus: (id, estado, extra = {}) => fetchJson(`/clientes/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado, ...extra }) }),

  // Empleados / Usuarios
  getEmployees: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/empleados${query ? '?' + query : ''}`);
  },
  getEmployee: (id) => fetchJson(`/empleados/${id}`),
  createEmployee: (data) => fetchJson('/empleados', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (id, data) => fetchJson(`/empleados/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getEmployeeCredentials: (id) => fetchJson(`/empleados/${id}/credenciales`),
  updateEmployeeCredentials: (id, data) => fetchJson(`/empleados/${id}/credenciales`, { method: 'PATCH', body: JSON.stringify(data) }),
  toggleEmployeeStatus: (id, estado, extra = {}) => fetchJson(`/empleados/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado, ...extra }) }),
  deactivateEmployee: (id, extra = {}) => fetchJson(`/empleados/${id}`, { method: 'DELETE', body: JSON.stringify(extra) }),

  // Ventas & Checkout
  getSales: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/ventas${query ? '?' + query : ''}`);
  },
  getVentas: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/ventas${query ? '?' + query : ''}`);
  },
  checkout: (data) => fetchJson('/ventas', { method: 'POST', body: JSON.stringify(data) }),
  anularSale: (id, userData = {}) => fetchJson(`/ventas/${id}/anular`, { method: 'POST', body: JSON.stringify(userData) }),
  getSaleInvoice: (id) => fetchJson(`/ventas/${id}/factura`),
  generateInvoice: (id) => fetchJson(`/ventas/${id}/generar-factura`, { method: 'POST' }),

  // Formas de Pago
  getPaymentMethods: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/formas-pago${query ? '?' + query : ''}`);
  },
  createPaymentMethod: (data) => fetchJson('/formas-pago', { method: 'POST', body: JSON.stringify(data) }),
  updatePaymentMethod: (id, data) => fetchJson(`/formas-pago/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  togglePaymentMethodStatus: (id, estado, extra = {}) => fetchJson(`/formas-pago/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado, ...extra }) }),

  // Cajas
  getCajas: () => fetchJson('/cajas'),
  getCajaActual: () => fetchJson('/cajas/actual'),
  aperturaCaja: (data) => fetchJson('/cajas/apertura', { method: 'POST', body: JSON.stringify(data) }),
  cierreCaja: (data) => fetchJson('/cajas/cierre', { method: 'POST', body: JSON.stringify(data) }),

  // Inventario & Kardex de Movimientos
  getInventoryMovements: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/inventario/movimientos${query ? '?' + query : ''}`);
  },
  getInventoryAlerts: () => fetchJson('/inventario/alertas'),
  createInventoryAdjustment: (data) => fetchJson('/inventario/ajuste', { method: 'POST', body: JSON.stringify(data) }),

  // Proveedores
  getProviders: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/proveedores${query ? '?' + query : ''}`);
  },
  getProvider: (id) => fetchJson(`/proveedores/${id}`),
  createProvider: (data) => fetchJson('/proveedores', { method: 'POST', body: JSON.stringify(data) }),
  updateProvider: (id, data) => fetchJson(`/proveedores/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleProviderStatus: (id, estado, extra = {}) => fetchJson(`/proveedores/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado, ...extra }) }),

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

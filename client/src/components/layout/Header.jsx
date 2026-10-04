import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import cajeroImg from '../../assets/img/cajero.webp';
import adminImg from '../../assets/img/admin.webp';
import superImg from '../../assets/img/super.webp';

const getRoleAvatar = (rol = '') => {
  const r = rol.toLowerCase();
  if (r.includes('super')) return superImg;
  if (r.includes('admin')) return adminImg;
  return cajeroImg;
};

export const Header = () => {
  const {
    searchQuery,
    setSearchQuery,
    openModal,
    showToast,
    setCurrentView,
    caja,
    currentUser,
    logout,
    products = [],
    clients = [],
    providers = [],
    invoices = [],
    openInvoiceModal,
    addToCart,
    openPurchaseModal
  } = useApp();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [dismissedIds, setDismissedIds] = useState([]);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);
  const searchContainerRef = useRef(null);

  // 1. Alertas dinámicas de stock mínimo / bajo
  const lowStockAlerts = useMemo(() => {
    return products
      .filter(p => (p.estado || 'ACTIVO').toUpperCase() === 'ACTIVO' && (p.stock !== undefined ? p.stock : 0) <= (p.stock_minimo || 5))
      .map(p => ({
        id: `low-stock-${p.id_producto}`,
        id_producto: p.id_producto,
        icon: 'warning',
        iconColor: p.stock === 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700',
        title: `Stock ${p.stock === 0 ? 'Agotado' : 'Bajo'}: ${p.nombre}`,
        desc: `Quedan solo ${p.stock} unid. en almacén (mínimo: ${p.stock_minimo || 5}) · SKU: ${p.codigo || 'N/A'}`,
        time: 'Alerta Activa',
        isStockAlert: true
      }));
  }, [products]);

  // Combinar alertas dinámicas con avisos de caja y sincronización
  const notifications = useMemo(() => {
    const defaultNotifs = [
      {
        id: 'notif-caja',
        icon: 'lock_open',
        iconColor: 'bg-emerald-50 text-emerald-600',
        title: 'Caja Operativa',
        desc: `Turno en curso con fondo de $${parseFloat(caja?.monto_inicial || 500).toFixed(2)}.`,
        time: 'En vivo',
        isStockAlert: false
      }
    ];
    return [...lowStockAlerts, ...defaultNotifs].filter(n => !dismissedIds.includes(n.id));
  }, [lowStockAlerts, caja, dismissedIds]);

  const dismissNotification = (id) => {
    setDismissedIds(prev => [...prev, id]);
    showToast('Notificación descartada');
  };

  const clearAllNotifications = () => {
    setDismissedIds(notifications.map(n => n.id));
    showToast('Notificaciones marcadas como leídas');
  };

  // 2. Resultados de Búsqueda Global (Productos, Clientes, Proveedores, Facturas)
  const q = searchQuery.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!q || q.length < 2) return null;

    const matchedProducts = products.filter(p =>
      p.nombre?.toLowerCase().includes(q) ||
      p.codigo?.toLowerCase().includes(q) ||
      p.categoria_nombre?.toLowerCase().includes(q)
    ).slice(0, 4);

    const matchedClients = clients.filter(c =>
      c.nombres?.toLowerCase().includes(q) ||
      c.apellidos?.toLowerCase().includes(q) ||
      c.numero_identificacion?.toLowerCase().includes(q) ||
      c.correo?.toLowerCase().includes(q)
    ).slice(0, 3);

    const matchedProviders = providers.filter(pr =>
      pr.nombre?.toLowerCase().includes(q) ||
      pr.identificacion?.toLowerCase().includes(q) ||
      pr.telefono?.includes(q)
    ).slice(0, 3);

    const matchedInvoices = invoices.filter(inv =>
      inv.numero_factura?.toLowerCase().includes(q) ||
      inv.cliente?.toLowerCase().includes(q) ||
      String(inv.id_venta || '').includes(q)
    ).slice(0, 3);

    const totalCount = matchedProducts.length + matchedClients.length + matchedProviders.length + matchedInvoices.length;
    return { products: matchedProducts, clients: matchedClients, providers: matchedProviders, invoices: matchedInvoices, totalCount };
  }, [q, products, clients, providers, invoices]);

  // Cerrar menús al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) setShowSearchDropdown(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-5 flex items-center justify-between gap-4 shrink-0 relative z-30">
      {/* Search and Shift Badge */}
      <div className="flex items-center gap-3 flex-1 max-w-lg relative" ref={searchContainerRef}>
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">
            search
          </span>
          <input
            id="global-search-input"
            type="text"
            className="w-full pl-8 pr-7 py-1.5 bg-slate-100 border border-transparent rounded-lg text-xs focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
            placeholder="Buscar productos, clientes, facturas o proveedores (F2)..."
            value={searchQuery}
            onFocus={() => setShowSearchDropdown(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
          />
          {searchQuery && (
            <button
              id="btn-clear-search"
              onClick={() => {
                setSearchQuery('');
                setShowSearchDropdown(false);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xs">close</span>
            </button>
          )}

          {/* Desplegable de Resultados de Búsqueda Global */}
          {showSearchDropdown && searchResults && (
            <div className="absolute left-0 right-0 top-10 bg-white rounded-xl shadow-2xl border border-slate-200 py-2.5 px-3 z-50 text-xs max-h-96 overflow-y-auto animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 text-[11px] text-slate-500">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-blue-600">travel_explore</span>
                  Resultados globales ({searchResults.totalCount})
                </span>
                <span className="text-[10px] text-slate-400">Presiona un ítem para abrir</span>
              </div>

              {searchResults.totalCount === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  No se encontraron coincidencias para "{q}"
                </div>
              ) : (
                <div className="space-y-3">
                  {/* 1. Productos */}
                  {searchResults.products.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        📦 Productos ({searchResults.products.length})
                      </span>
                      <div className="space-y-1">
                        {searchResults.products.map(p => (
                          <div
                            key={p.id_producto}
                            onClick={() => {
                              setCurrentView('stock');
                              setShowSearchDropdown(false);
                            }}
                            className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-blue-600 text-base">devices</span>
                              <div>
                                <span className="font-semibold text-slate-800 text-[11.5px] block">{p.nombre}</span>
                                <span className="text-[10px] text-slate-400">SKU: {p.codigo} · {p.categoria_nombre}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-bold text-slate-900">${parseFloat(p.precio_venta).toFixed(2)}</span>
                              <span className={`block text-[10px] ${p.stock <= (p.stock_minimo || 5) ? 'text-amber-600 font-bold' : 'text-slate-500'}`}>
                                Stock: {p.stock}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. Facturas */}
                  {searchResults.invoices.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        🧾 Facturas &amp; Ventas ({searchResults.invoices.length})
                      </span>
                      <div className="space-y-1">
                        {searchResults.invoices.map(inv => (
                          <div
                            key={inv.id_venta}
                            onClick={() => {
                              openInvoiceModal(inv);
                              setShowSearchDropdown(false);
                            }}
                            className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-emerald-600 text-base">receipt_long</span>
                              <div>
                                <span className="font-bold text-slate-800 text-[11.5px] font-mono">{inv.numero_factura}</span>
                                <span className="text-[10px] text-slate-500 block">Cliente: {inv.cliente}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-bold text-slate-900">${parseFloat(inv.total).toFixed(2)}</span>
                              <span className="block text-[10px] text-slate-400">{inv.metodo || 'Efectivo'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Clientes */}
                  {searchResults.clients.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        👥 Clientes ({searchResults.clients.length})
                      </span>
                      <div className="space-y-1">
                        {searchResults.clients.map(c => (
                          <div
                            key={c.id_cliente}
                            onClick={() => {
                              setCurrentView('clientes');
                              setShowSearchDropdown(false);
                            }}
                            className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-purple-600 text-base">person</span>
                              <div>
                                <span className="font-semibold text-slate-800 text-[11.5px]">{c.nombres} {c.apellidos}</span>
                                <span className="text-[10px] text-slate-400 block">{c.tipo_identificacion}: {c.numero_identificacion}</span>
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-500">{c.telefono || c.correo}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. Proveedores */}
                  {searchResults.providers.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        🏢 Proveedores ({searchResults.providers.length})
                      </span>
                      <div className="space-y-1">
                        {searchResults.providers.map(pr => (
                          <div
                            key={pr.id_proveedor}
                            onClick={() => {
                              setCurrentView('compras');
                              setShowSearchDropdown(false);
                            }}
                            className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-amber-600 text-base">store</span>
                              <div>
                                <span className="font-semibold text-slate-800 text-[11.5px]">{pr.nombre}</span>
                                <span className="text-[10px] text-slate-400 block">{pr.identificacion}</span>
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-500">{pr.telefono}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => openModal('turno')}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200 text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          {currentUser ? `Caja 01 · ${currentUser.nombre_completo || currentUser.nombre}` : 'Caja 01 - Turno Mañana'}
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 relative">
        {/* Atajos F1-F12 */}
        <button
          onClick={() => openModal('shortcuts')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold transition-colors shadow-xs"
        >
          <span className="material-symbols-outlined text-base text-slate-700">keyboard</span>
          <span className="hidden md:inline">Atajos de teclado</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            id="btn-notifications"
            onClick={(e) => {
              e.stopPropagation();
              setShowNotifs(!showNotifs);
              setShowUserMenu(false);
            }}
            className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            {notifications.length > 0 && (
              <span
                id="badge-notif"
                className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs"
              >
                {notifications.length}
              </span>
            )}
          </button>

          {showNotifs && (
            <div
              id="popover-notifs"
              className="absolute right-0 top-11 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 py-2.5 px-3 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-blue-600 text-base">notifications_active</span>
                  Notificaciones
                </span>
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-[11px] text-blue-600 hover:underline font-semibold"
                  >
                    Marcar leídas
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto" id="notif-items-list">
                {notifications.length === 0 ? (
                  <div className="p-3 text-center text-slate-400 text-xs">
                    No hay notificaciones pendientes.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`py-2 px-1.5 flex items-start gap-2.5 rounded-lg transition-colors ${notif.isStockAlert ? 'hover:bg-amber-50/70 cursor-pointer' : ''}`}
                      onClick={() => {
                        if (notif.isStockAlert) {
                          const prod = products.find(p => p.id_producto === notif.id_producto);
                          if (prod) {
                            openPurchaseModal(prod);
                          } else {
                            setCurrentView('stock');
                          }
                          setShowNotifs(false);
                        }
                      }}
                    >
                      <div
                        className={`w-6 h-6 rounded-full ${notif.iconColor} flex items-center justify-center shrink-0 mt-0.5`}
                      >
                        <span className="material-symbols-outlined text-sm">{notif.icon}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-slate-800 text-[11px]">{notif.title}</p>
                          {notif.isStockAlert && (
                            <span className="px-1.5 py-0.2 bg-amber-200 text-amber-900 text-[9px] font-bold rounded">Bajo</span>
                          )}
                        </div>
                        <p className="text-slate-500 text-[10px]">{notif.desc}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[9px] text-slate-400">{notif.time}</span>
                          {notif.isStockAlert && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const prod = products.find(p => p.id_producto === notif.id_producto);
                                if (prod) openPurchaseModal(prod);
                                setShowNotifs(false);
                              }}
                              className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                            >
                              <span className="material-symbols-outlined text-[11px]">add_shopping_cart</span>
                              Reponer Stock
                            </button>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissNotification(notif.id);
                        }}
                        className="text-slate-300 hover:text-slate-600 cursor-pointer p-0.5"
                        title="Descartar"
                      >
                        <span className="material-symbols-outlined text-xs">close</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 mx-1"></div>

        {/* User Profile Popover */}
        <div className="relative" ref={userMenuRef}>
          <div
            className="flex items-center gap-2.5 pl-1.5 pr-2 py-1 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors border border-transparent hover:border-slate-200"
            onClick={(e) => {
              e.stopPropagation();
              setShowUserMenu(!showUserMenu);
              setShowNotifs(false);
            }}
          >
            <img
              className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-600/20"
              src={getRoleAvatar(currentUser.rol)}
              alt={currentUser.rol}
            />
            <div className="hidden sm:flex flex-col text-left leading-tight">
              <span className="text-xs font-bold text-slate-900">{currentUser.nombre}</span>
              <span className="text-[10px] text-blue-600 font-semibold">{currentUser.rol}</span>
            </div>
            <span className="material-symbols-outlined text-slate-400 text-base">expand_more</span>
          </div>

          {showUserMenu && (
            <div
              id="popover-user-menu"
              className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-3">
                <img
                  src={getRoleAvatar(currentUser.rol)}
                  alt={currentUser.rol}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-100 shrink-0"
                />
                <div>
                  <p className="font-bold text-slate-800">{currentUser.nombre}</p>
                  <p className="text-[10px] text-slate-400">{currentUser.correo}</p>
                  <span className="inline-block mt-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 font-semibold text-[9px] rounded">
                    Rol: {currentUser.rol}
                  </span>
                </div>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    setCurrentView('empleados');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                >
                  <span className="material-symbols-outlined text-sm text-slate-400">badge</span>
                  Mi Perfil &amp; Empleados
                </button>
                <button
                  onClick={() => {
                    openModal('turno');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                >
                  <span className="material-symbols-outlined text-sm text-slate-400">swap_horiz</span>
                  Estado / Cambio de Turno
                </button>
                <button
                  onClick={() => {
                    showToast('Impresora térmica y balanza calibradas', 'settings');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                >
                  <span className="material-symbols-outlined text-sm text-slate-400">settings</span>
                  Ajustes de Periféricos
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1 mt-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-semibold transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

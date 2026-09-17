import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export const Header = () => {
  const {
    searchQuery,
    setSearchQuery,
    openModal,
    showToast,
    setCurrentView,
    caja,
    currentUser,
    logout
  } = useApp();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      icon: 'inventory_2',
      iconColor: 'bg-amber-50 text-amber-600',
      title: 'Stock bajo: Arroz Superior 1kg',
      desc: 'Quedan solo 3 unidades en almacén central.',
      time: 'Hace 15 min'
    },
    {
      id: 'notif-2',
      icon: 'lock_open',
      iconColor: 'bg-emerald-50 text-emerald-600',
      title: 'Apertura de turno exitosa',
      desc: `Turno Mañana iniciado con fondo de $${caja?.monto_inicial || '150.00'}.`,
      time: '08:00 AM'
    },
    {
      id: 'notif-3',
      icon: 'sync',
      iconColor: 'bg-blue-50 text-blue-600',
      title: 'Sincronización PostgreSQL activa',
      desc: 'Base de datos tienda_tecnologia lista.',
      time: '07:55 AM'
    }
  ]);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    showToast('Notificación descartada');
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    showToast('Notificaciones marcadas como leídas');
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-5 flex items-center justify-between gap-4 shrink-0 relative z-20">
      {/* Search and Shift Badge */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">
            search
          </span>
          <input
            id="global-search-input"
            type="text"
            className="w-full pl-8 pr-7 py-1.5 bg-slate-100 border-none rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            placeholder="Búsqueda rápida en el sistema (F2)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              id="btn-clear-search"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <span className="material-symbols-outlined text-xs">close</span>
            </button>
          )}
        </div>

        <button
          onClick={() => openModal('turno')}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200 text-[11px] font-semibold whitespace-nowrap transition-colors"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Caja 01 - Turno Mañana
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
                    <div key={notif.id} className="py-2 flex items-start gap-2.5">
                      <div
                        className={`w-6 h-6 rounded-full ${notif.iconColor} flex items-center justify-center shrink-0 mt-0.5`}
                      >
                        <span className="material-symbols-outlined text-sm">{notif.icon}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800 text-[11px]">{notif.title}</p>
                        <p className="text-slate-500 text-[10px]">{notif.desc}</p>
                        <span className="text-[9px] text-slate-400">{notif.time}</span>
                      </div>
                      <button
                        onClick={() => dismissNotification(notif.id)}
                        className="text-slate-300 hover:text-slate-600"
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
              src={currentUser.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80"}
              alt={currentUser.nombre}
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
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="font-bold text-slate-800">{currentUser.nombre}</p>
                <p className="text-[10px] text-slate-400">{currentUser.correo}</p>
                <span className="inline-block mt-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 font-semibold text-[9px] rounded">
                  Rol: {currentUser.rol}
                </span>
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

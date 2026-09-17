import React from 'react';
import { useApp } from '../../context/AppContext';

export const Sidebar = () => {
  const { currentView, setCurrentView, openModal, showToast } = useApp();

  const isCurrent = (view) => currentView === view;

  const getNavBtnClass = (view) =>
    `nav-btn w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium transition-all ${
      isCurrent(view)
        ? 'bg-blue-600 text-white shadow-xs'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  const handleNav = (view, label) => {
    setCurrentView(view);
    showToast(`Módulo: ${label}`, 'tab');
  };

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col shrink-0 z-30 shadow-xs">
      {/* Brand Header */}
      <div
        className="h-14 px-4 flex items-center gap-2.5 border-b border-slate-100 cursor-pointer select-none"
        onClick={() => handleNav('pos', 'POS')}
      >
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs font-bold">
          <span className="material-symbols-outlined text-lg">point_of_sale</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900 tracking-tight leading-none">
            Nex<span className="text-blue-600">POS</span>
          </span>
          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
            RETAIL SUITE &amp; ERP
          </span>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-3.5 text-xs">
        {/* Operaciones */}
        <div>
          <span className="px-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Operaciones
          </span>
          <div className="space-y-0.5">
            <button
              className={getNavBtnClass('pos')}
              id="nav-pos"
              onClick={() => handleNav('pos', 'POS')}
            >
              <span className="material-symbols-outlined text-base">point_of_sale</span>
              <span>Terminal POS</span>
            </button>
            <button
              className={getNavBtnClass('caja')}
              id="nav-caja"
              onClick={() => handleNav('caja', 'CAJA')}
            >
              <span className="material-symbols-outlined text-base">payments</span>
              <span>Control de Caja</span>
            </button>
            <button
              className={getNavBtnClass('facturacion')}
              id="nav-facturacion"
              onClick={() => handleNav('facturacion', 'FACTURACIÓN')}
            >
              <span className="material-symbols-outlined text-base">receipt_long</span>
              <span>Facturación e Historial</span>
            </button>
          </div>
        </div>

        {/* Inventario y Compras */}
        <div>
          <span className="px-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Inventario y Compras
          </span>
          <div className="space-y-0.5">
            <button
              className={getNavBtnClass('stock')}
              id="nav-stock"
              onClick={() => handleNav('stock', 'STOCK')}
            >
              <span className="material-symbols-outlined text-base">inventory_2</span>
              <span>Catálogo &amp; Stock</span>
            </button>
            <button
              className={getNavBtnClass('compras')}
              id="nav-compras"
              onClick={() => handleNav('compras', 'COMPRAS')}
            >
              <span className="material-symbols-outlined text-base">local_shipping</span>
              <span>Compras &amp; Proveedores</span>
            </button>
          </div>
        </div>

        {/* Gestión Comercial */}
        <div>
          <span className="px-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Gestión Comercial
          </span>
          <div className="space-y-0.5">
            <button
              className={getNavBtnClass('clientes')}
              id="nav-clientes"
              onClick={() => handleNav('clientes', 'CLIENTES')}
            >
              <span className="material-symbols-outlined text-base">group</span>
              <span>Clientes</span>
            </button>
          </div>
        </div>

        {/* Administración */}
        <div>
          <span className="px-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Administración
          </span>
          <div className="space-y-0.5">
            <button
              className={getNavBtnClass('empleados')}
              id="nav-empleados"
              onClick={() => handleNav('empleados', 'EMPLEADOS')}
            >
              <span className="material-symbols-outlined text-base">badge</span>
              <span>Empleados &amp; Permisos</span>
            </button>
            <button
              className={getNavBtnClass('auditoria')}
              id="nav-auditoria"
              onClick={() => handleNav('auditoria', 'AUDITORÍA')}
            >
              <span className="material-symbols-outlined text-base">history_toggle_off</span>
              <span>Auditoría del Sistema</span>
            </button>
          </div>
        </div>
      </div>

      {/* Terminal Footer */}
      <div className="p-2.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px]">
        <div
          className="flex items-center gap-1.5 cursor-pointer hover:opacity-80"
          onClick={() => openModal('turno')}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-slate-700">Terminal 01</span>
        </div>
        <span className="text-slate-400">v4.8.2</span>
      </div>
    </aside>
  );
};

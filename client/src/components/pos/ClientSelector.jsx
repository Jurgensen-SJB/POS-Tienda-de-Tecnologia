import React from 'react';
import { useApp } from '../../context/AppContext';

export const ClientSelector = () => {
  const { currentClient, setCurrentClient, openModal, showToast } = useApp();

  const hasClient = Boolean(currentClient && currentClient.id_cliente && currentClient.id_cliente !== 1);

  return (
    <div
      className={`p-2.5 rounded-xl border shadow-xs flex items-center justify-between shrink-0 transition-colors ${
        hasClient
          ? 'bg-white border-slate-200'
          : 'bg-amber-50/70 border-amber-300'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
            hasClient ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-100 text-amber-700'
          }`}
        >
          <span className="material-symbols-outlined text-base">
            {hasClient ? 'verified_user' : 'person_alert'}
          </span>
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-xs font-bold truncate block ${
                hasClient ? 'text-slate-800' : 'text-amber-900'
              }`}
              id="client-name-display"
            >
              {hasClient ? currentClient.name : 'Seleccionar Cliente Registrado'}
            </span>
            <span
              className={`px-1.5 py-0.5 text-[9px] font-bold rounded shrink-0 flex items-center gap-0.5 ${
                hasClient
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
              id="client-badge-status"
            >
              {hasClient ? 'Verificado ✓' : 'Obligatorio'}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 truncate mt-0.5" id="client-doc-display">
            {hasClient
              ? `${currentClient.doc}${currentClient.correo ? ` • ${currentClient.correo}` : ''}`
              : 'Requerido: No se permiten ventas sin registro'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {hasClient && (
          <button
            onClick={() => {
              setCurrentClient(null);
              showToast('Cliente desasignado del ticket', 'person_remove');
            }}
            title="Quitar cliente asignado"
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 flex items-center justify-center transition-colors border border-slate-200 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        )}
        <button
          className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer ${
            hasClient
              ? 'text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200'
              : 'text-white bg-blue-600 hover:bg-blue-700 border-blue-600 shadow-xs'
          }`}
          onClick={() => openModal('client')}
        >
          <span className="material-symbols-outlined text-xs">
            {hasClient ? 'swap_horiz' : 'person_search'}
          </span>
          {hasClient ? 'Cambiar' : 'Asignar'}
        </button>
      </div>
    </div>
  );
};

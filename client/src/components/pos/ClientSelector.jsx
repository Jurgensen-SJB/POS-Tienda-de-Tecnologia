import React from 'react';
import { useApp } from '../../context/AppContext';

export const ClientSelector = () => {
  const { currentClient, assignClient, openModal, showToast } = useApp();

  const isDefault = currentClient.name === 'Consumidor Final';

  return (
    <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
          <span className="material-symbols-outlined text-base">person</span>
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-800 truncate block" id="client-name-display">
              {currentClient.name}
            </span>
            <span
              className={`px-1.5 py-0.5 text-[9px] font-semibold rounded shrink-0 ${
                isDefault ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-700'
              }`}
              id="client-badge-status"
            >
              {isDefault ? 'Sin Registro' : 'Registrado'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 truncate mt-0.5" id="client-doc-display">
            {currentClient.doc}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {!isDefault && (
          <button
            onClick={() => {
              assignClient('Consumidor Final', 'DNI/RUC: Sin registrar', 1);
              showToast('Cliente: Consumidor Final (Sin registro)', 'person');
            }}
            title="Restablecer a Consumidor Final"
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors border border-slate-200"
          >
            <span className="material-symbols-outlined text-sm">person_off</span>
          </button>
        )}
        <button
          className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors whitespace-nowrap flex items-center gap-1"
          onClick={() => openModal('client')}
        >
          <span className="material-symbols-outlined text-xs">swap_horiz</span> Cambiar
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { useApp } from '../../context/AppContext';

export const AccessRestrictedView = ({ requiredPermiso, moduleName }) => {
  const { currentUser, setCurrentView } = useApp();

  return (
    <div className="h-full flex items-center justify-center p-6 select-none">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-8 shadow-sm text-center flex flex-col items-center">
        {/* Shield Lock Icon */}
        <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 mb-4">
          <span className="material-symbols-outlined text-3xl">shield_lock</span>
        </div>

        <h3 className="text-base font-bold text-slate-900 tracking-tight mb-1">
          Acceso Restringido
        </h3>

        <p className="text-xs text-slate-500 mb-4 max-w-xs">
          Tu cuenta con rol <span className="font-semibold text-slate-700">{currentUser?.rol || currentUser?.cargo || 'Usuario'}</span> no posee los privilegios requeridos para consultar el módulo de <span className="font-semibold text-slate-700">{moduleName || 'este recurso'}</span>.
        </p>

        {requiredPermiso && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[11px] text-slate-600 mb-6 font-mono">
            Permiso requerido: <span className="font-bold text-slate-800">{requiredPermiso}</span>
          </div>
        )}

        <button
          onClick={() => setCurrentView('pos')}
          className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">point_of_sale</span>
          Volver al Terminal POS
        </button>
      </div>
    </div>
  );
};

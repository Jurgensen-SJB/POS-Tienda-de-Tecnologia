import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const DeactivateClientModal = () => {
  const { activeModal, closeModal, clientToDeactivate, toggleClientStatusConfirmed } = useApp();
  const [loading, setLoading] = useState(false);

  if (activeModal !== 'deactivate-client' || !clientToDeactivate) return null;

  const isActive = (clientToDeactivate.estado || 'ACTIVO').toUpperCase() === 'ACTIVO';
  const actionText = isActive ? 'Desactivar' : 'Activar';
  const fullName = `${clientToDeactivate.nombres} ${clientToDeactivate.apellidos || ''}`.trim();

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await toggleClientStatusConfirmed();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-5 space-y-4">
        {/* Top icon and warning */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
            isActive ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
          }`}>
            <span className="material-symbols-outlined text-lg">
              {isActive ? 'person_off' : 'how_to_reg'}
            </span>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              ¿{actionText} cliente?
            </h3>
            <p className="text-[11px] text-slate-400">
              {clientToDeactivate.tipo_identificacion}: {clientToDeactivate.numero_identificacion}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {isActive ? (
            <>
              El cliente <span className="font-semibold text-slate-800">{fullName}</span> pasará a estado <span className="font-semibold text-amber-700">INACTIVO</span> y no podrá ser seleccionado para nuevas ventas ni emisión de comprobantes en el Terminal POS.
            </>
          ) : (
            <>
              El cliente <span className="font-semibold text-slate-800">{fullName}</span> será reactivado a estado <span className="font-semibold text-emerald-700">ACTIVO</span> y quedará disponible inmediatamente en el sistema.
            </>
          )}
        </p>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={closeModal}
            disabled={loading}
            className="px-3.5 py-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg font-semibold text-xs transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`px-4 py-1.5 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 ${
              isActive
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            <span className="material-symbols-outlined text-xs">
              {isActive ? 'person_off' : 'check'}
            </span>
            {loading ? 'Procesando...' : `Confirmar y ${actionText.toLowerCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
};

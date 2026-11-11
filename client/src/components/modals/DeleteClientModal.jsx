import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const DeleteClientModal = () => {
  const { activeModal, closeModal, clientToDelete, deleteClientConfirmed } = useApp();
  const [loading, setLoading] = useState(false);

  if (activeModal !== 'delete-client' || !clientToDelete) return null;

  const fullName = `${clientToDelete.nombres} ${clientToDelete.apellidos || ''}`.trim();

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await deleteClientConfirmed();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-lg">delete_forever</span>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">¿Eliminar cliente permanentemente?</h3>
            <p className="text-[11px] text-slate-400 font-mono">
              {clientToDelete.tipo_identificacion || 'CC'}: {clientToDelete.numero_identificacion}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Se eliminará de forma definitiva el registro del cliente{' '}
          <strong className="text-slate-800">{fullName}</strong> del directorio del sistema. Esta acción no se puede deshacer.
        </p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={closeModal}
            disabled={loading}
            className="px-3.5 py-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <span className="material-symbols-outlined text-xs">delete</span>
            {loading ? 'Eliminando...' : 'Sí, Eliminar Cliente'}
          </button>
        </div>
      </div>
    </div>
  );
};


import React from 'react';
import { useApp } from '../../context/AppContext';

export const ShortcutsModal = () => {
  const { activeModal, closeModal } = useApp();

  if (activeModal !== 'shortcuts') return null;

  const shortcuts = [
    { label: 'Cobrar e Imprimir', key: 'F12', color: 'text-blue-600' },
    { label: 'Búsqueda rápida', key: 'F2', color: 'text-blue-600' },
    { label: 'Descuento Promo', key: 'F4', color: 'text-blue-600' },
    { label: 'Anular Ticket / Salir', key: 'ESC', color: 'text-rose-600' },
    { label: 'Estado / Cambio Turno', key: 'F7', color: 'text-slate-700' },
    { label: 'Ítem Manual', key: 'F9', color: 'text-slate-700' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl mx-4 space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 text-xl">keyboard</span>
            <h3 className="font-bold text-slate-900 text-sm">Atajos de Teclado del Terminal</h3>
          </div>
          <button className="text-slate-400 hover:text-slate-600" onClick={closeModal}>
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {shortcuts.map((sc, idx) => (
            <div
              key={idx}
              className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between"
            >
              <span className="text-slate-600">{sc.label}</span>
              <kbd
                className={`px-2 py-0.5 bg-white rounded border border-slate-300 font-mono font-bold shadow-xs ${sc.color}`}
              >
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-1">
          <button
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
            onClick={closeModal}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

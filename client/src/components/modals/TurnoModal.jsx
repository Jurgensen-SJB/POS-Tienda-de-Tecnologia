import React from 'react';
import { useApp } from '../../context/AppContext';

export const TurnoModal = () => {
  const { activeModal, closeModal, caja, setCurrentView, showToast } = useApp();

  if (activeModal !== 'turno') return null;

  const montoInicial = parseFloat(caja?.monto_inicial || 150).toFixed(2);
  const totalEnCaja = parseFloat(caja?.total_en_caja || 946.09).toFixed(2);
  const ticketsCount = caja?.ventas_completadas || 85;

  const handleCierreZ = () => {
    showToast('Generando reporte Z de cierre...', 'lock');
    closeModal();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl mx-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="font-bold text-slate-900 text-sm">Estado de Caja 01 - Turno Mañana</h3>
          </div>
          <button className="text-slate-400 hover:text-slate-600" onClick={closeModal}>
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Cajero Activo:</span>
              <span className="font-bold text-slate-800">{caja?.cajero || 'Elena Morales'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Apertura:</span>
              <span className="font-mono text-slate-800 font-semibold">08:00 AM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Fondo Inicial:</span>
              <span className="font-mono text-slate-800 font-semibold">${montoInicial}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Efectivo en Gaveta:</span>
              <span className="font-mono text-emerald-600 font-bold">${totalEnCaja}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tickets Emitidos:</span>
              <span className="font-bold text-slate-800" id="turno-ticket-count">{ticketsCount}</span>
            </div>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold">
            Gaveta física cuadrada al 100% sin faltantes ni sobrantes.
          </p>
        </div>

        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <button
            className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            onClick={() => {
              setCurrentView('caja');
              closeModal();
            }}
          >
            Ver Detalle Caja
          </button>
          <button
            className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
            onClick={handleCierreZ}
          >
            Cierre Definitivo (Z)
          </button>
        </div>
      </div>
    </div>
  );
};

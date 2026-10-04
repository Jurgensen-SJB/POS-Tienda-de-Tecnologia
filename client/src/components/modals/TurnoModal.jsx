import React from 'react';
import { useApp } from '../../context/AppContext';

export const TurnoModal = () => {
  const { activeModal, closeModal, openModal, caja, invoices, currentUser, setCurrentView } = useApp();

  if (activeModal !== 'turno') return null;

  const isAdmin = Boolean(currentUser?.rol?.toLowerCase().includes('admin'));
  
  const cajeroActivo = currentUser 
    ? (currentUser.nombre_completo || currentUser.nombre) 
    : (caja?.cajero || 'Camila Valenzuela');

  const cajeroCargo = currentUser?.cargo || currentUser?.rol || 'Cajero';

  // Si no es admin, mostrar únicamente las ventas del cajero autenticado
  const userInvoices = invoices.filter(inv => {
    if (isAdmin) return true;
    if (inv.id_usuario) return String(inv.id_usuario) === String(currentUser?.id_usuario);
    if (inv.cajero) return inv.cajero.toLowerCase().includes((currentUser?.nombre || '').toLowerCase());
    return false;
  }).filter(inv => inv.estado !== 'ANULADA');

  const userCash = userInvoices
    .filter(inv => (inv.metodo || '').toLowerCase().includes('efectivo'))
    .reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);

  const fondoInicial = isAdmin 
    ? parseFloat(caja?.monto_inicial || 500).toFixed(2) 
    : '150.00';

  const totalEnCaja = (parseFloat(fondoInicial) + userCash).toFixed(2);
  const ticketsCount = userInvoices.length;

  const handleCierreZ = () => {
    closeModal();
    setTimeout(() => {
      openModal('cierre-z');
    }, 150);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl mx-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="font-bold text-slate-900 text-sm">
              {isAdmin ? 'Auditoría de Caja - Consolidado' : 'Estado de Turno Individual'}
            </h3>
          </div>
          <button className="text-slate-400 hover:text-slate-600 cursor-pointer" onClick={closeModal}>
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Cajero Activo:</span>
              <span className="font-bold text-slate-800">{cajeroActivo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cargo / Rol:</span>
              <span className="font-semibold text-slate-700">{cajeroCargo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Apertura:</span>
              <span className="font-mono text-slate-800 font-semibold">08:00 AM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Fondo Inicial:</span>
              <span className="font-mono text-slate-800 font-semibold">${fondoInicial}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Efectivo en Gaveta:</span>
              <span className="font-mono text-emerald-600 font-bold">${totalEnCaja}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Comprobantes Emitidos:</span>
              <span className="font-bold text-slate-800" id="turno-ticket-count">{ticketsCount} ventas</span>
            </div>
          </div>
          
          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">check_circle</span>
            {isAdmin ? 'Gaveta consolidada cuadrada al 100%.' : 'Gaveta de cajero cuadrada al 100%.'}
          </p>
        </div>

        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <button
            className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            onClick={() => {
              setCurrentView('caja');
              closeModal();
            }}
          >
            Ver Detalle Caja
          </button>
          <button
            className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 border border-slate-900 cursor-pointer shadow-xs"
            onClick={handleCierreZ}
          >
            <span className="material-symbols-outlined text-sm text-amber-400">lock</span>
            Cierre Definitivo (Z)
          </button>
        </div>
      </div>
    </div>
  );
};

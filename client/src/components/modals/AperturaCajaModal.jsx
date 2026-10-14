import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/api';
import { formatCOP } from '../../utils/format';

export const AperturaCajaModal = () => {
  const {
    activeModal,
    closeModal,
    currentUser,
    showToast,
    loadData,
    setCaja,
  } = useApp();

  const [montoInicial, setMontoInicial] = useState('200000');
  const [isLoading, setIsLoading] = useState(false);

  const isVisible = activeModal === 'apertura-caja';

  // Reset state when modal opens
  useEffect(() => {
    if (isVisible) {
      setMontoInicial('200000');
      setIsLoading(false);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const cajeroNombre = currentUser?.nombre_completo || currentUser?.nombre || 'Cajero';
  const cajeroRol = currentUser?.cargo || currentUser?.rol || 'Cajero';
  const now = new Date();
  const horaActual = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  const fechaActual = now.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const handleApertura = async () => {
    const monto = parseFloat(montoInicial);
    if (isNaN(monto) || monto < 0) {
      showToast('Ingresa un monto inicial válido', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const nuevaCaja = await api.aperturaCaja({
        monto_inicial: monto,
        id_usuario_apertura: currentUser?.id_usuario || 1,
      });

      if (nuevaCaja) setCaja(nuevaCaja);
      closeModal();
      showToast(`Apertura de turno registrada con fondo de ${formatCOP(monto)}`, 'lock_open');

      // Reload caja data
      if (loadData) loadData();
    } catch (err) {
      showToast('Error al abrir caja: ' + (err.message || 'Intenta de nuevo'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    closeModal();
    showToast('Puedes abrir la caja después desde "Control de Caja"', 'info');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl flex flex-col overflow-hidden border border-slate-200">

        {/* Header - Same style as CierreZ and other modals */}
        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-400 text-lg">lock_open</span>
            <div>
              <h3 className="font-bold text-xs">Apertura de Turno de Caja</h3>
              <p className="text-[10px] text-slate-400">
                Configura el fondo inicial para iniciar operaciones
              </p>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Info banner */}
        <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center gap-2 shrink-0">
          <span className="material-symbols-outlined text-amber-600 text-sm">info</span>
          <p className="text-[11px] text-amber-800 font-medium">
            No hay caja abierta. Registra la apertura para comenzar a vender.
          </p>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3.5">
          {/* Cajero info */}
          <div className="p-2.5 bg-slate-50 rounded-lg text-[11px] space-y-1 border border-slate-100">
            <div className="flex justify-between">
              <span className="text-slate-500">Cajero Responsable:</span>
              <strong className="text-slate-800">{cajeroNombre}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cargo:</span>
              <span className="text-slate-700 font-semibold">{cajeroRol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Fecha:</span>
              <span className="text-slate-700 font-semibold capitalize">{fechaActual}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Hora de Inicio:</span>
              <span className="font-mono text-slate-700 font-semibold">{horaActual}</span>
            </div>
          </div>

          {/* Monto inicial input */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Monto Fondo Inicial en Efectivo (COP)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">$</span>
              <input
                type="number"
                step="any"
                min="0"
                value={montoInicial}
                onChange={(e) => setMontoInicial(e.target.value)}
                className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="200000"
                autoFocus
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Monto base en pesos colombianos para sencillo y cambio en gaveta al inicio del turno.
            </p>
          </div>

          {/* Quick amount buttons */}
          <div className="flex gap-1.5 flex-wrap">
            {[50000, 100000, 150000, 200000, 300000, 500000].map((monto) => (
              <button
                key={monto}
                onClick={() => setMontoInicial(String(monto))}
                className={`flex-1 min-w-[55px] py-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer border ${
                  parseFloat(montoInicial) === monto
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                ${(monto / 1000)}k
              </button>
            ))}
          </div>

          {/* Resumen */}
          <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-emerald-700 font-semibold">Fondo Inicial a Registrar:</span>
              <span className="font-mono text-emerald-800 font-extrabold text-sm">
                {formatCOP(montoInicial)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex gap-2 p-4 pt-0">
          <button
            onClick={handleSkip}
            className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Omitir
          </button>
          <button
            disabled={isLoading || !montoInicial || parseFloat(montoInicial) < 0}
            onClick={handleApertura}
            className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-1"
          >
            {isLoading ? (
              'Registrando...'
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">lock_open</span>
                Confirmar Apertura
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

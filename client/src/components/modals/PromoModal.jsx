import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const PromoModal = () => {
  const { activeModal, closeModal, applyDiscount } = useApp();
  const [customPct, setCustomPct] = useState('');

  if (activeModal !== 'promo') return null;

  const handleCustomApply = () => {
    const val = parseFloat(customPct);
    if (!isNaN(val) && val >= 0 && val <= 100) {
      applyDiscount(val, `Descuento Especial (-${val}%):`);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl mx-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-emerald-600 text-xl">percent</span>
            <h3 className="font-bold text-slate-900 text-sm">Aplicar Descuento o Promoción (F4)</h3>
          </div>
          <button className="text-slate-400 hover:text-slate-600" onClick={closeModal}>
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <span className="font-semibold text-slate-700 block">Promociones Rápidas:</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              className="p-2 text-left rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-colors"
              onClick={() => applyDiscount(5, 'Descuento Promoción (-5%):')}
            >
              <div className="font-bold text-slate-800 text-xs">Promo General</div>
              <div className="text-emerald-600 font-bold text-[11px]">-5% en total</div>
            </button>
            <button
              className="p-2 text-left rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-colors"
              onClick={() => applyDiscount(10, 'Martes Especial (-10%):')}
            >
              <div className="font-bold text-slate-800 text-xs">Martes 10% OFF</div>
              <div className="text-emerald-600 font-bold text-[11px]">-10% en total</div>
            </button>
            <button
              className="p-2 text-left rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-colors"
              onClick={() => applyDiscount(15, 'Cliente Frecuente (-15%):')}
            >
              <div className="font-bold text-slate-800 text-xs">Cliente VIP</div>
              <div className="text-emerald-600 font-bold text-[11px]">-15% en total</div>
            </button>
            <button
              className="p-2 text-left rounded-lg border border-slate-200 hover:border-rose-400 hover:bg-rose-50/50 transition-colors"
              onClick={() => applyDiscount(0, 'Sin descuento (0%):')}
            >
              <div className="font-bold text-slate-800 text-xs">Quitar Descuento</div>
              <div className="text-slate-400 font-semibold text-[11px]">0%</div>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="font-semibold text-slate-700 block mb-1">Porcentaje Manual:</label>
            <div className="flex gap-2">
              <input
                className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                id="input-custom-promo"
                max="100"
                min="0"
                placeholder="Ej. 20"
                type="number"
                value={customPct}
                onChange={(e) => setCustomPct(e.target.value)}
              />
              <button
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors"
                onClick={handleCustomApply}
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

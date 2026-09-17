import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export const PaymentPanel = () => {
  const {
    subtotal,
    discountAmount,
    discountLabel,
    tax,
    grandTotal,
    payMethod,
    setPayMethod,
    cashReceived,
    setCashReceived,
    vuelto,
    executeCheckout,
    showToast
  } = useApp();

  // Set default cash received if empty and cash selected
  useEffect(() => {
    if (payMethod === 'cash' && (!cashReceived || parseFloat(cashReceived) < grandTotal)) {
      if (grandTotal > 0) {
        setCashReceived(grandTotal > 100 ? (Math.ceil(grandTotal / 50) * 50).toFixed(2) : '100.00');
      }
    }
  }, [grandTotal, payMethod]);

  const setMontoPreset = (val) => {
    setCashReceived(val.toFixed(2));
    showToast(`Monto recibido: $${val.toFixed(2)}`);
  };

  const setMontoExacto = () => {
    setCashReceived(grandTotal.toFixed(2));
    showToast('Cobro de monto exacto');
  };

  return (
    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-2 shrink-0">
      {/* Financial breakdown */}
      <div className="space-y-0.5 text-xs">
        <div className="flex justify-between text-slate-500">
          <span>Subtotal Bruto:</span>
          <span className="font-semibold text-slate-800 font-mono" id="subtotal-val">
            ${subtotal.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-emerald-600 font-medium text-[11px]">
          <span id="discount-label">{discountLabel}</span>
          <span className="font-mono" id="discount-val">
            -${discountAmount.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>Impuesto IGV/IVA (18%):</span>
          <span className="font-semibold text-slate-800 font-mono" id="tax-val">
            ${tax.toFixed(2)}
          </span>
        </div>
      </div>

      {/* TOTAL A COBRAR */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 flex items-center justify-between">
        <div>
          <span className="text-[9px] font-bold text-blue-700 uppercase tracking-wider block">
            TOTAL A COBRAR
          </span>
          <span className="text-[10px] text-blue-500">Dólares (USD $)</span>
        </div>
        <span className="text-2xl font-extrabold text-blue-700 font-mono" id="total-val">
          ${grandTotal.toFixed(2)}
        </span>
      </div>

      {/* Payment methods */}
      <div className="grid grid-cols-3 gap-1">
        <button
          className={`tender-tab py-1.5 px-2 rounded-lg text-xs font-semibold flex flex-col items-center transition-colors ${
            payMethod === 'cash'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          id="btn-pay-cash"
          onClick={() => setPayMethod('cash')}
        >
          <span className="material-symbols-outlined text-base">payments</span> Efectivo
        </button>
        <button
          className={`tender-tab py-1.5 px-2 rounded-lg text-xs font-semibold flex flex-col items-center transition-colors ${
            payMethod === 'card'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          id="btn-pay-card"
          onClick={() => setPayMethod('card')}
        >
          <span className="material-symbols-outlined text-base">credit_card</span> Tarjeta
        </button>
        <button
          className={`tender-tab py-1.5 px-2 rounded-lg text-xs font-semibold flex flex-col items-center transition-colors ${
            payMethod === 'qr'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          id="btn-pay-qr"
          onClick={() => setPayMethod('qr')}
        >
          <span className="material-symbols-outlined text-base">qr_code_2</span> QR / Transf.
        </button>
      </div>

      {/* Cash calculator */}
      {payMethod === 'cash' ? (
        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 space-y-1.5 text-xs" id="box-cash-calc">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-700">Monto Recibido:</span>
            <div className="relative w-28">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
              <input
                className="w-full pl-5 pr-1.5 py-0.5 text-right font-mono font-bold text-xs bg-white rounded border border-slate-300 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                id="input-monto-recibido"
                step="any"
                type="number"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-1 text-[10px]">
            <button
              className="px-2 py-0.5 bg-white border border-slate-300 rounded font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              onClick={() => setMontoPreset(50)}
            >
              $50
            </button>
            <button
              className="px-2 py-0.5 bg-white border border-slate-300 rounded font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              onClick={() => setMontoPreset(100)}
            >
              $100
            </button>
            <button
              className="px-2 py-0.5 bg-white border border-slate-300 rounded font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              onClick={() => setMontoPreset(150)}
            >
              $150
            </button>
            <button
              className="px-2 py-0.5 bg-blue-100 text-blue-700 font-bold rounded hover:bg-blue-200 transition-colors"
              onClick={setMontoExacto}
            >
              Exacto
            </button>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-200">
            <span className="font-bold text-slate-700 text-[11px]">Cambio / Vuelto:</span>
            <span className="text-sm font-bold text-emerald-600 font-mono" id="vuelto-val">
              ${vuelto.toFixed(2)}
            </span>
          </div>
        </div>
      ) : (
        /* Electronic box */
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs text-center text-slate-600" id="box-elec-calc">
          <span className="material-symbols-outlined text-blue-600 text-xl block mb-0.5" id="elec-icon">
            {payMethod === 'card' ? 'credit_card' : 'qr_code_2'}
          </span>
          <p className="font-bold text-xs" id="elec-title">
            {payMethod === 'card'
              ? 'Datáfono POS Listo (Tarjeta Débito/Crédito)'
              : 'Código QR Dinámico Generado'}
          </p>
          <p className="text-[10px] text-slate-400" id="elec-desc">
            {payMethod === 'card'
              ? 'Acerque o inserte la tarjeta en el terminal externo'
              : 'Escanee con la app del banco para pago inmediato'}
          </p>
        </div>
      )}

      {/* Execute checkout button */}
      <button
        className="w-full py-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all"
        onClick={executeCheckout}
      >
        <span className="material-symbols-outlined text-base">receipt_long</span>
        <span>Cobrar e Imprimir (F12)</span>
      </button>
    </div>
  );
};

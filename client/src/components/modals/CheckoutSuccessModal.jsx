import React from 'react';
import { useApp } from '../../context/AppContext';
import logoImg from '../../assets/img/logo.png';

export const CheckoutSuccessModal = () => {
  const { activeModal, closeModal, completedSaleData, resetNewSale, showToast } = useApp();

  if (activeModal !== 'checkout-success' || !completedSaleData) return null;

  const {
    invoiceNumber,
    date,
    clientName,
    clientDoc,
    payMethod,
    items = [],
    subtotal,
    discountAmount = 0,
    discountLabel,
    tax = 0,
    total = 0,
    received = 0,
    vuelto = 0
  } = completedSaleData;

  const handlePrint = () => {
    showToast('Imprimiendo en térmica EPSON TM-T20...', 'print');
    setTimeout(() => window.print(), 300);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl mx-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-emerald-500 text-xl">check_circle</span>
            <h3 className="font-bold text-slate-900 text-sm">¡Venta Cobrada con Éxito!</h3>
          </div>
          <button className="text-slate-400 hover:text-slate-600 cursor-pointer" onClick={closeModal}>
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Ticket preview */}
        <div className="bg-slate-50 p-3 rounded-xl border border-dashed border-slate-300 font-mono text-[11px] space-y-1.5 max-h-80 overflow-y-auto">
          <div className="flex flex-col items-center justify-center pt-1 pb-1">
            <img src={logoImg} alt="NexPOS Logo" className="w-10 h-10 object-contain mb-1" />
            <div className="text-center font-bold text-slate-800 text-xs">NEXPOS TECNOLOGÍA S.A.C.</div>
            <div className="text-center text-[10px] text-slate-400">RUC: 20489182391 • Caja 01 - Turno Mañana</div>
            <div className="text-center text-[10px] text-slate-400">{date}</div>
          </div>
          <div className="border-b border-dashed border-slate-300 my-1.5"></div>
          <div>Comprobante: #{invoiceNumber}</div>
          <div>Cliente: {clientName}</div>
          <div>Doc: {clientDoc}</div>
          <div>Forma de Pago: {payMethod}</div>
          <div className="border-b border-dashed border-slate-300 my-1.5"></div>
          
          {/* Items con descuento */}
          <div className="space-y-1.5">
            {items.map((item, idx) => {
              const itemTotal = item.itemTotal !== undefined 
                ? parseFloat(item.itemTotal) 
                : (item.qty * item.price * (1 - (item.discount || 0) / 100));
              const lineDisc = parseFloat(item.discountAmount || (item.qty * item.price * (item.discount || 0) / 100) || 0);

              return (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between">
                    <span>{item.qty}x {item.name}</span>
                    <span className="font-bold">${itemTotal.toFixed(2)}</span>
                  </div>
                  {lineDisc > 0 && (
                    <div className="flex justify-between text-[10px] text-emerald-600 pl-3">
                      <span>↳ Descuento {item.discountPct ? `(-${item.discountPct}%)` : ''}:</span>
                      <span>-${lineDisc.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="border-b border-dashed border-slate-300 my-1.5"></div>
          
          {/* Desglose financiero del ticket */}
          <div className="space-y-1">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span>${parseFloat(subtotal || total).toFixed(2)}</span>
            </div>
            {parseFloat(discountAmount) > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>{discountLabel || 'Descuento:'}</span>
                <span>-${parseFloat(discountAmount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>IGV / Impuesto (18%):</span>
              <span>${parseFloat(tax || 0).toFixed(2)}</span>
            </div>
            <div className="border-t border-dashed border-slate-300 pt-1 flex justify-between font-bold text-slate-900 text-xs">
              <span>TOTAL COBRADO:</span>
              <span>${parseFloat(total).toFixed(2)}</span>
            </div>
          </div>

          <div className="border-b border-dashed border-slate-300 my-1.5"></div>
          <div className="flex justify-between text-slate-500">
            <span>Monto Recibido:</span>
            <span>${parseFloat(received).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Cambio / Vuelto:</span>
            <span className="text-emerald-600 font-bold">${parseFloat(vuelto).toFixed(2)}</span>
          </div>
          <div className="border-b border-dashed border-slate-300 my-1.5"></div>
          <div className="text-center text-[10px] text-slate-400 italic">
            ¡Gracias por su compra! Comprobante fiscal electrónico.
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <button
            className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors"
            onClick={handlePrint}
          >
            <span className="material-symbols-outlined text-sm">print</span> Imprimir Ticket
          </button>
          <button
            className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center justify-center gap-1 transition-colors"
            onClick={resetNewSale}
          >
            <span className="material-symbols-outlined text-sm">add</span> Nueva Venta
          </button>
        </div>
      </div>
    </div>
  );
};

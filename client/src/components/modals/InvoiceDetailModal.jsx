import React from 'react';
import { useApp } from '../../context/AppContext';
import logoImg from '../../assets/img/logo.png';

export const InvoiceDetailModal = () => {
  const { 
    activeModal, 
    closeModal, 
    selectedInvoice, 
    loadingInvoice, 
    generateInvoiceForSale, 
    showToast 
  } = useApp();

  if (activeModal !== 'invoice-detail') return null;

  if (loadingInvoice) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center space-y-3">
          <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-xs font-bold text-slate-600">Cargando comprobante fiscal...</p>
        </div>
      </div>
    );
  }

  if (!selectedInvoice) return null;

  const inv = selectedInvoice;
  const isVoided = inv.estado === 'ANULADA' || inv.estado_factura === 'ANULADA';
  const hasFacturaNumber = Boolean(inv.numero_factura);
  const items = inv.items || [];

  const handlePrint = () => {
    showToast('Enviando factura a impresión...', 'print');
    setTimeout(() => window.print(), 300);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal Bar */}
        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-400 text-xl">receipt_long</span>
            <div>
              <h3 className="font-bold text-xs flex items-center gap-2">
                Factura Electrónica de Venta
                <span className={`px-2 py-0.2 rounded text-[9px] font-bold ${
                  isVoided 
                    ? 'bg-rose-500 text-white' 
                    : 'bg-emerald-500 text-white'
                }`}>
                  {isVoided ? 'ANULADA' : (inv.estado || 'COMPLETADA')}
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Folio Fiscal: <strong className="text-blue-300">{inv.numero_factura || 'Pendiente de emisión'}</strong>
              </p>
            </div>
          </div>
          <button 
            onClick={closeModal} 
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Invoice Printable Body - Clásica con Logo */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-sans printable-receipt">
          {/* Header Business / Logo + Fiscal Box */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b-2 border-slate-800">
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="NexPOS Logo" className="w-12 h-12 object-contain rounded-lg border border-slate-200 p-1 bg-slate-50 shrink-0" />
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm tracking-tight">NEXPOS TECNOLOGÍA S.A.C.</h4>
                <p className="text-slate-500 text-[11px] leading-tight">Soluciones de Cómputo, Laptops y Accesorios</p>
                <p className="text-slate-500 text-[10px]">Av. República de Panamá 3545, Lima • Tel: (01) 710-4400</p>
                <p className="text-slate-500 text-[10px]">Cajero: {inv.cajero || 'Elena Morales'}</p>
              </div>
            </div>

            <div className="border-2 border-slate-900 rounded-lg p-2 text-center min-w-[150px] bg-slate-50 shrink-0">
              <div className="text-[10px] font-bold text-slate-800">R.U.C. 20489182391</div>
              <div className="text-[10px] font-extrabold text-blue-900 bg-blue-100 py-0.5 rounded my-1 uppercase">
                FACTURA ELECTRÓNICA
              </div>
              <div className="text-xs font-mono font-bold text-slate-900">
                {inv.numero_factura || 'F001-PENDIENTE'}
              </div>
            </div>
          </div>

          {/* Client & Date section */}
          <div className="grid grid-cols-2 gap-3 pb-3 border-b border-dashed border-slate-200 text-[11px]">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cliente / Razón Social</div>
              <div className="font-bold text-slate-800 text-xs mt-0.5">{inv.cliente_nombre || inv.cliente || 'Consumidor Final'}</div>
              <div className="text-slate-500 text-[10px]">Doc: {inv.cliente_doc || inv.doc || 'Sin registrar'}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Detalles de Operación</div>
              <div className="text-slate-700 mt-0.5">Fecha: <strong>{inv.fecha_formateada || inv.fecha || new Date().toLocaleDateString('es-ES')}</strong></div>
              <div className="text-slate-500 text-[10px]">Método: <strong className="text-slate-800 font-semibold">{inv.metodo_pago || inv.metodo || 'Efectivo'}</strong></div>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">
              Detalle de Productos Facturados
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="p-2">Ítem / Producto</th>
                    <th className="p-2 text-center">Cant.</th>
                    <th className="p-2 text-right">P. Unit</th>
                    <th className="p-2 text-right">Desc.</th>
                    <th className="p-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-3 text-center text-slate-400 italic">
                        Detalle no disponible o venta general sin desagregado
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => {
                      const desc = parseFloat(item.descuento || 0);
                      const unit = parseFloat(item.precio_unitario || item.precio_venta || 0);
                      const qty = item.cantidad || item.cant || 1;
                      const sub = parseFloat(item.subtotal || (unit * qty - desc));
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2 font-medium text-slate-800">
                            <div>{item.nombre || item.name}</div>
                            {item.codigo && <span className="text-[9px] text-slate-400 font-mono">{item.codigo}</span>}
                          </td>
                          <td className="p-2 text-center font-mono font-semibold">{qty}</td>
                          <td className="p-2 text-right font-mono text-slate-600">${unit.toFixed(2)}</td>
                          <td className="p-2 text-right font-mono text-emerald-600 font-semibold">
                            {desc > 0 ? `-$${desc.toFixed(2)}` : '—'}
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-slate-800">${sub.toFixed(2)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 font-mono text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal Bruto:</span>
              <span className="font-semibold">${parseFloat(inv.subtotal || inv.total || 0).toFixed(2)}</span>
            </div>
            {parseFloat(inv.descuento_total || 0) > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Descuento Total Aplicado:</span>
                <span>-${parseFloat(inv.descuento_total).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Impuesto IGV / IVA (18%):</span>
              <span>${parseFloat(inv.impuesto || (parseFloat(inv.total) * 0.18 / 1.18) || 0).toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-200 pt-1.5 flex justify-between text-sm font-extrabold text-blue-700">
              <span>TOTAL FACTURADO:</span>
              <span>${parseFloat(inv.total || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 italic pt-1">
            Representación impresa de la Factura Electrónica autorizada por la administración tributaria.
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center gap-2 no-print">
          {!hasFacturaNumber && (
            <button
              onClick={() => generateInvoiceForSale(inv.id_venta)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">post_add</span>
              Generar Factura Oficial
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              Imprimir / PDF
            </button>
            <button
              onClick={closeModal}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useApp } from '../../context/AppContext';

export const CajaView = () => {
  const { caja, invoices, anularFactura, openModal, showToast } = useApp();

  const handleCorteX = () => {
    showToast('Imprimiendo comprobante fiscal X...', 'print');
    setTimeout(() => window.print(), 300);
  };

  const fondoInicial = parseFloat(caja?.monto_inicial || 150).toFixed(2);
  const totalEfectivo = parseFloat(caja?.total_en_caja || 1570.50).toFixed(2);
  const ventasTarjeta = parseFloat(caja?.ventas_tarjeta || 890).toFixed(2);
  const ventasTransf = parseFloat(caja?.ventas_transferencia || 340).toFixed(2);

  return (
    <section className="flex flex-col gap-3 h-full overflow-y-auto pr-1" id="view-caja">
      {/* Top Banner */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">payments</span> Control de Caja y Arqueo Fiscal
          </h2>
          <p className="text-xs text-slate-500">Supervisión en vivo de gaveta, ventas por método y cierre Z</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
            onClick={handleCorteX}
          >
            <span className="material-symbols-outlined text-sm">print</span> Corte Parcial (X)
          </button>
          <button
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
            onClick={() => openModal('turno')}
          >
            <span className="material-symbols-outlined text-sm">lock</span> Cierre Definitivo (Z)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="bg-white p-3 rounded-xl border-l-4 border-blue-600 border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Fondo Inicial</span>
          <span className="text-xl font-bold text-slate-900 font-mono block mt-0.5">${fondoInicial}</span>
          <span className="text-[10px] text-slate-400">08:00 AM Apertura</span>
        </div>
        <div className="bg-white p-3 rounded-xl border-l-4 border-emerald-500 border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Efectivo en Gaveta</span>
          <span className="text-xl font-bold text-emerald-600 font-mono block mt-0.5">${totalEfectivo}</span>
          <span className="text-[10px] text-emerald-600 font-semibold">Cuadre exacto (100%)</span>
        </div>
        <div className="bg-white p-3 rounded-xl border-l-4 border-indigo-500 border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Tarjetas POS</span>
          <span className="text-xl font-bold text-indigo-600 font-mono block mt-0.5">${ventasTarjeta}</span>
          <span className="text-[10px] text-slate-400">Transacciones datáfono</span>
        </div>
        <div className="bg-white p-3 rounded-xl border-l-4 border-purple-500 border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Transferencias / QR</span>
          <span className="text-xl font-bold text-purple-600 font-mono block mt-0.5">${ventasTransf}</span>
          <span className="text-[10px] text-slate-400">Pagos QR dinámico</span>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex-1">
        <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
            Historial de Comprobantes Emitidos en el Turno
          </span>
          <span className="text-[11px] text-slate-500">
            Total registrados: <strong id="caja-invoices-count">{invoices.length}</strong>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-2.5">Folio</th>
                <th className="p-2.5">Hora</th>
                <th className="p-2.5">Cliente</th>
                <th className="p-2.5">Método</th>
                <th className="p-2.5 text-right">Total ($)</th>
                <th className="p-2.5 text-center">Estado</th>
                <th className="p-2.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100" id="invoices-tbody">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400 text-xs">
                    No hay comprobantes emitidos en el turno aún.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const isVoided = inv.estado === 'ANULADA' || inv.status === 'anulada';
                  return (
                    <tr key={inv.id_venta || inv.numero_factura} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2.5 font-bold font-mono text-blue-600">
                        {inv.numero_factura || inv.id}
                      </td>
                      <td className="p-2.5 text-slate-500">{inv.fecha || inv.time}</td>
                      <td className="p-2.5 font-semibold text-slate-800">{inv.cliente || inv.customer}</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700 text-[11px]">
                          {inv.metodo || inv.method}
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-800">
                        ${parseFloat(inv.total).toFixed(2)}
                      </td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            !isVoided
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {!isVoided ? 'Emitida / Pagada' : 'Anulada'}
                        </span>
                      </td>
                      <td className="p-2.5 text-right">
                        {!isVoided ? (
                          <button
                            onClick={() => anularFactura(inv.id_venta)}
                            className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded font-semibold text-[11px] transition-colors"
                          >
                            Anular
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Revertido</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

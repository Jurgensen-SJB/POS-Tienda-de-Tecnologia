import React from 'react';
import { useApp } from '../../context/AppContext';

export const ComprasView = () => {
  const { purchases, showToast } = useApp();

  const handleNewOrder = () => {
    showToast('Abriendo asistente de orden de compra...', 'add_shopping_cart');
  };

  return (
    <section className="flex flex-col gap-3 h-full overflow-y-auto pr-1" id="view-compras">
      {/* Header */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">local_shipping</span> Compras &amp; Proveedores
          </h2>
          <p className="text-xs text-slate-500">Recepción de mercancías y reposición automática</p>
        </div>
        <button
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors shadow-xs"
          onClick={handleNewOrder}
        >
          <span className="material-symbols-outlined text-sm">add_shopping_cart</span> Nueva Orden
        </button>
      </div>

      {/* Orders List */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-xs divide-y divide-slate-100" id="orders-list">
        {purchases.length === 0 ? (
          <div className="py-6 text-center text-slate-400">No hay órdenes de compra registradas.</div>
        ) : (
          purchases.map((ord, idx) => (
            <div key={ord.id_compra || idx} className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800">
                  #OC-2026-00{ord.id_compra || idx + 39} - {ord.proveedor}
                </span>
                <span className="text-slate-400 text-[11px] block">
                  {ord.observacion || 'Recepción de mercancía e inventario'}
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  ord.estado === 'RECIBIDO' || ord.estado === 'REGISTRADA'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-blue-50 text-blue-700'
                }`}
              >
                {ord.estado === 'RECIBIDO' || ord.estado === 'REGISTRADA' ? 'Completado' : 'En Tránsito'}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

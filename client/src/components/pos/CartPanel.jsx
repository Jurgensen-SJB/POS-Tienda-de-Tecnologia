import React from 'react';
import { useApp } from '../../context/AppContext';
import { CartItem } from './CartItem';

export const CartPanel = () => {
  const { cart, totalUnits, openModal } = useApp();

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex-1 flex flex-col overflow-hidden min-h-[85px]">
      {/* Header */}
      <div className="px-3 py-1 bg-slate-50 border-b border-slate-200 flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        <span className="flex-1">PRODUCTO</span>
        <span className="w-16 text-center">CANT.</span>
        <span className="w-16 text-right">SUBTOTAL</span>
        <span className="w-6"></span>
      </div>

      {/* Item list */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 text-xs" id="cart-items-container">
        {cart.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            El ticket está vacío.
            <br />
            Selecciona o escanea productos para cobrar.
          </div>
        ) : (
          cart.map((item) => <CartItem key={item.id_producto} item={item} />)
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
        <button
          className="text-rose-600 hover:bg-rose-50 px-2 py-0.5 rounded font-semibold flex items-center gap-1 text-[11px] transition-colors"
          onClick={() => openModal('anular')}
        >
          <span className="material-symbols-outlined text-xs">delete_sweep</span> Anular (ESC)
        </button>
        <span className="text-slate-500 font-semibold text-[11px]" id="cart-count-uds">
          {cart.length} Artículos ({totalUnits} uds)
        </span>
      </div>
    </div>
  );
};

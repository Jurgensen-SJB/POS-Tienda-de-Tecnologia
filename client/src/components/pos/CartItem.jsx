import React from 'react';
import { useApp } from '../../context/AppContext';

export const CartItem = ({ item }) => {
  const { changeCartQty, removeFromCart } = useApp();

  const itemTotal = item.qty * item.price * (1 - (item.discount || 0) / 100);

  return (
    <div className="py-1.5 flex items-center justify-between gap-1 group">
      <div className="flex-1 min-w-0 pr-1">
        <h5 className="font-semibold text-slate-800 truncate text-[11px] leading-tight" title={item.name}>
          {item.name}
        </h5>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <span className="font-mono">${item.price.toFixed(2)} / ud</span>
          {item.discount > 0 && (
            <span className="text-emerald-600 font-bold">(-{item.discount}%)</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 shrink-0">
        <button
          onClick={() => changeCartQty(item.id_producto, -1)}
          className="w-5 h-5 rounded bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shadow-xs"
        >
          -
        </button>
        <span className="w-5 text-center font-bold font-mono text-slate-800 text-xs">
          {item.qty}
        </span>
        <button
          onClick={() => changeCartQty(item.id_producto, 1)}
          className="w-5 h-5 rounded bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shadow-xs"
        >
          +
        </button>
      </div>

      <span className="w-16 text-right font-mono font-bold text-slate-800 text-xs">
        ${itemTotal.toFixed(2)}
      </span>

      <button
        onClick={() => removeFromCart(item.id_producto)}
        className="w-5 text-slate-300 hover:text-rose-500 pl-1 transition-colors"
        title="Eliminar"
      >
        <span className="material-symbols-outlined text-sm">delete</span>
      </button>
    </div>
  );
};

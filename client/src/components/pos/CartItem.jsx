import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export const CartItem = ({ item }) => {
  const { changeCartQty, removeFromCart, setItemDiscount, products = [] } = useApp();
  const [showDiscountMenu, setShowDiscountMenu] = useState(false);
  const [customPct, setCustomPct] = useState(item.discount ? String(item.discount) : '');
  const menuRef = useRef(null);

  const currentProd = products.find(p => p.id_producto === item.id_producto);
  const maxStock = currentProd && currentProd.stock !== undefined ? currentProd.stock : (item.stock || 9999);
  const isMaxReached = item.qty >= maxStock;

  const discountVal = item.discount || 0;
  const itemTotal = item.qty * item.price * (1 - discountVal / 100);

  // Close discount menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowDiscountMenu(false);
      }
    };
    if (showDiscountMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDiscountMenu]);

  const handleApplyPreset = (pct) => {
    setItemDiscount(item.id_producto, pct);
    setCustomPct(pct > 0 ? String(pct) : '');
    setShowDiscountMenu(false);
  };

  const handleApplyCustom = (e) => {
    e.preventDefault();
    const val = parseFloat(customPct);
    if (!isNaN(val) && val >= 0 && val <= 100) {
      setItemDiscount(item.id_producto, val);
      setShowDiscountMenu(false);
    }
  };

  return (
    <div className="py-2 border-b border-slate-100 last:border-b-0 relative group">
      <div className="flex items-center justify-between gap-1">
        <div className="flex-1 min-w-0 pr-1">
          <h5 className="font-semibold text-slate-800 truncate text-[11px] leading-tight" title={item.name}>
            {item.name}
          </h5>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
            <span className="font-mono">${item.price.toFixed(2)} / ud</span>
            
            {/* Discount trigger button / badge */}
            <button
              type="button"
              onClick={() => setShowDiscountMenu(!showDiscountMenu)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5 transition-colors cursor-pointer ${
                discountVal > 0 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100' 
                  : 'bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600'
              }`}
              title="Aplicar descuento a este producto"
            >
              <span className="material-symbols-outlined text-[11px]">percent</span>
              <span>{discountVal > 0 ? `-${discountVal}%` : 'Desc.'}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 shrink-0">
          <button
            onClick={() => changeCartQty(item.id_producto, -1)}
            className="w-5 h-5 rounded bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer"
          >
            -
          </button>
          <span className="w-5 text-center font-bold font-mono text-slate-800 text-xs">
            {item.qty}
          </span>
          <button
            onClick={() => changeCartQty(item.id_producto, 1)}
            disabled={isMaxReached}
            className={`w-5 h-5 rounded flex items-center justify-center font-bold text-xs shadow-xs transition-colors ${
              isMaxReached 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-white hover:bg-slate-200 text-slate-700 cursor-pointer'
            }`}
            title={isMaxReached ? `Stock máximo disponible alcanzado (${maxStock} unid.)` : 'Aumentar cantidad'}
          >
            +
          </button>
        </div>

        <div className="w-16 text-right shrink-0">
          {discountVal > 0 && (
            <div className="text-[9px] line-through text-slate-400 font-mono">
              ${(item.qty * item.price).toFixed(2)}
            </div>
          )}
          <span className="font-mono font-bold text-slate-800 text-xs block">
            ${itemTotal.toFixed(2)}
          </span>
        </div>

        <button
          onClick={() => removeFromCart(item.id_producto)}
          className="w-5 text-slate-300 hover:text-rose-500 pl-1 transition-colors cursor-pointer"
          title="Eliminar"
        >
          <span className="material-symbols-outlined text-sm">delete</span>
        </button>
      </div>

      {/* Popover to apply discount to this specific product */}
      {showDiscountMenu && (
        <div 
          ref={menuRef}
          className="absolute left-0 top-full mt-1 z-30 bg-white border border-slate-200 shadow-xl rounded-xl p-2.5 w-64 text-xs"
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 mb-2">
            <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-blue-600">sell</span>
              Descuento para este producto
            </span>
            <button 
              type="button"
              onClick={() => setShowDiscountMenu(false)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xs">close</span>
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1 mb-2">
            {[0, 5, 10, 15].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handleApplyPreset(pct)}
                className={`py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                  discountVal === pct
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {pct === 0 ? '0%' : `-${pct}%`}
              </button>
            ))}
          </div>

          <form onSubmit={handleApplyCustom} className="flex gap-1.5 items-center">
            <div className="relative flex-1">
              <input
                type="number"
                min="0"
                max="100"
                value={customPct}
                onChange={(e) => setCustomPct(e.target.value)}
                placeholder="% Manual"
                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[11px] font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                autoFocus
              />
              <span className="absolute right-2 top-1 text-slate-400 text-[11px]">%</span>
            </div>
            <button
              type="submit"
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[11px] transition-colors cursor-pointer"
            >
              Aplicar
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

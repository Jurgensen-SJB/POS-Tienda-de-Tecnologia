import React from 'react';
import { useApp } from '../../context/AppContext';

export const ProductCard = ({ product }) => {
  const { addToCart, showToast } = useApp();

  const stock = product.stock !== undefined ? product.stock : 0;
  const isOutOfStock = stock <= 0;
  const isLowStock = !isOutOfStock && stock <= (product.stock_minimo || 5);
  const price = parseFloat(product.precio_venta).toFixed(2);

  const handleCardClick = () => {
    if (isOutOfStock) {
      showToast(`¡Agotado! "${product.nombre}" no tiene existencias`, 'warning');
      return;
    }
    addToCart(product);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`bg-white rounded-xl border transition-all flex flex-col justify-between group relative overflow-hidden h-full p-2 ${
        isOutOfStock
          ? 'border-slate-200 opacity-60 cursor-not-allowed bg-slate-50/50'
          : 'border-slate-200 hover:border-blue-500 hover:shadow-md cursor-pointer active:scale-[0.98]'
      }`}
    >
      {/* Dynamic image container: flexes so it never forces overflow */}
      <div className="relative w-full flex-1 min-h-[55px] max-h-24 rounded-lg overflow-hidden bg-slate-100 shrink mb-1">
        <img
          src={product.imagen_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=360&auto=format&fit=crop&q=80'}
          alt={product.nombre}
          onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=360&auto=format&fit=crop&q=80'; }}
          className={`w-full h-full object-cover transition-transform duration-300 ${!isOutOfStock ? 'group-hover:scale-105' : 'grayscale'}`}
        />

        <span
          className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold leading-none shadow-xs text-white ${
            isOutOfStock ? 'bg-rose-600 font-extrabold' : isLowStock ? 'bg-amber-500' : 'bg-emerald-600'
          }`}
        >
          {isOutOfStock ? 'Agotado' : `Stock: ${stock}`}
        </span>
      </div>

      {/* Product Name: guaranteed separate row with truncate so it never overlaps */}
      <div className="shrink-0 mb-1">
        <h4
          className={`text-xs font-semibold truncate leading-tight transition-colors ${
            isOutOfStock ? 'text-slate-400' : 'text-slate-800 group-hover:text-blue-600'
          }`}
          title={product.nombre}
        >
          {product.nombre}
        </h4>
      </div>

      {/* Price & Add Action: dedicated footer */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 shrink-0">
        <span className={`text-sm font-extrabold font-mono tracking-tight ${isOutOfStock ? 'text-slate-400' : 'text-blue-700'}`}>
          ${price}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick();
          }}
          disabled={isOutOfStock}
          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors shadow-xs ${
            isOutOfStock
              ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
              : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white cursor-pointer'
          }`}
          title={isOutOfStock ? 'Producto agotado' : 'Añadir al ticket'}
        >
          <span className="material-symbols-outlined text-sm font-bold">
            {isOutOfStock ? 'block' : 'add'}
          </span>
        </button>
      </div>
    </div>
  );
};

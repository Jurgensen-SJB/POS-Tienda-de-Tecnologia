import React from 'react';
import { useApp } from '../../context/AppContext';

export const ProductCard = ({ product }) => {
  const { addToCart } = useApp();

  const stock = product.stock !== undefined ? product.stock : 0;
  const isLowStock = stock <= (product.stock_minimo || 5);
  const price = parseFloat(product.precio_venta).toFixed(2);

  return (
    <div
      onClick={() => addToCart(product)}
      className="bg-white rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group relative overflow-hidden h-full p-2 active:scale-[0.98]"
    >
      {/* Dynamic image container: flexes so it never forces overflow */}
      <div className="relative w-full flex-1 min-h-[55px] max-h-24 rounded-lg overflow-hidden bg-slate-100 shrink mb-1">
        <img
          src={product.imagen_url || 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=360&auto=format&fit=crop&q=80'}
          alt={product.nombre}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-slate-900/80 backdrop-blur-xs text-white font-mono text-[9px] font-semibold uppercase tracking-wider shadow-xs">
          {product.codigo}
        </span>
        <span
          className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold leading-none shadow-xs text-white ${
            isLowStock ? 'bg-amber-500' : 'bg-emerald-600'
          }`}
        >
          Stock: {stock}
        </span>
      </div>

      {/* Product Name: guaranteed separate row with truncate so it never overlaps */}
      <div className="shrink-0 mb-1">
        <h4
          className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors truncate leading-tight"
          title={product.nombre}
        >
          {product.nombre}
        </h4>
      </div>

      {/* Price & Add Action: dedicated footer */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 shrink-0">
        <span className="text-sm font-extrabold text-blue-700 font-mono tracking-tight">
          ${price}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            addToCart(product);
          }}
          className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors shadow-xs"
          title="Añadir al ticket"
        >
          <span className="material-symbols-outlined text-sm font-bold">add</span>
        </button>
      </div>
    </div>
  );
};

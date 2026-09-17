import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductCard } from './ProductCard';

export const ProductGrid = () => {
  const { products, activeCategory, searchQuery } = useApp();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Filter products by category and search
  const filtered = products.filter((p) => {
    const matchesCategory = activeCategory === null || p.id_categoria === activeCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.nombre.toLowerCase().includes(q) ||
      (p.codigo && p.codigo.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = filtered.slice(startIndex, startIndex + itemsPerPage);

  const startRange = filtered.length > 0 ? startIndex + 1 : 0;
  const endRange = Math.min(startIndex + itemsPerPage, filtered.length);

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-2.5">
      {/* CUADRÍCULA ESTRICTA 4x3 (12 PRODUCTOS EXACTOS POR PÁGINA) */}
      <div className="flex-1 min-h-0 grid-pos-strict gap-2" id="pos-products-grid">
        {currentProducts.length === 0 ? (
          <div className="col-span-4 row-span-3 flex flex-col items-center justify-center text-slate-400 bg-white rounded-xl border border-slate-200">
            <span className="material-symbols-outlined text-4xl mb-1 text-slate-300">search_off</span>
            <p className="text-xs font-semibold">No se encontraron productos coincidentes</p>
          </div>
        ) : (
          currentProducts.map((p) => <ProductCard key={p.id_producto} product={p} />)
        )}
      </div>

      {/* BARRA DE PAGINACIÓN INTERACTIVA */}
      <div className="bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between text-xs shrink-0">
        <div className="text-slate-500 font-medium text-[11px]" id="pagination-info">
          Mostrando{' '}
          <span className="font-bold text-slate-800" id="page-range">
            {startRange}-{endRange}
          </span>{' '}
          de{' '}
          <span className="font-bold text-slate-800" id="total-prods">
            {filtered.length}
          </span>{' '}
          productos • Página{' '}
          <span className="font-bold text-blue-600" id="current-page-num">
            {currentPage}
          </span>
          /<span id="total-pages-num">{totalPages}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            className="px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold disabled:opacity-40 disabled:pointer-events-none flex items-center gap-0.5 text-xs transition-colors"
            id="btn-prev"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            <span className="material-symbols-outlined text-sm">chevron_left</span> Anterior
          </button>

          <div className="flex items-center gap-1" id="pagination-pills">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => setCurrentPage(num)}
                className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center transition-colors ${
                  currentPage === num
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold'
                }`}
              >
                {num}
              </button>
            ))}
          </div>

          <button
            className="px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold disabled:opacity-40 disabled:pointer-events-none flex items-center gap-0.5 text-xs transition-colors"
            id="btn-next"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Siguiente <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
};

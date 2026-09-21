import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductCard } from './ProductCard';

export const ProductGrid = () => {
  const { products, activeCategory, searchQuery } = useApp();
  const gridContainerRef = useRef(null);

  // Filter products by category, search and active state
  const filtered = products.filter((p) => {
    const isActive = (p.estado || 'ACTIVO').toUpperCase() === 'ACTIVO';
    if (!isActive) return false;
    const matchesCategory = activeCategory === null || p.id_categoria === activeCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.nombre.toLowerCase().includes(q) ||
      (p.codigo && p.codigo.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  // Scroll to top when category or search changes
  useEffect(() => {
    if (gridContainerRef.current) {
      gridContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeCategory, searchQuery]);

  const scrollToTop = () => {
    if (gridContainerRef.current) {
      gridContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-2">
      {/* CUADRÍCULA DESPLAZABLE VERTICALMENTE (SCROLL COMPLETO) */}
      <div
        ref={gridContainerRef}
        className="flex-1 min-h-0 overflow-y-auto pr-1.5 scroll-smooth"
        id="pos-products-grid"
      >
        {filtered.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-white rounded-xl border border-slate-200">
            <span className="material-symbols-outlined text-4xl mb-1 text-slate-300">search_off</span>
            <p className="text-xs font-semibold">No se encontraron productos coincidentes</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 pb-2">
            {filtered.map((p) => (
              <div key={p.id_producto} className="h-[172px]">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BARRA INFORMATIVA DE CATÁLOGO Y DESPLAZAMIENTO */}
      <div className="bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between text-xs shrink-0">
        <div className="text-slate-500 font-medium text-[11px] flex items-center gap-1.5" id="catalog-info">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Mostrando <span className="font-bold text-slate-800">{filtered.length}</span> productos activos
          {activeCategory && <span className="text-slate-400">• Filtrado por categoría</span>}
        </div>

        <button
          onClick={scrollToTop}
          className="px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
          title="Subir al inicio del catálogo"
        >
          <span className="material-symbols-outlined text-sm">arrow_upward</span> Volver arriba
        </button>
      </div>
    </div>
  );
};


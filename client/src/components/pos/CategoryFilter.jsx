import React from 'react';
import { useApp } from '../../context/AppContext';

export const CategoryFilter = () => {
  const { categories, products, activeCategory, setActiveCategory } = useApp();

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 shrink-0" id="category-pills">
      <button
        onClick={() => setActiveCategory(null)}
        className={`cat-pill px-3 py-1 rounded-full text-xs font-semibold shadow-xs whitespace-nowrap transition-colors ${
          activeCategory === null
            ? 'bg-blue-600 text-white'
            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
        }`}
      >
        Todos{' '}
        <span
          className={`px-1 py-0.2 rounded-full text-[10px] ml-0.5 ${
            activeCategory === null ? 'bg-blue-700/60' : 'bg-slate-200 text-slate-700'
          }`}
          id="badge-count-all"
        >
          {products.length}
        </span>
      </button>

      {categories.map((cat) => {
        const isSelected = activeCategory === cat.id_categoria;
        return (
          <button
            key={cat.id_categoria}
            onClick={() => setActiveCategory(isSelected ? null : cat.id_categoria)}
            className={`cat-pill px-3 py-1 rounded-full text-xs font-semibold shadow-xs whitespace-nowrap transition-colors ${
              isSelected
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat.nombre}
          </button>
        );
      })}
    </div>
  );
};

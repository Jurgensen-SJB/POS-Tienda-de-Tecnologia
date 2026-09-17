import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const StockView = () => {
  const {
    products,
    addToCart,
    setCurrentView,
    openModal,
    openEditProduct,
    openDeleteProduct,
    isAdmin
  } = useApp();

  const [tableSearch, setTableSearch] = useState('');

  const handleSellInPos = (product) => {
    addToCart(product);
    setCurrentView('pos');
  };

  const filteredProducts = products.filter((p) => {
    const q = tableSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      p.nombre.toLowerCase().includes(q) ||
      (p.codigo && p.codigo.toLowerCase().includes(q)) ||
      (p.categoria_nombre && p.categoria_nombre.toLowerCase().includes(q))
    );
  });

  return (
    <section className="flex flex-col gap-3 h-full overflow-y-auto pr-1" id="view-stock">
      {/* Header */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">inventory_2</span> Catálogo Central de Inventario
            </h2>
            {isAdmin ? (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full border border-blue-200 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">admin_panel_settings</span> Administrador
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full border border-slate-200">
                Solo Lectura
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Supervisión en tiempo real de {products.length} productos y gestión CRUD de catálogo
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search bar inside Stock View */}
          <div className="relative w-48 sm:w-64">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              search
            </span>
            <input
              type="text"
              placeholder="Buscar en catálogo..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
            />
          </div>

          {/* New Product (Admin Only) */}
          {isAdmin && (
            <button
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-xs shrink-0"
              onClick={() => openModal('new-product')}
            >
              <span className="material-symbols-outlined text-sm">add</span> Nuevo Producto
            </button>
          )}
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px]">
              <tr>
                <th className="p-3">SKU &amp; Producto</th>
                <th className="p-3">Categoría</th>
                <th className="p-3 text-right">PVP ($)</th>
                <th className="p-3 text-center">Stock Almacén</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100" id="inventory-tbody">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 text-xs">
                    No se encontraron productos coincidentes.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const stock = p.stock !== undefined ? p.stock : 0;
                  const isLow = stock <= (p.stock_minimo || 5);
                  return (
                    <tr key={p.id_producto} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={p.imagen_url || 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=360&auto=format&fit=crop&q=80'}
                            alt={p.nombre}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-800 block">{p.nombre}</span>
                            <span className="font-mono text-[10px] text-slate-400">{p.codigo}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 capitalize text-slate-600">
                        {p.categoria_nombre || 'General'}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-800 text-sm">
                        ${parseFloat(p.precio_venta).toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isLow
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {stock} unidades
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Admin actions: Edit & Delete */}
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => openEditProduct(p)}
                                className="px-2 py-1 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded text-xs font-semibold transition-colors flex items-center gap-0.5 border border-slate-200"
                                title="Editar producto (Admin)"
                              >
                                <span className="material-symbols-outlined text-xs">edit</span>
                                <span>Editar</span>
                              </button>

                              <button
                                onClick={() => openDeleteProduct(p)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                title="Eliminar producto (Admin)"
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => handleSellInPos(p)}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 rounded text-xs font-semibold transition-colors flex items-center gap-0.5"
                          >
                            <span className="material-symbols-outlined text-xs">point_of_sale</span>
                            <span>Vender</span>
                          </button>
                        </div>
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

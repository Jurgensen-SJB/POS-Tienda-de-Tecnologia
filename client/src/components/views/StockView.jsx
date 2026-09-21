import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';

export const StockView = () => {
  const {
    products,
    addToCart,
    setCurrentView,
    openModal,
    openDetailProduct,
    openEditProduct,
    openDeactivateProduct,
    isAdmin,
    hasPermiso,
  } = useApp();

  const [filterEstado, setFilterEstado] = useState('ACTIVO');
  const [tableSearch, setTableSearch] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const scrollContainerRef = useRef(null);

  const handleSellInPos = (product) => {
    addToCart(product);
    setCurrentView('pos');
  };

  const filteredProducts = products.filter((p) => {
    const estado = (p.estado || 'ACTIVO').toUpperCase();
    const matchEstado = filterEstado === 'TODOS' || estado === filterEstado;
    const q = tableSearch.toLowerCase().trim();
    const matchSearch =
      !q ||
      p.nombre.toLowerCase().includes(q) ||
      (p.codigo && p.codigo.toLowerCase().includes(q)) ||
      (p.categoria_nombre && p.categoria_nombre.toLowerCase().includes(q));
    return matchEstado && matchSearch;
  });

  const activeCount = products.filter(p => (p.estado || 'ACTIVO').toUpperCase() === 'ACTIVO').length;
  const inactiveCount = products.filter(p => (p.estado || 'ACTIVO').toUpperCase() === 'INACTIVO').length;

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section className="flex flex-col gap-2.5 h-full min-h-0" id="view-stock">
      {/* Header */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">inventory_2</span> Catálogo Central de Inventario
            </h2>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full border border-slate-200">
              {products.length} productos
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeCount} activo{activeCount !== 1 ? 's' : ''}
            {inactiveCount > 0 && ` · ${inactiveCount} inactivo${inactiveCount !== 1 ? 's' : ''}`}
            {' — Gestión de existencias, precios y catálogo'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'table' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista en tabla detallada"
            >
              <span className="material-symbols-outlined text-sm">table_rows</span> Tabla
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'grid' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista en tarjetas visuales"
            >
              <span className="material-symbols-outlined text-sm">grid_view</span> Tarjetas
            </button>
          </div>

          {/* New Product Button */}
          {(hasPermiso('crear_producto') || isAdmin) && (
            <button
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs shrink-0 cursor-pointer"
              onClick={() => openModal('new-product')}
              id="btn-new-product"
            >
              <span className="material-symbols-outlined text-sm">add</span> Nuevo Producto
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-2 flex-wrap text-xs shrink-0">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre, código SKU o categoría..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-slate-400 focus:outline-none transition-colors shadow-xs"
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-0.5 bg-white border border-slate-200 rounded-lg p-0.5 shadow-xs">
          {['ACTIVO', 'INACTIVO', 'TODOS'].map((est) => (
            <button
              key={est}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                filterEstado === est
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
              onClick={() => setFilterEstado(est)}
            >
              {est.charAt(0) + est.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area (Scrollable Downward) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex-1 min-h-0 flex flex-col overflow-hidden">
        {viewMode === 'table' ? (
          /* TABLA CON DESPLAZAMIENTO HACIA ABAJO Y ENCABEZADOS FIJOS */
          <div
            ref={scrollContainerRef}
            className="overflow-auto flex-1 min-h-0 scroll-smooth"
            id="stock-table-scroll-container"
          >
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] sticky top-0 z-10 shadow-xs">
                <tr>
                  <th className="p-3">Producto</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3 text-right">PVP ($)</th>
                  <th className="p-3 text-center">Stock Almacén</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100" id="inventory-tbody">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                      No se encontraron productos coincidentes con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const stock = p.stock !== undefined ? p.stock : 0;
                    const isLow = stock <= (p.stock_minimo || 5);
                    const isActive = (p.estado || 'ACTIVO').toUpperCase() === 'ACTIVO';

                    return (
                      <tr
                        key={p.id_producto}
                        className={`hover:bg-slate-50/80 transition-colors ${!isActive ? 'opacity-55' : ''}`}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={p.imagen_url || 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=360&auto=format&fit=crop&q=80'}
                              alt={p.nombre}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 bg-white"
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-slate-800 block truncate max-w-[200px] md:max-w-xs" title={p.nombre}>
                                {p.nombre}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400">
                                {p.codigo}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-slate-600">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-medium border border-slate-200">
                            {p.categoria_nombre || 'General'}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900 text-xs">
                          ${parseFloat(p.precio_venta).toFixed(2)}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isLow
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {stock} unidades
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Consultar */}
                            <button
                              onClick={() => openDetailProduct(p)}
                              className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded text-xs font-semibold transition-colors flex items-center gap-1 border border-slate-200 cursor-pointer"
                              title="Consultar ficha técnica"
                            >
                              <span className="material-symbols-outlined text-xs">visibility</span>
                              <span>Consultar</span>
                            </button>

                            {/* Modificar */}
                            {(hasPermiso('editar_producto') || isAdmin) && (
                              <button
                                onClick={() => openEditProduct(p)}
                                className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded text-xs font-semibold transition-colors flex items-center gap-1 border border-slate-200 cursor-pointer"
                                title="Modificar producto"
                              >
                                <span className="material-symbols-outlined text-xs">edit</span>
                                <span>Modificar</span>
                              </button>
                            )}

                            {/* Desactivar / Activar */}
                            {(hasPermiso('editar_producto') || isAdmin) && (
                              <button
                                onClick={() => openDeactivateProduct(p)}
                                className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded text-xs font-semibold transition-colors flex items-center gap-1 border border-slate-200 cursor-pointer"
                                title={isActive ? 'Desactivar producto' : 'Activar producto'}
                              >
                                <span className="material-symbols-outlined text-xs">
                                  {isActive ? 'remove_shopping_cart' : 'add_shopping_cart'}
                                </span>
                                <span>{isActive ? 'Desactivar' : 'Activar'}</span>
                              </button>
                            )}

                            {/* Vender en POS */}
                            <button
                              onClick={() => handleSellInPos(p)}
                              disabled={!isActive || stock <= 0}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 rounded text-xs font-semibold transition-colors flex items-center gap-0.5 disabled:opacity-40 disabled:hover:bg-blue-50 disabled:hover:text-blue-700 cursor-pointer"
                              title={isActive ? 'Vender en Terminal POS' : 'Producto inactivo'}
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
        ) : (
          /* VISTA EN TARJETAS VISUALES CON DESPLAZAMIENTO HACIA ABAJO */
          <div
            ref={scrollContainerRef}
            className="overflow-auto flex-1 min-h-0 p-3.5 scroll-smooth"
            id="stock-cards-scroll-container"
          >
            {filteredProducts.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-1 text-slate-300">search_off</span>
                <p className="text-xs font-semibold">No se encontraron productos coincidentes</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredProducts.map((p) => {
                  const stock = p.stock !== undefined ? p.stock : 0;
                  const isLow = stock <= (p.stock_minimo || 5);
                  const isActive = (p.estado || 'ACTIVO').toUpperCase() === 'ACTIVO';

                  return (
                    <div
                      key={p.id_producto}
                      className={`bg-white rounded-xl border border-slate-200 p-3 flex flex-col justify-between hover:shadow-md transition-all ${
                        !isActive ? 'opacity-60 bg-slate-50' : ''
                      }`}
                    >
                      <div>
                        <div className="relative w-full h-36 rounded-lg overflow-hidden bg-slate-100 mb-2.5">
                          <img
                            src={p.imagen_url || 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=360&auto=format&fit=crop&q=80'}
                            alt={p.nombre}
                            className="w-full h-full object-cover"
                          />
                          <span
                            className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold shadow-xs text-white ${
                              isLow ? 'bg-amber-500' : 'bg-emerald-600'
                            }`}
                          >
                            Stock: {stock}
                          </span>
                          <span
                            className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold shadow-xs border ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>

                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold border border-slate-200">
                          {p.categoria_nombre || 'General'}
                        </span>

                        <h4 className="font-bold text-slate-800 text-sm mt-1.5 truncate" title={p.nombre}>
                          {p.nombre}
                        </h4>
                        <p className="text-[11px] font-mono text-slate-400">{p.codigo}</p>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                          <span className="text-xs text-slate-400">PVP:</span>
                          <span className="text-base font-extrabold text-blue-700 font-mono">
                            ${parseFloat(p.precio_venta).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1 mt-3 pt-2.5 border-t border-slate-100">
                        <button
                          onClick={() => openDetailProduct(p)}
                          className="py-1 px-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded text-[11px] font-semibold border border-slate-200 flex items-center justify-center gap-1 cursor-pointer"
                          title="Consultar"
                        >
                          <span className="material-symbols-outlined text-xs">visibility</span>
                        </button>
                        {(hasPermiso('editar_producto') || isAdmin) && (
                          <button
                            onClick={() => openEditProduct(p)}
                            className="py-1 px-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded text-[11px] font-semibold border border-slate-200 flex items-center justify-center gap-1 cursor-pointer"
                            title="Modificar"
                          >
                            <span className="material-symbols-outlined text-xs">edit</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleSellInPos(p)}
                          disabled={!isActive || stock <= 0}
                          className="py-1 px-1 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 rounded text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 disabled:opacity-40 cursor-pointer"
                          title="Vender en POS"
                        >
                          <span className="material-symbols-outlined text-xs">point_of_sale</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* BARRA INFORMATIVA DE PIE DE TABLA Y CONTROL DE DESPLAZAMIENTO */}
        <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <div className="text-slate-500 font-medium text-[11px] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              Mostrando <strong className="text-slate-800">{filteredProducts.length}</strong> de{' '}
              <strong className="text-slate-800">{products.length}</strong> productos
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-700 font-medium">{activeCount} activos</span>
            {inactiveCount > 0 && (
              <span className="text-rose-600 font-medium">· {inactiveCount} inactivos</span>
            )}
          </div>

          <button
            onClick={scrollToTop}
            className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold flex items-center gap-1 text-[11px] transition-colors cursor-pointer shadow-2xs"
            title="Desplazarse al inicio de la tabla"
          >
            <span className="material-symbols-outlined text-sm">arrow_upward</span> Volver arriba
          </button>
        </div>
      </div>
    </section>
  );
};


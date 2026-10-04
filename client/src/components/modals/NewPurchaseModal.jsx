import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';

export const NewPurchaseModal = () => {
  const {
    activeModal,
    closeModal,
    purchaseInitialProduct,
    providers = [],
    products = [],
    createPurchase,
    showToast,
  } = useApp();

  if (activeModal !== 'new-purchase') return null;

  const activeProviders = useMemo(() =>
    providers.filter(p => (p.estado || 'ACTIVO').toUpperCase() === 'ACTIVO'),
    [providers]
  );

  const [selectedProduct, setSelectedProduct] = useState(purchaseInitialProduct || null);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [cantidad, setCantidad] = useState(10);
  const [costoUnitario, setCostoUnitario] = useState('100.00');
  const [observacion, setObservacion] = useState('');
  const [searchProd, setSearchProd] = useState('');
  const [filterMode, setFilterMode] = useState('TODOS'); // 'TODOS' | 'STOCK_BAJO'
  const [submitting, setSubmitting] = useState(false);

  // Inicializar o reaccionar a purchaseInitialProduct
  useEffect(() => {
    if (purchaseInitialProduct) {
      applySelectedProduct(purchaseInitialProduct);
    } else {
      setSelectedProduct(null);
    }
  }, [purchaseInitialProduct]);

  const applySelectedProduct = (prod) => {
    setSelectedProduct(prod);

    // Identificar proveedor asociado
    let matchedProvId = '';
    if (prod.id_proveedor) {
      const p = activeProviders.find(ap => ap.id_proveedor === prod.id_proveedor);
      if (p) matchedProvId = String(p.id_proveedor);
    }
    if (!matchedProvId && prod.proveedor_nombre) {
      const p = activeProviders.find(ap => ap.nombre?.toLowerCase() === prod.proveedor_nombre?.toLowerCase());
      if (p) matchedProvId = String(p.id_proveedor);
    }
    if (!matchedProvId && activeProviders.length > 0) {
      matchedProvId = String(activeProviders[0].id_proveedor);
    }
    setSelectedProviderId(matchedProvId);

    // Costo sugerido
    const costoSugerido = prod.costo
      ? parseFloat(prod.costo).toFixed(2)
      : parseFloat((parseFloat(prod.precio_venta || 100) * 0.65).toFixed(2)).toFixed(2);
    setCostoUnitario(costoSugerido);

    // Cantidad sugerida según stock actual y mínimo
    const currentStock = prod.stock !== undefined ? prod.stock : 0;
    const minStock = prod.stock_minimo || 5;
    const sugerido = currentStock <= minStock ? Math.max(10, (minStock * 2) - currentStock) : 10;
    setCantidad(sugerido);
  };

  // Filtrado de productos en caso de que no haya seleccionado ninguno
  const filteredProducts = useMemo(() => {
    const q = searchProd.toLowerCase().trim();
    return products.filter(p => {
      const isActive = (p.estado || 'ACTIVO').toUpperCase() === 'ACTIVO';
      if (!isActive) return false;

      const isLowStock = (p.stock !== undefined ? p.stock : 0) <= (p.stock_minimo || 5);
      if (filterMode === 'STOCK_BAJO' && !isLowStock) return false;

      if (!q) return true;
      return (
        p.nombre?.toLowerCase().includes(q) ||
        p.codigo?.toLowerCase().includes(q) ||
        p.categoria_nombre?.toLowerCase().includes(q) ||
        p.proveedor_nombre?.toLowerCase().includes(q)
      );
    });
  }, [products, searchProd, filterMode]);

  const lowStockCount = useMemo(() => {
    return products.filter(p =>
      (p.estado || 'ACTIVO').toUpperCase() === 'ACTIVO' &&
      (p.stock !== undefined ? p.stock : 0) <= (p.stock_minimo || 5)
    ).length;
  }, [products]);

  // Proveedor actual seleccionado
  const currentProviderObj = useMemo(() => {
    return activeProviders.find(p => String(p.id_proveedor) === String(selectedProviderId));
  }, [activeProviders, selectedProviderId]);

  // Cálculos
  const cantNum = Math.max(1, parseInt(cantidad) || 1);
  const costoNum = Math.max(0, parseFloat(costoUnitario) || 0);
  const totalCalculado = cantNum * costoNum;
  const currentStock = selectedProduct ? (selectedProduct.stock !== undefined ? selectedProduct.stock : 0) : 0;
  const nuevoStockProyectado = currentStock + cantNum;
  const pvp = selectedProduct ? parseFloat(selectedProduct.precio_venta || 0) : 0;
  const margenEstimado = pvp > 0 && costoNum > 0 ? (((pvp - costoNum) / pvp) * 100).toFixed(1) : '—';

  const handleRegisterPurchase = async (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      showToast('Selecciona un producto para la compra', 'warning');
      return;
    }
    if (!selectedProviderId) {
      showToast('Selecciona un proveedor autorizado', 'warning');
      return;
    }
    if (cantNum <= 0) {
      showToast('La cantidad debe ser mayor a 0', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        id_proveedor: parseInt(selectedProviderId),
        items: [
          {
            id_producto: selectedProduct.id_producto,
            cantidad: cantNum,
            costo_unitario: costoNum,
            subtotal: totalCalculado,
          }
        ],
        total: totalCalculado,
        observacion: observacion.trim() || `Reposición de stock: ${cantNum} unid. de ${selectedProduct.nombre}`,
      };

      await createPurchase(payload);
      closeModal();
    } catch (err) {
      showToast('Error al registrar compra: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full p-5 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden space-y-3.5">
        
        {/* Header — Estilo unificado con el resto del sistema */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-lg">local_shipping</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {selectedProduct ? 'Orden de Compra & Reposición' : 'Adquisición de Mercancía'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {selectedProduct
                  ? 'Verifica proveedor asociado, existencias a ingresar y costo'
                  : 'Selecciona primero el producto que necesitas adquirir o reponer'}
              </p>
            </div>
          </div>
          <button
            className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-100"
            onClick={closeModal}
            title="Cerrar"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex-1 overflow-y-auto space-y-3.5 text-xs pr-1">

          {/* VISTA 1: CATÁLOGO DE PRODUCTOS (SI NO HAY PRODUCTO SELECCIONADO) */}
          {!selectedProduct ? (
            <div className="space-y-3">
              {/* Buscador y Filtro */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 text-base">search</span>
                  <input
                    type="text"
                    value={searchProd}
                    onChange={(e) => setSearchProd(e.target.value)}
                    placeholder="Buscar producto por nombre, SKU o marca..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                    autoFocus
                  />
                </div>
                <div className="flex gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setFilterMode('TODOS')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer text-[11px] ${
                      filterMode === 'TODOS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Todos ({products.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode('STOCK_BAJO')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer text-[11px] flex items-center gap-1 ${
                      filterMode === 'STOCK_BAJO'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-amber-700 hover:bg-amber-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">warning</span>
                    Stock Bajo ({lowStockCount})
                  </button>
                </div>
              </div>

              {/* Lista de productos para seleccionar */}
              <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1 divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <span className="material-symbols-outlined text-3xl mb-1 text-slate-300">inventory_2</span>
                    <p className="font-semibold text-xs">No se encontraron productos coincidentes</p>
                    <p className="text-[11px] text-slate-400">Intenta con otro término de búsqueda</p>
                  </div>
                ) : (
                  filteredProducts.map(p => {
                    const stock = p.stock !== undefined ? p.stock : 0;
                    const min = p.stock_minimo || 5;
                    const isLow = stock <= min;
                    const prov = p.proveedor_nombre || (providers.find(pr => pr.id_proveedor === p.id_proveedor)?.nombre) || 'Distribuidor Mayorista';

                    return (
                      <div
                        key={p.id_producto}
                        onClick={() => applySelectedProduct(p)}
                        className="pt-2 pb-2 first:pt-0 flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-blue-50/60 transition-all cursor-pointer border border-transparent hover:border-blue-200 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={p.imagen_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=360&auto=format&fit=crop&q=80'}
                            alt={p.nombre}
                            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=360&auto=format&fit=crop&q=80'; }}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 bg-white"
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-800 text-xs truncate group-hover:text-blue-600 transition-colors">
                              {p.nombre}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                              <span className="font-mono text-slate-400">{p.codigo}</span>
                              <span className="text-slate-300">·</span>
                              <span className="text-slate-500 flex items-center gap-0.5 truncate">
                                <span className="material-symbols-outlined text-[12px] text-slate-400">business</span>
                                {prov}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                              stock === 0
                                ? 'bg-rose-100 text-rose-700'
                                : isLow
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            Stock: {stock}
                          </span>
                          <button
                            type="button"
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-[11px] flex items-center gap-1 transition-colors shadow-xs"
                          >
                            <span>Comprar</span>
                            <span className="material-symbols-outlined text-xs">arrow_forward</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* VISTA 2: FORMULARIO DE COMPRA CON PRODUCTO SELECCIONADO */
            <form onSubmit={handleRegisterPurchase} className="space-y-3.5">
              
              {/* Tarjeta del Producto Seleccionado */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={selectedProduct.imagen_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=360&auto=format&fit=crop&q=80'}
                    alt={selectedProduct.nombre}
                    onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=360&auto=format&fit=crop&q=80'; }}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0 bg-white"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="px-2 py-0.2 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">
                        {selectedProduct.categoria_nombre || 'Tecnología'}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">{selectedProduct.codigo}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs truncate" title={selectedProduct.nombre}>
                      {selectedProduct.nombre}
                    </h4>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                      <span>Stock actual: <strong className={currentStock <= (selectedProduct.stock_minimo || 5) ? 'text-amber-600' : 'text-slate-700'}>{currentStock}</strong></span>
                      <span>·</span>
                      <span>PVP Venta: <strong>${pvp.toFixed(2)}</strong></span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">sync_alt</span>
                  Cambiar
                </button>
              </div>

              {/* Selector de Proveedor Asociado */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 block">Proveedor Asociado / Distribuidor</label>
                  {selectedProduct.proveedor_nombre && (
                    <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[11px]">verified</span>
                      Proveedor habitual
                    </span>
                  )}
                </div>
                <select
                  value={selectedProviderId}
                  onChange={(e) => setSelectedProviderId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  required
                >
                  <option value="" disabled>-- Selecciona un proveedor --</option>
                  {activeProviders.map(pr => (
                    <option key={pr.id_proveedor} value={pr.id_proveedor}>
                      {pr.nombre} ({pr.identificacion || 'RUC'})
                    </option>
                  ))}
                </select>

                {currentProviderObj && (
                  <div className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-slate-400">badge</span>
                      {currentProviderObj.identificacion || 'RUC no reg.'}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-slate-400">call</span>
                      {currentProviderObj.telefono || 'Sin teléfono'}
                    </span>
                    <span className="flex items-center gap-1 truncate max-w-[180px]">
                      <span className="material-symbols-outlined text-xs text-slate-400">mail</span>
                      {currentProviderObj.correo || 'Sin correo'}
                    </span>
                  </div>
                )}
              </div>

              {/* Cantidad y Costo Unitario en 2 Columnas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Cantidad a adquirir */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700">Cantidad a Adquirir</label>
                    <span className="text-[10px] text-blue-600 font-medium">
                      Nuevo stock: <strong>{nuevoStockProyectado}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCantidad(prev => Math.max(1, (parseInt(prev) || 1) - 1))}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={cantidad}
                      onChange={(e) => setCantidad(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-center font-mono font-bold text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setCantidad(prev => (parseInt(prev) || 0) + 1)}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  {/* Botones de incremento rápido */}
                  <div className="flex gap-1 pt-1">
                    {[5, 10, 20, 50].map(inc => (
                      <button
                        key={inc}
                        type="button"
                        onClick={() => setCantidad(inc)}
                        className={`flex-1 py-0.5 rounded text-[10px] font-semibold border transition-colors cursor-pointer ${
                          cantNum === inc
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        +{inc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Costo Unitario */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700">Costo Unitario ($)</label>
                    <span className="text-[10px] text-slate-400">
                      Margen: <strong className="text-emerald-600">{margenEstimado}%</strong>
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-slate-400 font-mono text-xs">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={costoUnitario}
                      onChange={(e) => setCostoUnitario(e.target.value)}
                      className="w-full pl-6 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 pt-1">
                    Costo cobrado por el proveedor por cada unidad
                  </p>
                </div>
              </div>

              {/* Observación / Referencia */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Número de Factura de Proveedor / Observación</label>
                <input
                  type="text"
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  placeholder="Ej. Factura F001-9824, entrega en almacén principal..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Resumen del Total */}
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-blue-900 block">Total a Pagar al Proveedor</span>
                  <span className="text-[10px] text-blue-700">
                    {cantNum} unidades × ${costoNum.toFixed(2)} c/u
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-mono font-black text-blue-800">
                    ${totalCalculado.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedProviderId || cantNum <= 0}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>
                      <span>Registrando...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-xs">task_alt</span>
                      <span>Registrar Compra e Ingresar Stock</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};

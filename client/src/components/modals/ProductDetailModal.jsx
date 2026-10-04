import React from 'react';
import { useApp } from '../../context/AppContext';

export const ProductDetailModal = () => {
  const {
    activeModal,
    closeModal,
    productDetail,
    openEditProduct,
    openDeactivateProduct,
    addToCart,
    setCurrentView,
    hasPermiso,
    isAdmin
  } = useApp();

  if (activeModal !== 'detail-product' || !productDetail) return null;

  const isActive = (productDetail.estado || 'ACTIVO').toUpperCase() === 'ACTIVO';
  const stock = productDetail.stock !== undefined ? productDetail.stock : 0;
  const minStock = productDetail.stock_minimo || 5;
  const isLowStock = stock <= minStock;
  const pvp = parseFloat(productDetail.precio_venta) || 0;
  const cost = parseFloat(productDetail.costo) || (pvp * 0.65);
  const margin = pvp > 0 ? (((pvp - cost) / pvp) * 100).toFixed(1) : 0;

  const handleSellInPos = () => {
    addToCart(productDetail);
    setCurrentView('pos');
    closeModal();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <span className="material-symbols-outlined text-base">inventory_2</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Ficha Técnica de Producto</h3>
              <p className="text-[11px] text-slate-400">Consulta de especificaciones, precios e inventario</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Top Card: Image + Title */}
          <div className="flex gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl items-center">
            <img
              src={productDetail.imagen_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=360&auto=format&fit=crop&q=80'}
              alt={productDetail.nombre}
              onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=360&auto=format&fit=crop&q=80'; }}
              className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0 bg-white"
            />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-semibold text-[10px]">
                  {productDetail.categoria_nombre || 'Tecnología'}
                </span>
                <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] border ${
                  isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {isActive ? 'ACTIVO' : 'INACTIVO'}
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm truncate" title={productDetail.nombre}>
                {productDetail.nombre}
              </h4>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono flex-wrap">
                <p>Código: <span className="font-bold text-slate-700">{productDetail.codigo}</span></p>
                {productDetail.proveedor_nombre && (
                  <p className="flex items-center gap-1 text-slate-700 font-sans font-medium">
                    <span className="material-symbols-outlined text-xs text-blue-600">local_shipping</span>
                    <span>{productDetail.proveedor_nombre}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Precio Venta (PVP)</span>
              <span className="font-mono text-base font-bold text-slate-900 block mt-0.5">
                ${pvp.toFixed(2)}
              </span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Costo Referencial</span>
              <span className="font-mono text-base font-semibold text-slate-600 block mt-0.5">
                ${cost.toFixed(2)}
              </span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Margen Comercial</span>
              <span className="font-mono text-base font-bold text-emerald-600 block mt-0.5">
                {margin}%
              </span>
            </div>
          </div>

          {/* Stock & Inventory */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Control de Almacén &amp; Existencias
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg">
                <span className="text-slate-500">Stock Actual:</span>
                <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                  isLowStock ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {stock} unidades
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg">
                <span className="text-slate-500">Stock Mínimo:</span>
                <span className="font-mono font-semibold text-slate-700">
                  {minStock} unidades
                </span>
              </div>
            </div>

            {isLowStock && (
              <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-amber-600">warning</span>
                <span>Alerta: El stock actual se encuentra en o por debajo del mínimo de reposición.</span>
              </div>
            )}
          </div>

          {/* Description */}
          {productDetail.descripcion && (
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Descripción &amp; Especificaciones
              </span>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                {productDetail.descripcion}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0 bg-slate-50 rounded-b-2xl">
          <div className="flex items-center gap-1.5">
            {(hasPermiso('editar_producto') || isAdmin) && (
              <>
                <button
                  onClick={() => openEditProduct(productDetail)}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-xs">edit</span>
                  Modificar
                </button>
                <button
                  onClick={() => openDeactivateProduct(productDetail)}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-xs">
                    {isActive ? 'remove_shopping_cart' : 'add_shopping_cart'}
                  </span>
                  {isActive ? 'Desactivar' : 'Activar'}
                </button>
              </>
            )}
          </div>

          <button
            onClick={handleSellInPos}
            disabled={!isActive}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">point_of_sale</span>
            Vender en POS
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export const EditProductModal = () => {
  const { activeModal, closeModal, productToEdit, categories = [], providers = [], saveEditedProduct, showToast } = useApp();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('');
  const [categoryId, setCategoryId] = useState('1');
  const [providerId, setProviderId] = useState('1');
  const [imgUrl, setImgUrl] = useState('');

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.nombre || '');
      setSku(productToEdit.codigo || '');
      setPrice(productToEdit.precio_venta !== undefined ? String(productToEdit.precio_venta) : '');
      setCost(productToEdit.costo !== undefined ? String(productToEdit.costo) : '120.00');
      setStock(productToEdit.stock !== undefined ? String(productToEdit.stock) : '0');
      setMinStock(productToEdit.stock_minimo !== undefined ? String(productToEdit.stock_minimo) : '5');
      setCategoryId(String(productToEdit.id_categoria || '1'));
      setProviderId(String(productToEdit.id_proveedor || '1'));
      setImgUrl(productToEdit.imagen_url || '');
    }
  }, [productToEdit]);

  if (activeModal !== 'edit-product' || !productToEdit) return null;

  const costNum = parseFloat(cost) || 0;
  const priceNum = parseFloat(price) || 0;
  const profit = priceNum - costNum;
  const marginPct = priceNum > 0 ? ((profit / priceNum) * 100).toFixed(1) : '0';

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImgUrl(ev.target.result);
        showToast('Imagen actualizada', 'image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !price) return;

    const updateData = {
      nombre: name.trim(),
      precio_venta: priceNum,
      id_categoria: parseInt(categoryId),
      id_proveedor: parseInt(providerId),
      stock: parseInt(stock) || 0,
      stock_minimo: parseInt(minStock) || 5,
      imagen_url: imgUrl,
      costo: costNum
    };

    saveEditedProduct(productToEdit.id_producto, updateData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl mx-4 space-y-3.5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-lg">edit</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Editar Producto (Administrador)</h3>
              <p className="text-[11px] text-slate-500">
                Modifica precios, nombre, categoría y existencias de <strong className="text-slate-800">{name}</strong>
              </p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-slate-600 transition-colors" onClick={closeModal}>
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <form className="space-y-3 text-xs" onSubmit={handleSubmit}>
          {/* Image preview & upload */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Fotografía del Producto</label>
            <div className="flex gap-3 items-center">
              <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden relative shrink-0 flex items-center justify-center">
                <img src={imgUrl} alt="Vista Previa" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-2 text-center cursor-pointer transition-colors bg-slate-50 hover:bg-blue-50/50 block">
                  <span className="material-symbols-outlined text-blue-600 text-base block">cloud_upload</span>
                  <p className="text-[11px] font-semibold text-slate-700">Cambiar fotografía</p>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>
            </div>
          </div>

          {/* Commercial Name */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Nombre Comercial</label>
            <input
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Supplier */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-blue-600">local_shipping</span>
              Proveedor Asociado
            </label>
            <select
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
            >
              {providers.map((p) => (
                <option key={p.id_proveedor} value={p.id_proveedor}>
                  {p.nombre} {p.identificacion ? `(${p.identificacion})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Categoría</label>
            <select
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat.id_categoria} value={cat.id_categoria}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Cost, Selling Price & Profit Margin */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Precio Costo ($)</label>
                <input
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  min="0"
                  step="0.01"
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Precio Venta PVP ($)</label>
                <input
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-blue-700 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  min="0.01"
                  required
                  step="0.01"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-1 text-[11px] border-t border-slate-200">
              <span className="text-slate-500 font-medium">Margen Estimado de Ganancia:</span>
              <span className={`font-mono font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {profit >= 0 ? `+${marginPct}% ($${profit.toFixed(2)})` : `${marginPct}% ($${profit.toFixed(2)})`}
              </span>
            </div>
          </div>

          {/* Current Stock & Min Stock */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Stock Almacén</label>
              <input
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                min="0"
                required
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Stock Mínimo de Alerta</label>
              <input
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                min="1"
                required
                type="number"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
              onClick={closeModal}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1.5"
              type="submit"
            >
              <span className="material-symbols-outlined text-sm font-bold">save</span> Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

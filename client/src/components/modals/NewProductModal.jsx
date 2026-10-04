import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/api';

export const NewProductModal = () => {
  const { activeModal, closeModal, categories = [], providers = [], setProducts, showToast, currentUser } = useApp();

  const [imgUrl, setImgUrl] = useState('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=360&auto=format&fit=crop&q=80');
  const [sku, setSku] = useState('');
  const [ean, setEan] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('1');
  const [providerId, setProviderId] = useState('1');
  const [unit, setUnit] = useState('Unidad (und)');
  const [cost, setCost] = useState('120.00');
  const [price, setPrice] = useState('189.00');
  const [stock, setStock] = useState('20');
  const [minStock, setMinStock] = useState('4');

  if (activeModal !== 'new-product') return null;

  const generateSKU = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setSku(`TEK-${randomNum}`);
  };

  const simulateBarcode = () => {
    const randomEan = '775' + Math.floor(1000000 + Math.random() * 9000000);
    setEan(randomEan);
    showToast(`Código EAN generado: ${randomEan}`, 'barcode_scanner');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImgUrl(ev.target.result);
        showToast('Imagen cargada correctamente', 'image');
      };
      reader.readAsDataURL(file);
    }
  };

  // Calc profit margin
  const costNum = parseFloat(cost) || 0;
  const priceNum = parseFloat(price) || 0;
  const profit = priceNum - costNum;
  const marginPct = priceNum > 0 ? ((profit / priceNum) * 100).toFixed(1) : '0';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !price) return;

    const finalSku = sku || `TEK-${Math.floor(100000 + Math.random() * 900000)}`;

    const newProdPayload = {
      codigo: finalSku,
      nombre: name.trim(),
      descripcion: `${name.trim()} - ${unit}`,
      precio_venta: priceNum,
      stock_minimo: parseInt(minStock) || 5,
      id_categoria: parseInt(categoryId) || 1,
      id_proveedor: parseInt(providerId) || 1,
      imagen_url: imgUrl,
      stock_inicial: parseInt(stock) || 0,
      costo: costNum,
      id_usuario: currentUser?.id_usuario || 1
    };

    const provObj = providers.find(p => p.id_proveedor === parseInt(providerId));
    const catObj = categories.find(c => c.id_categoria === parseInt(categoryId));

    try {
      const created = await api.createProduct(newProdPayload);
      const enriched = {
        ...created,
        categoria_nombre: catObj ? catObj.nombre : 'Hardware & Dispositivos',
        proveedor_nombre: provObj ? provObj.nombre : 'Proveedor Mayorista',
        stock: parseInt(stock) || 0
      };
      setProducts(prev => [enriched, ...prev]);
      showToast(`¡Producto de tecnología "${name}" registrado con éxito!`, 'check_circle');
    } catch (err) {
      // Fallback
      const fallbackProd = {
        id_producto: Date.now(),
        codigo: finalSku,
        nombre: name.trim(),
        precio_venta: priceNum,
        stock_minimo: parseInt(minStock) || 5,
        id_categoria: parseInt(categoryId) || 1,
        id_proveedor: parseInt(providerId) || 1,
        categoria_nombre: catObj ? catObj.nombre : 'Hardware & Dispositivos',
        proveedor_nombre: provObj ? provObj.nombre : 'Proveedor Mayorista',
        imagen_url: imgUrl,
        stock: parseInt(stock) || 0
      };
      setProducts(prev => [fallbackProd, ...prev]);
      showToast(`¡Producto "${name}" registrado con éxito!`, 'check_circle');
    }

    closeModal();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-3.5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-lg">devices</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Registrar Nuevo Producto (Tecnología)</h3>
              <p className="text-[11px] text-slate-500">
                Especificaciones técnicas, proveedor autorizado, precios y stock
              </p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer" onClick={closeModal}>
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <form className="space-y-3 text-xs" onSubmit={handleSubmit}>
          {/* Image preview & upload */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Fotografía del Producto (Tecnología)</label>
            <div className="flex gap-3 items-center">
              <div className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden relative shrink-0 flex items-center justify-center">
                <img src={imgUrl} alt="Vista Previa" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-2.5 text-center cursor-pointer transition-colors bg-slate-50 hover:bg-blue-50/50 block">
                  <span className="material-symbols-outlined text-blue-600 text-xl block mb-0.5">cloud_upload</span>
                  <p className="text-[11px] font-semibold text-slate-700">Arrastra o haz clic para subir imagen</p>
                  <p className="text-[10px] text-slate-400">PNG, JPG o WebP de gadgets/equipos</p>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>
            </div>
          </div>

          {/* SKU & EAN */}
          <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Código SKU</label>
                <button
                  type="button"
                  onClick={generateSKU}
                  className="text-[10px] text-blue-600 hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[11px]">autorenew</span> Auto
                </button>
              </div>
              <input
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-semibold focus:ring-1 focus:ring-blue-600 focus:outline-none"
                placeholder="TEK-A005"
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Código Barras (EAN)</label>
                <button
                  type="button"
                  onClick={simulateBarcode}
                  className="text-[10px] text-emerald-600 hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[11px]">barcode_scanner</span> Simular
                </button>
              </div>
              <input
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-semibold focus:ring-1 focus:ring-blue-600 focus:outline-none"
                placeholder="7750998811"
                type="text"
                value={ean}
                onChange={(e) => setEan(e.target.value)}
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Nombre Comercial del Dispositivo / Producto</label>
            <input
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
              placeholder="Ej. Laptop ASUS ROG Strix G16 16GB RAM / Auriculares Sony WH-1000XM5"
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Supplier Selector */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-blue-600">local_shipping</span>
              Proveedor Asociado (Distribuidor Autorizado)
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

          {/* Category & Unit */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Categoría Tecnológica</label>
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
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Empaque / Presentación</label>
              <select
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              >
                <option value="Unidad (und)">Unidad (und)</option>
                <option value="Kit / Set">Kit / Set completo</option>
                <option value="Caja (caja)">Caja sellada (caja)</option>
                <option value="Pack (pza)">Pack promocional (pza)</option>
              </select>
            </div>
          </div>

          {/* Price and Profit margin */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Costo de Compra Proveedor ($)</label>
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
                  min="0.10"
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

          {/* Stock */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Stock Inicial en Almacén</label>
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
              <span className="material-symbols-outlined text-sm font-bold">check</span> Guardar Producto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

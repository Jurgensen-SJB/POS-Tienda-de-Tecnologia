import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const ManualItemModal = () => {
  const { activeModal, closeModal, addManualItem } = useApp();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState(1);

  if (activeModal !== 'manual-item') return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !price) return;
    addManualItem(name.trim(), price, qty);
    setName('');
    setPrice('');
    setQty(1);
    closeModal();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl mx-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-blue-600 text-xl">add_circle</span>
            <h3 className="font-bold text-slate-900 text-sm">Agregar Ítem Manual</h3>
          </div>
          <button className="text-slate-400 hover:text-slate-600" onClick={closeModal}>
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <form className="space-y-2.5 text-xs" onSubmit={handleSubmit}>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Nombre / Descripción</label>
            <input
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
              placeholder="Ej. Empaque para regalo especial"
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Precio ($)</label>
              <input
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                min="0.05"
                placeholder="5.00"
                required
                step="0.01"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Cantidad</label>
              <input
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                min="1"
                required
                type="number"
                value={qty}
                onChange={(e) => setQty(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
              onClick={closeModal}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-xs"
              type="submit"
            >
              Agregar al Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

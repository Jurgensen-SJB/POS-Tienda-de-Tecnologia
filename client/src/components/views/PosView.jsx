import React, { useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { CategoryFilter } from '../pos/CategoryFilter';
import { ProductGrid } from '../pos/ProductGrid';
import { ClientSelector } from '../pos/ClientSelector';
import { CartPanel } from '../pos/CartPanel';
import { PaymentPanel } from '../pos/PaymentPanel';

export const PosView = () => {
  const {
    searchQuery,
    setSearchQuery,
    openModal,
    showToast,
    products,
    addToCart,
    lastItemAdded,
    ticketCounter
  } = useApp();

  const searchInputRef = useRef(null);

  const triggerScanSimulation = () => {
    // Pick a random product from list
    if (products.length > 0) {
      const randomProd = products[Math.floor(Math.random() * products.length)];
      addToCart(randomProd);
      showToast(`Escáner EAN: + ${randomProd.nombre}`, 'qr_code_scanner');
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return;
      const match = products.find(
        (p) =>
          p.codigo.toLowerCase() === q ||
          p.nombre.toLowerCase().includes(q)
      );
      if (match) {
        addToCart(match);
        setSearchQuery('');
      } else {
        showToast('Producto no encontrado por código', 'warning');
      }
    }
  };

  return (
    <section className="h-full flex flex-col" id="view-pos">
      <div className="grid grid-cols-12 gap-3 h-full">
        {/* Left: Catalog and 4x3 Grid (8 columns) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-2.5 h-full min-h-0">
          {/* Search bar & operational buttons */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2 shrink-0">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-600 text-lg font-bold">
                barcode_scanner
              </span>
              <input
                ref={searchInputRef}
                className="w-full pl-9 pr-20 py-1.5 bg-slate-100 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                id="pos-search-input"
                placeholder="Escanear código de barras o escribir producto..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              <button
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-medium rounded flex items-center gap-1 transition-colors"
                onClick={triggerScanSimulation}
              >
                <span className="material-symbols-outlined text-[13px]">qr_code_scanner</span> Escanear
              </button>
            </div>

            <button
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
              onClick={() => openModal('manual-item')}
            >
              <span className="material-symbols-outlined text-blue-600 text-sm">add_circle</span> Ítem Manual
            </button>
            <button
              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
              onClick={() => openModal('promo')}
            >
              <span className="material-symbols-outlined text-sm">percent</span> % Promo (F4)
            </button>
          </div>

          {/* Category Filter Pills */}
          <CategoryFilter />

          {/* Strict 4x3 Grid */}
          <ProductGrid />

          {/* Bottom scale and turno info */}
          <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between text-[11px] text-slate-500 shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-700">
                Última lectura: <span className="text-blue-600 font-mono font-bold" id="metric-last-item">{lastItemAdded}</span>
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span
                className="text-emerald-600 font-medium flex items-center gap-1 cursor-pointer hover:underline"
                onClick={() => showToast('Balanza RS232: 0.000 kg (Calibrada)', 'scale')}
              >
                <span className="material-symbols-outlined text-xs">wifi</span> Balanza RS232 Conectada
              </span>
            </div>
            <span className="font-semibold text-slate-700" id="label-tickets-turno">
              Ventas del turno: {ticketCounter - 808} tickets
            </span>
          </div>
        </div>

        {/* Right: Ticket and Payment (4 columns) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-2 h-full min-h-0">
          <ClientSelector />
          <CartPanel />
          <PaymentPanel />
        </div>
      </div>
    </section>
  );
};

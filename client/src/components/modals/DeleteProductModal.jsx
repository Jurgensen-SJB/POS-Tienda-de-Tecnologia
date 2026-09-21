import React from 'react';
import { useApp } from '../../context/AppContext';

export const DeleteProductModal = () => {
  const { activeModal, closeModal, productToDelete, deleteProductConfirmed } = useApp();

  if (activeModal !== 'delete-product' || !productToDelete) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl mx-4 space-y-3 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-2xl">delete_forever</span>
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-sm">¿Eliminar producto del catálogo?</h3>
          <p className="text-xs text-slate-500 mt-1">
            Se dará de baja al producto <strong className="text-slate-800">{productToDelete.nombre}</strong>.
          </p>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
            onClick={closeModal}
          >
            Cancelar
          </button>
          <button
            className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition-colors shadow-xs"
            onClick={deleteProductConfirmed}
          >
            Sí, Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

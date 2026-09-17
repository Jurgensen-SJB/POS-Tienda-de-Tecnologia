import React from 'react';
import { useApp } from '../../context/AppContext';

export const Toast = () => {
  const { toast } = useApp();

  return (
    <div
      id="toast"
      className={`fixed bottom-5 right-5 z-50 transform transition-all duration-300 pointer-events-none bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-medium ${
        toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
      }`}
    >
      <span className="material-symbols-outlined text-emerald-400 text-base" id="toast-icon">
        {toast.icon || 'check_circle'}
      </span>
      <span id="toast-text">{toast.text}</span>
    </div>
  );
};

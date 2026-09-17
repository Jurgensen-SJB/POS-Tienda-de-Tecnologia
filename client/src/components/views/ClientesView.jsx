import React from 'react';
import { useApp } from '../../context/AppContext';

export const ClientesView = () => {
  const { clients, assignClient, setCurrentView, openModal } = useApp();

  const handleUseInPos = (client) => {
    const fullName = `${client.nombres} ${client.apellidos || ''}`.trim();
    const doc = `${client.tipo_identificacion || 'DOC'}: ${client.numero_identificacion}`;
    assignClient(fullName, doc, client.id_cliente);
    setCurrentView('pos');
  };

  return (
    <section className="flex flex-col gap-3 h-full overflow-y-auto pr-1" id="view-clientes">
      {/* Header */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">group</span> Directorio de Clientes
          </h2>
          <p className="text-xs text-slate-500">Cuentas corrientes, facturación y puntos de fidelidad</p>
        </div>
        <button
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors shadow-xs"
          onClick={() => openModal('client')}
        >
          <span className="material-symbols-outlined text-sm">person_add</span> Registrar Cliente
        </button>
      </div>

      {/* Grid of Client cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs" id="clients-card-list">
        {clients.map((c) => {
          const fullName = `${c.nombres} ${c.apellidos || ''}`.trim();
          const doc = `${c.tipo_identificacion || 'DOC'}: ${c.numero_identificacion}`;
          const desc = c.id_cliente === 1 ? 'Público General • Boleta rápida' : 'Facturación y Boleta';

          return (
            <div
              key={c.id_cliente}
              className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-2"
            >
              <div className="font-bold text-slate-900">{fullName}</div>
              <p className="text-slate-400 text-[11px]">{doc} • {desc}</p>
              <button
                className="text-blue-600 font-bold hover:underline"
                onClick={() => handleUseInPos(c)}
              >
                Usar en POS
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};

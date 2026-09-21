import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/api';

export const ClientModal = () => {
  const { activeModal, closeModal, clients, setClients, assignClient, showToast } = useApp();

  const [newName, setNewName] = useState('');
  const [newDoc, setNewDoc] = useState('');

  if (activeModal !== 'client') return null;

  const handleQuickCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newDoc.trim()) return;

    try {
      const created = await api.createClient({
        tipo_identificacion: newDoc.length > 8 ? 'RUC' : 'DNI',
        numero_identificacion: newDoc.trim(),
        nombres: newName.trim(),
        apellidos: '',
      });

      setClients(prev => [...prev, created]);
      assignClient(created.nombres, `DNI/RUC: ${created.numero_identificacion}`, created.id_cliente);
      showToast('Cliente guardado y asignado al ticket', 'person');
      setNewName('');
      setNewDoc('');
    } catch (err) {
      assignClient(newName.trim(), `DNI/RUC: ${newDoc.trim()}`);
      showToast('Cliente asignado al ticket', 'person');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl mx-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-blue-600 text-xl">person_search</span>
            <h3 className="font-bold text-slate-900 text-sm">Asignar Cliente al Ticket</h3>
          </div>
          <button className="text-slate-400 hover:text-slate-600" onClick={closeModal}>
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <div className="space-y-2 text-xs">
          {/* Default: Consumidor Final */}
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-base">person_off</span>
              </div>
              <div>
                <p className="font-bold text-xs text-blue-900">Consumidor Final (Sin Registro)</p>
                <p className="text-[10px] text-blue-600 font-medium">Público General • Boleta rápida</p>
              </div>
            </div>
            <button
              onClick={() => assignClient('Consumidor Final', 'DNI/RUC: Sin registrar', 1)}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-xs font-bold">check</span> Asignar
            </button>
          </div>

          {/* Frequent Clients List */}
          <span className="font-semibold text-slate-700 block text-[11px] pt-1">
            Clientes Frecuentes Registrados:
          </span>
          <div className="space-y-1 max-h-36 overflow-y-auto">
            {clients.filter(c => c.id_cliente !== 1 && (c.estado || 'ACTIVO').toUpperCase() === 'ACTIVO').map((c) => {
              const fullName = `${c.nombres} ${c.apellidos || ''}`.trim();
              const docLabel = `${c.tipo_identificacion || 'DOC'}: ${c.numero_identificacion}`;
              return (
                <div
                  key={c.id_cliente}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors"
                  onClick={() => assignClient(fullName, docLabel, c.id_cliente)}
                >
                  <div>
                    <p className="font-bold text-slate-800">{fullName}</p>
                    <p className="text-[10px] text-slate-400">{docLabel}</p>
                  </div>
                  <span className="text-blue-600 font-bold text-xs">Seleccionar</span>
                </div>
              );
            })}
          </div>

          {/* Quick client register */}
          <div className="pt-2 border-t border-slate-100">
            <span className="font-semibold text-slate-700 block text-[11px] mb-1">
              Registrar Nuevo Cliente Rápido:
            </span>
            <form className="space-y-2" onSubmit={handleQuickCreate}>
              <input
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                placeholder="Nombre / Razón Social"
                required
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <input
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                placeholder="DNI o RUC"
                required
                type="text"
                value={newDoc}
                onChange={(e) => setNewDoc(e.target.value)}
              />
              <button
                className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                type="submit"
              >
                Asignar y Guardar
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

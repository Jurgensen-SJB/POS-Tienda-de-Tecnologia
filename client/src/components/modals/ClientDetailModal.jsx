import React from 'react';
import { useApp } from '../../context/AppContext';

export const ClientDetailModal = () => {
  const {
    activeModal,
    closeModal,
    clientDetail,
    openEditClient,
    openDeactivateClient,
    assignClient,
    setCurrentView
  } = useApp();

  if (activeModal !== 'detail-client' || !clientDetail) return null;

  const isActive = (clientDetail.estado || 'ACTIVO').toUpperCase() === 'ACTIVO';
  const fullName = `${clientDetail.nombres} ${clientDetail.apellidos || ''}`.trim();
  const docLabel = `${clientDetail.tipo_identificacion || 'DOC'}: ${clientDetail.numero_identificacion}`;

  const getInitials = (n, a) => {
    const first = n ? n[0] : 'C';
    const second = a ? a[0] : '';
    return `${first}${second}`.toUpperCase();
  };

  const handleUseInPos = () => {
    assignClient(fullName, docLabel, clientDetail.id_cliente);
    setCurrentView('pos');
    closeModal();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-sm border border-slate-200">
              {getInitials(clientDetail.nombres, clientDetail.apellidos)}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{fullName}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono text-[11px] text-slate-400">{docLabel}</span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                  isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {isActive ? 'ACTIVO' : 'INACTIVO'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* General Info Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Datos de Contacto e Identificación
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">Tipo de Documento</span>
                <span className="font-semibold text-slate-700">{clientDetail.tipo_identificacion || 'DNI'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Número de Documento</span>
                <span className="font-mono font-semibold text-slate-700">{clientDetail.numero_identificacion}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Teléfono / Celular</span>
                <span className="font-semibold text-slate-700">{clientDetail.telefono || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Correo Electrónico</span>
                <span className="font-semibold text-slate-700 truncate block">{clientDetail.correo || '—'}</span>
              </div>
            </div>

            {clientDetail.direccion && (
              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-slate-400 text-[10px] block">Dirección Fiscal / Entrega</span>
                <span className="font-medium text-slate-700">{clientDetail.direccion}</span>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Código Cliente</span>
              <span className="font-mono text-sm font-bold text-slate-800">#CLI-{String(clientDetail.id_cliente).padStart(4, '0')}</span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estado de Cuenta</span>
              <span className={`text-xs font-bold ${isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isActive ? 'Habilitado para compras' : 'Bloqueado para compras'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0 bg-slate-50 rounded-b-2xl">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => openEditClient(clientDetail)}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-xs">edit</span>
              Modificar
            </button>
            {clientDetail.id_cliente !== 1 && (
              <button
                onClick={() => openDeactivateClient(clientDetail)}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-xs">
                  {isActive ? 'person_off' : 'how_to_reg'}
                </span>
                {isActive ? 'Desactivar' : 'Activar'}
              </button>
            )}
          </div>

          <button
            onClick={handleUseInPos}
            disabled={!isActive}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">point_of_sale</span>
            Usar en POS
          </button>
        </div>
      </div>
    </div>
  );
};

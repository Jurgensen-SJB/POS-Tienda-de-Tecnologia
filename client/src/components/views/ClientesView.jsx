import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const ClientesView = () => {
  const {
    clients,
    assignClient,
    setCurrentView,
    openModal,
    openDetailClient,
    openEditClient,
    openDeactivateClient,
    hasPermiso,
    isAdmin
  } = useApp();

  const [filterEstado, setFilterEstado] = useState('ACTIVO');
  const [searchTerm, setSearchTerm] = useState('');

  const handleUseInPos = (client) => {
    const fullName = `${client.nombres} ${client.apellidos || ''}`.trim();
    const doc = `${client.tipo_identificacion || 'DOC'}: ${client.numero_identificacion}`;
    assignClient(fullName, doc, client.id_cliente);
    setCurrentView('pos');
  };

  const getInitials = (n, a) => {
    const first = n ? n[0] : 'C';
    const second = a ? a[0] : '';
    return `${first}${second}`.toUpperCase();
  };

  const filtered = clients.filter((c) => {
    const estado = (c.estado || 'ACTIVO').toUpperCase();
    const matchEstado = filterEstado === 'TODOS' || estado === filterEstado;
    const q = searchTerm.trim().toLowerCase();
    const matchSearch =
      !q ||
      (c.nombres && c.nombres.toLowerCase().includes(q)) ||
      (c.apellidos && c.apellidos.toLowerCase().includes(q)) ||
      (c.numero_identificacion && c.numero_identificacion.includes(q)) ||
      (c.correo && c.correo.toLowerCase().includes(q)) ||
      (c.telefono && c.telefono.includes(q));
    return matchEstado && matchSearch;
  });

  const activeCount = clients.filter(c => (c.estado || 'ACTIVO').toUpperCase() === 'ACTIVO').length;
  const inactiveCount = clients.filter(c => (c.estado || 'ACTIVO').toUpperCase() === 'INACTIVO').length;

  return (
    <section className="flex flex-col gap-3 h-full overflow-y-auto pr-1" id="view-clientes">
      {/* Header */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">group</span>
              Directorio de Clientes
            </h2>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full border border-slate-200">
              {clients.length} registrados
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {activeCount} activo{activeCount !== 1 ? 's' : ''}
            {inactiveCount > 0 && ` · ${inactiveCount} inactivo${inactiveCount !== 1 ? 's' : ''}`}
          </p>
        </div>

        {(hasPermiso('crear_cliente') || isAdmin) && (
          <button
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
            onClick={() => openModal('new-client')}
            id="btn-new-client"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            Nuevo cliente
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre, documento, correo o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
          />
        </div>

        <div className="flex gap-0.5 bg-white border border-slate-200 rounded-lg p-0.5 text-xs">
          {['ACTIVO', 'INACTIVO', 'TODOS'].map((est) => (
            <button
              key={est}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterEstado === est
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
              onClick={() => setFilterEstado(est)}
            >
              {est.charAt(0) + est.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Client cards */}
      {filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-white rounded-xl border border-slate-200 py-12 gap-2">
          <span className="material-symbols-outlined text-3xl text-slate-300">group_off</span>
          <p className="text-xs">No hay clientes que coincidan con los filtros de búsqueda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 text-xs" id="clients-card-list">
          {filtered.map((c) => {
            const fullName = `${c.nombres} ${c.apellidos || ''}`.trim();
            const docLabel = `${c.tipo_identificacion || 'DOC'}: ${c.numero_identificacion}`;
            const isActive = (c.estado || 'ACTIVO').toUpperCase() === 'ACTIVO';
            const initials = getInitials(c.nombres, c.apellidos);
            const isConsumidorFinal = c.id_cliente === 1;

            return (
              <div
                key={c.id_cliente}
                className={`bg-white rounded-xl border border-slate-200 p-3.5 space-y-3 transition-all ${
                  !isActive ? 'opacity-55' : 'hover:border-slate-300'
                }`}
              >
                {/* Header Row */}
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 border border-slate-200">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 truncate" title={fullName}>
                      {fullName}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-[10px] text-slate-500">{docLabel}</span>
                      <span className={`px-1 py-0.2 rounded text-[9px] font-bold border ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact details */}
                <div className="space-y-1 text-[11px] text-slate-500">
                  {c.telefono && c.telefono !== '-' && (
                    <p className="truncate flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[13px] text-slate-400">phone</span>
                      {c.telefono}
                    </p>
                  )}
                  {c.correo && c.correo !== '-' && (
                    <p className="truncate flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[13px] text-slate-400">mail</span>
                      {c.correo}
                    </p>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100" />

                {/* Actions */}
                <div className="flex gap-1.5">
                  <button
                    onClick={() => openDetailClient(c)}
                    className="flex-1 py-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center gap-1 transition-colors font-medium text-[10px]"
                    title="Consultar datos completos"
                  >
                    <span className="material-symbols-outlined text-[12px]">visibility</span>
                    Consultar
                  </button>

                  {!isConsumidorFinal && (
                    <>
                      <button
                        onClick={() => openEditClient(c)}
                        className="flex-1 py-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center gap-1 transition-colors font-medium text-[10px]"
                        title="Modificar cliente"
                      >
                        <span className="material-symbols-outlined text-[12px]">edit</span>
                        Modificar
                      </button>

                      <button
                        onClick={() => openDeactivateClient(c)}
                        className="flex-1 py-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center gap-1 transition-colors font-medium text-[10px]"
                        title={isActive ? 'Desactivar cliente' : 'Activar cliente'}
                      >
                        <span className="material-symbols-outlined text-[12px]">
                          {isActive ? 'person_off' : 'how_to_reg'}
                        </span>
                        {isActive ? 'Desactivar' : 'Activar'}
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => handleUseInPos(c)}
                    disabled={!isActive}
                    className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 rounded-lg flex items-center justify-center gap-1 transition-colors font-semibold text-[10px] disabled:opacity-40"
                    title="Asignar al ticket del Terminal POS"
                  >
                    <span className="material-symbols-outlined text-[12px]">point_of_sale</span>
                    En POS
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

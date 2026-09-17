import React from 'react';
import { useApp } from '../../context/AppContext';

export const EmpleadosView = () => {
  const { employees, openModal } = useApp();

  const getAvatarBg = (role) => {
    if (role === 'Administrador' || role === 'Administradora') return 'bg-blue-600';
    if (role.includes('Supervisor')) return 'bg-emerald-600';
    return 'bg-amber-500';
  };

  const getInitials = (nombres, apellidos) => {
    const first = nombres ? nombres[0] : 'E';
    const second = apellidos ? apellidos[0] : 'M';
    return `${first}${second}`.toUpperCase();
  };

  return (
    <section className="flex flex-col gap-3 h-full overflow-y-auto pr-1" id="view-empleados">
      {/* Header */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">badge</span> Personal y Auditoría de Acciones
          </h2>
          <p className="text-xs text-slate-500">Gestión de credenciales RBAC y bitácora de transacciones</p>
        </div>
        <button
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors shadow-xs"
          onClick={() => openModal('new-user')}
        >
          <span className="material-symbols-outlined text-sm">person_add</span> Nuevo Colaborador
        </button>
      </div>

      {/* Grid of Team cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs" id="team-cards-grid">
        {employees.map((emp) => {
          const role = emp.rol || emp.cargo || 'Cajero';
          const initials = getInitials(emp.nombres, emp.apellidos);
          const perms =
            role === 'Administrador' || role === 'Administradora'
              ? 'Control Total / Cierres Z / Anulaciones'
              : role.includes('Supervisor')
              ? 'Aperturas / Arqueos X / Descuentos 30%'
              : 'Cobro Estándar / Emisión de Boletas';

          return (
            <div
              key={emp.id_empleado}
              className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full ${getAvatarBg(
                      role
                    )} text-white font-bold flex items-center justify-center text-xs`}
                  >
                    {initials}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">
                      {emp.nombres} {emp.apellidos || ''}
                    </h4>
                    <span className="text-[10px] text-blue-600 font-semibold">{role}</span>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                  {emp.estado || 'Activo'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                {perms}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

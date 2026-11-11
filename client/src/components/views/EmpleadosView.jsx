import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import cajeroImg from '../../assets/img/cajero.webp';
import adminImg from '../../assets/img/admin.webp';
import superImg from '../../assets/img/super.webp';

const getRoleAvatar = (rol = '') => {
  const r = rol.toLowerCase();
  if (r.includes('super')) return superImg;
  if (r.includes('admin')) return adminImg;
  return cajeroImg;
};

export const EmpleadosView = () => {
  const {
    employees,
    openModal,
    openDetailEmployee,
    openEditEmployee,
    openDeactivateEmployee,
    resendVerification,
    refreshVerificationStatus,
    isAdmin,
    hasPermiso
  } = useApp();

  const [filterEstado, setFilterEstado] = useState('ACTIVO');
  const [searchTerm, setSearchTerm] = useState('');

  const getRoleBadge = (role = '') => {
    if (role.includes('Admin')) return { dot: '#6b7280', label: 'Admin' };
    if (role.includes('Supervis')) return { dot: '#9ca3af', label: 'Supervisor' };
    return { dot: '#d1d5db', label: 'Cajero' };
  };

  const filtered = employees.filter((emp) => {
    const estado = (emp.estado || 'ACTIVO').toUpperCase();
    const matchEstado = filterEstado === 'TODOS' || estado === filterEstado;
    const q = searchTerm.trim().toLowerCase();
    const matchSearch =
      !q ||
      (emp.nombres && emp.nombres.toLowerCase().includes(q)) ||
      (emp.apellidos && emp.apellidos.toLowerCase().includes(q)) ||
      (emp.rol && emp.rol.toLowerCase().includes(q)) ||
      (emp.cargo && emp.cargo.toLowerCase().includes(q)) ||
      (emp.correo && emp.correo.toLowerCase().includes(q)) ||
      (emp.numero_identificacion && emp.numero_identificacion.includes(q));
    return matchEstado && matchSearch;
  });

  const activeCount = employees.filter(e => (e.estado || 'ACTIVO').toUpperCase() === 'ACTIVO').length;
  const inactiveCount = employees.filter(e => (e.estado || 'ACTIVO').toUpperCase() === 'INACTIVO').length;
  const verifiedCount = employees.filter(e => Boolean(e.correo_verificado)).length;

  return (
    <section className="flex flex-col gap-3 h-full overflow-y-auto pr-1" id="view-empleados">
      {/* Header */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-500" style={{fontSize:'18px'}}>badge</span>
              Colaboradores &amp; Usuarios del Sistema
            </h2>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
              {verifiedCount}/{employees.length} correos verificados
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {activeCount} activo{activeCount !== 1 ? 's' : ''}
            {inactiveCount > 0 && ` · ${inactiveCount} inactivo${inactiveCount !== 1 ? 's' : ''}`}
            {' · '}Requiere verificación de correo para iniciar sesión
          </p>
        </div>
        {hasPermiso('crear_empleado') && (
          <button
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            onClick={() => openModal('new-user')}
            id="btn-new-employee"
          >
            <span className="material-symbols-outlined" style={{fontSize:'15px'}}>person_add</span>
            Nuevo colaborador
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" style={{fontSize:'15px'}}>search</span>
          <input
            className="w-full pl-8 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
            placeholder="Buscar por nombre, rol, correo o documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-0.5 bg-white border border-slate-200 rounded-lg p-0.5 text-xs">
          {['ACTIVO', 'INACTIVO', 'TODOS'].map((est) => (
            <button
              key={est}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                filterEstado === est
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
              onClick={() => setFilterEstado(est)}
            >
              {est.charAt(0) + est.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-white rounded-xl border border-slate-200 py-12 gap-2">
          <span className="material-symbols-outlined text-3xl text-slate-300">manage_accounts</span>
          <p className="text-xs">Sin colaboradores que coincidan con los filtros</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 text-xs" id="team-cards-grid">
          {filtered.map((emp) => {
            const role = emp.rol || emp.cargo || 'Cajero';
            const { dot, label } = getRoleBadge(role);
            const isActive = (emp.estado || 'ACTIVO').toUpperCase() === 'ACTIVO';
            const isVerified = emp.correo_verificado !== undefined ? Boolean(emp.correo_verificado) : true;

            return (
              <div
                key={emp.id_empleado}
                className={`bg-white rounded-xl border p-3.5 space-y-3 transition-opacity ${
                  !isActive ? 'opacity-55 border-slate-200' : isVerified ? 'border-slate-200' : 'border-amber-200 bg-amber-50/15'
                }`}
              >
                {/* Top row */}
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden border-2 border-slate-200 shadow-sm">
                    <img
                      src={getRoleAvatar(emp.rol || emp.cargo)}
                      alt={emp.rol || 'empleado'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 truncate">
                      {emp.nombres} {emp.apellidos || ''}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: dot }} />
                      <span className="text-[10px] text-slate-500">{label}</span>
                      {!isActive && (
                        <span className="text-[10px] text-slate-400 border border-slate-200 px-1 rounded">inactivo</span>
                      )}
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold border flex items-center gap-0.5 ${
                          isVerified
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>
                          {isVerified ? 'verified' : 'mark_email_unread'}
                        </span>
                        {isVerified ? 'Correo Verificado' : 'Sin Verificar'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Email */}
                {emp.correo && (
                  <p className="text-[10px] text-slate-400 truncate flex items-center gap-1.5">
                    <span className="material-symbols-outlined" style={{fontSize:'12px'}}>mail</span>
                    {emp.correo}
                  </p>
                )}

                {/* Acciones de verificación de correo si está pendiente */}
                {!isVerified && (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between gap-1.5">
                    <span className="text-[10px] text-amber-800 font-semibold truncate">
                      Acceso bloqueado hasta verificar
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {emp.verificationUrl && (
                        <button
                          type="button"
                          onClick={() => window.open(emp.verificationUrl, '_blank')}
                          className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold cursor-pointer"
                          title="Abrir enlace de confirmación"
                        >
                          Confirmar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => resendVerification('empleado', emp.id_empleado)}
                        className="p-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded cursor-pointer"
                        title="Reenviar enlace al correo"
                      >
                        <span className="material-symbols-outlined text-xs">forward_to_inbox</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => refreshVerificationStatus('empleado', emp.id_empleado)}
                        className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer"
                        title="Actualizar estado de verificación"
                      >
                        <span className="material-symbols-outlined text-xs">sync</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Usuario de acceso — solo visible para admin */}
                {isAdmin && emp.nombre_usuario && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="material-symbols-outlined text-slate-400" style={{fontSize:'12px'}}>manage_accounts</span>
                    <span className="text-[10px] text-slate-500">Usuario:</span>
                    <span className="text-[10px] font-mono font-semibold text-slate-700">{emp.nombre_usuario}</span>
                  </div>
                )}
                {isAdmin && !emp.nombre_usuario && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 border border-amber-200 rounded-lg">
                    <span className="material-symbols-outlined text-amber-500" style={{fontSize:'12px'}}>warning</span>
                    <span className="text-[10px] text-amber-600">Sin usuario de acceso asignado</span>
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-slate-100" />

                {/* Actions */}
                <div className="flex gap-1.5">
                  <button
                    onClick={() => openDetailEmployee(emp)}
                    className="flex-1 py-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center gap-1 transition-colors font-medium text-[10px] cursor-pointer"
                  >
                    <span className="material-symbols-outlined" style={{fontSize:'12px'}}>visibility</span>
                    Consultar
                  </button>
                  {(isAdmin || hasPermiso('modificar_empleado')) && (
                    <button
                      onClick={() => openEditEmployee(emp)}
                      className="flex-1 py-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center gap-1 transition-colors font-medium text-[10px] cursor-pointer"
                    >
                      <span className="material-symbols-outlined" style={{fontSize:'12px'}}>edit</span>
                      Modificar
                    </button>
                  )}
                  {hasPermiso('desactivar_empleado') && (
                    <button
                      onClick={() => openDeactivateEmployee(emp)}
                      className="flex-1 py-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center gap-1 transition-colors font-medium text-[10px] cursor-pointer"
                    >
                      <span className="material-symbols-outlined" style={{fontSize:'12px'}}>
                        {isActive ? 'person_off' : 'how_to_reg'}
                      </span>
                      {isActive ? 'Desactivar' : 'Activar'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

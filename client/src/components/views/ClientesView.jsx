import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/api';

export const ClientesView = () => {
  const {
    clients,
    assignClient,
    setCurrentView,
    openModal,
    openDetailClient,
    openEditClient,
    openDeactivateClient,
    openDeleteClient,
    validateOtp,
    resendVerification,
    refreshVerificationStatus,
    hasPermiso,
    isAdmin,
    showToast
  } = useApp();

  const [filterEstado, setFilterEstado] = useState('ACTIVO');
  const [filterVerificacion, setFilterVerificacion] = useState('TODOS'); // 'TODOS' | 'VERIFICADOS' | 'PENDIENTES'
  const [searchTerm, setSearchTerm] = useState('');
  const [otpTargetClient, setOtpTargetClient] = useState(null);
  const [otpCodeInput, setOtpCodeInput] = useState('');
  const [validatingOtpCode, setValidatingOtpCode] = useState(false);
  const [smtpStatus, setSmtpStatus] = useState({ configured: false, mode: 'ethereal', user: '' });
  const [showSmtpModal, setShowSmtpModal] = useState(false);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [savingSmtp, setSavingSmtp] = useState(false);

  useEffect(() => {
    api.getSmtpConfig()
      .then((res) => {
        if (res) {
          setSmtpStatus(res);
          if (res.user) setSmtpUser(res.user);
          if (res.host) setSmtpHost(res.host);
          if (res.port) setSmtpPort(String(res.port));
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveSmtp = async (e) => {
    e.preventDefault();
    if (!smtpUser.trim() || !smtpPass.trim()) {
      showToast('Ingresa el correo remitente y la contraseña de aplicación', 'warning');
      return;
    }
    setSavingSmtp(true);
    try {
      const res = await api.saveSmtpConfig({
        host: smtpHost.trim() || 'smtp.gmail.com',
        port: parseInt(smtpPort || '587', 10),
        user: smtpUser.trim(),
        pass: smtpPass.trim(),
      });
      setSmtpStatus(res);
      setShowSmtpModal(false);
      setSmtpPass('');
      showToast(`Correo real activado con ${res.user}. Los correos ahora llegarán a la bandeja real.`, 'verified');
    } catch (err) {
      showToast(err.message || 'Error al configurar SMTP', 'error');
    } finally {
      setSavingSmtp(false);
    }
  };

  const handleUseInPos = (client) => {
    const fullName = `${client.nombres} ${client.apellidos || ''}`.trim();
    const doc = `${client.tipo_identificacion || 'DOC'}: ${client.numero_identificacion}`;
    const ok = assignClient(fullName, doc, client.id_cliente, Boolean(client.correo_verificado), client.correo);
    if (ok) {
      setCurrentView('pos');
    }
  };

  const getInitials = (n, a) => {
    const first = n ? n[0] : 'C';
    const second = a ? a[0] : '';
    return `${first}${second}`.toUpperCase();
  };

  const registeredClients = clients.filter(
    (c) => c.id_cliente !== 1 && c.numero_identificacion !== '0000000000'
  );

  const filtered = registeredClients.filter((c) => {
    const estado = (c.estado || 'ACTIVO').toUpperCase();
    const matchEstado = filterEstado === 'TODOS' || estado === filterEstado;
    const isVerified = Boolean(c.correo_verificado);
    const matchVerif =
      filterVerificacion === 'TODOS' ||
      (filterVerificacion === 'VERIFICADOS' && isVerified) ||
      (filterVerificacion === 'PENDIENTES' && !isVerified);

    const q = searchTerm.trim().toLowerCase();
    const matchSearch =
      !q ||
      (c.nombres && c.nombres.toLowerCase().includes(q)) ||
      (c.apellidos && c.apellidos.toLowerCase().includes(q)) ||
      (c.numero_identificacion && c.numero_identificacion.includes(q)) ||
      (c.correo && c.correo.toLowerCase().includes(q)) ||
      (c.telefono && c.telefono.includes(q));
    return matchEstado && matchVerif && matchSearch;
  });

  const activeCount = registeredClients.filter(c => (c.estado || 'ACTIVO').toUpperCase() === 'ACTIVO').length;
  const verifiedCount = registeredClients.filter(c => Boolean(c.correo_verificado)).length;
  const pendingCount = registeredClients.length - verifiedCount;

  return (
    <section className="flex flex-col gap-3 h-full overflow-y-auto pr-1" id="view-clientes">
      {/* Header */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">group</span>
              Directorio de Clientes Registrados
            </h2>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full border border-slate-200">
              {registeredClients.length} registrados
            </span>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
              {verifiedCount} verificados
            </span>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200">
                {pendingCount} por verificar
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {activeCount} activo{activeCount !== 1 ? 's' : ''} • Solo clientes registrados y con correo verificado pueden facturar en el POS
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSmtpModal(true)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border cursor-pointer ${
              smtpStatus.configured
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
            }`}
          >
            <span className="material-symbols-outlined text-sm">
              {smtpStatus.configured ? 'mark_email_read' : 'mail_lock'}
            </span>
            {smtpStatus.configured
              ? `SMTP Real Activo (${smtpStatus.user})`
              : 'Configurar Correo Real (Gmail SMTP)'}
          </button>

          {(hasPermiso('crear_cliente') || isAdmin) && (
            <button
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              onClick={() => openModal('new-client')}
              id="btn-new-client"
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
              Nuevo cliente
            </button>
          )}
        </div>
      </div>

      {/* Modal para configurar Gmail SMTP real */}
      {showSmtpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-3.5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-base">forward_to_inbox</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Configurar Envío de Correo Real (SMTP)</h3>
                  <p className="text-[10px] text-slate-400">Para que los enlaces lleguen directamente a Gmail / Outlook</p>
                </div>
              </div>
              <button onClick={() => setShowSmtpModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1.5 text-[11px] text-slate-700">
              <p className="font-bold text-blue-900">¿Cómo enviar desde tu Gmail en 2 pasos?</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-600">
                <li>
                  Abre{' '}
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline font-semibold"
                  >
                    Contraseñas de Aplicación de Google
                  </a>{' '}
                  y crea una clave para <strong>"NexPOS"</strong>.
                </li>
                <li>Pega aquí tu correo Gmail y las <strong>16 letras</strong> que te da Google.</li>
              </ol>
            </div>

            <form onSubmit={handleSaveSmtp} className="space-y-2.5">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1 text-[11px]">Servidor SMTP</label>
                  <input
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="smtp.gmail.com"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1 text-[11px]">Puerto</label>
                  <input
                    type="text"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    placeholder="587"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1 text-[11px]">Tu Correo Remitente (ej. Gmail) *</label>
                <input
                  type="email"
                  required
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  placeholder="tucorreo@gmail.com"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1 text-[11px]">Contraseña de Aplicación (16 letras) *</label>
                <input
                  type="password"
                  required
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder="xxxx xxxx xxxx xxxx"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSmtpModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingSmtp}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  {savingSmtp ? 'Verificando conexión...' : 'Guardar y Activar Correo Real'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

        {/* Filtro de verificación de correo */}
        <div className="flex gap-0.5 bg-white border border-slate-200 rounded-lg p-0.5 text-xs">
          {[
            { id: 'TODOS', label: 'Todos' },
            { id: 'VERIFICADOS', label: 'Verificados ✓' },
            { id: 'PENDIENTES', label: 'Correo Pendiente' }
          ].map((vf) => (
            <button
              key={vf.id}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                filterVerificacion === vf.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
              onClick={() => setFilterVerificacion(vf.id)}
            >
              {vf.label}
            </button>
          ))}
        </div>

        <div className="flex gap-0.5 bg-white border border-slate-200 rounded-lg p-0.5 text-xs">
          {['ACTIVO', 'INACTIVO', 'TODOS'].map((est) => (
            <button
              key={est}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
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
          <p className="text-xs">No hay clientes registrados que coincidan con los filtros de búsqueda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 text-xs" id="clients-card-list">
          {filtered.map((c) => {
            const fullName = `${c.nombres} ${c.apellidos || ''}`.trim();
            const docLabel = `${c.tipo_identificacion || 'DOC'}: ${c.numero_identificacion}`;
            const isActive = (c.estado || 'ACTIVO').toUpperCase() === 'ACTIVO';
            const isVerified = Boolean(c.correo_verificado);
            const initials = getInitials(c.nombres, c.apellidos);

            return (
              <div
                key={c.id_cliente}
                className={`bg-white rounded-xl border p-3.5 space-y-3 transition-all ${
                  !isActive
                    ? 'opacity-55 border-slate-200'
                    : isVerified
                    ? 'border-slate-200 hover:border-slate-300'
                    : 'border-amber-200 bg-amber-50/15'
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
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="font-mono text-[10px] text-slate-500">{docLabel}</span>
                      <span
                        className={`px-1 py-0.2 rounded text-[9px] font-bold border ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {isActive ? 'Activo' : 'Inactivo'}
                      </span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold border flex items-center gap-0.5 ${
                          isVerified
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
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

                {/* Contact details */}
                <div className="space-y-1 text-[11px] text-slate-500">
                  {c.correo && c.correo !== '-' && (
                    <p className="truncate flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[13px] text-slate-400">mail</span>
                      {c.correo}
                    </p>
                  )}
                  {c.telefono && c.telefono !== '-' && (
                    <p className="truncate flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[13px] text-slate-400">phone</span>
                      {c.telefono}
                    </p>
                  )}
                </div>

                {/* Bloque de acción rápida si el correo no está verificado */}
                {!isVerified && (
                  <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg space-y-2">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] text-amber-900 font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">pin</span>
                        Validar Código OTP (6 dígitos)
                      </span>
                      <button
                        type="button"
                        onClick={() => resendVerification('cliente', c.id_cliente)}
                        className="text-[10px] text-blue-700 hover:underline font-semibold cursor-pointer"
                      >
                        Reenviar
                      </button>
                    </div>

                    {otpTargetClient?.id_cliente === c.id_cliente ? (
                      <div className="flex gap-1">
                        <input
                          type="text"
                          maxLength={6}
                          value={otpCodeInput}
                          onChange={(e) => setOtpCodeInput(e.target.value.replace(/\D/g, ''))}
                          placeholder="6 dígitos"
                          className="w-24 px-2 py-1 bg-white border border-blue-400 rounded text-center font-mono font-bold text-xs"
                        />
                        <button
                          type="button"
                          disabled={validatingOtpCode}
                          onClick={async () => {
                            if (!otpCodeInput.trim() || otpCodeInput.trim().length < 6) {
                              showToast('Ingresa los 6 dígitos dictados', 'warning');
                              return;
                            }
                            setValidatingOtpCode(true);
                            try {
                              const res = await validateOtp('cliente', c.id_cliente, otpCodeInput.trim());
                              if (res.success) {
                                setOtpTargetClient(null);
                                setOtpCodeInput('');
                              }
                            } finally {
                              setValidatingOtpCode(false);
                            }
                          }}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold cursor-pointer"
                        >
                          {validatingOtpCode ? '...' : 'Validar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setOtpTargetClient(null); setOtpCodeInput(''); }}
                          className="px-1.5 py-1 text-slate-500 hover:bg-slate-200 rounded text-[10px] cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-1">
                        <button
                          type="button"
                          onClick={() => { setOtpTargetClient(c); setOtpCodeInput(''); }}
                          className="w-full py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-xs">pin</span>
                          Digitar Código Dictado
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-slate-100" />

                {/* Actions */}
                <div className="flex gap-1.5">
                  <button
                    onClick={() => openDetailClient(c)}
                    className="flex-1 py-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center gap-1 transition-colors font-medium text-[10px] cursor-pointer"
                    title="Consultar datos completos"
                  >
                    <span className="material-symbols-outlined text-[12px]">visibility</span>
                    Consultar
                  </button>

                  <button
                    onClick={() => openEditClient(c)}
                    className="flex-1 py-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center gap-1 transition-colors font-medium text-[10px] cursor-pointer"
                    title="Modificar cliente"
                  >
                    <span className="material-symbols-outlined text-[12px]">edit</span>
                    Modificar
                  </button>

                  <button
                    onClick={() => openDeactivateClient(c)}
                    className="flex-1 py-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center gap-1 transition-colors font-medium text-[10px] cursor-pointer"
                    title={isActive ? 'Desactivar cliente' : 'Activar cliente'}
                  >
                    <span className="material-symbols-outlined text-[12px]">
                      {isActive ? 'person_off' : 'how_to_reg'}
                    </span>
                    {isActive ? 'Desactivar' : 'Activar'}
                  </button>

                  <button
                    onClick={() => openDeleteClient(c)}
                    className="px-2 py-1.5 text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 rounded-lg flex items-center justify-center gap-1 transition-colors font-medium text-[10px] cursor-pointer"
                    title="Eliminar cliente permanentemente"
                  >
                    <span className="material-symbols-outlined text-[12px]">delete</span>
                  </button>

                  <button
                    onClick={() => handleUseInPos(c)}
                    disabled={!isActive || !isVerified}
                    className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 rounded-lg flex items-center justify-center gap-1 transition-colors font-semibold text-[10px] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title={
                      !isVerified
                        ? 'Debe verificar su correo electrónico antes de facturar en el POS'
                        : 'Asignar al ticket del Terminal POS'
                    }
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

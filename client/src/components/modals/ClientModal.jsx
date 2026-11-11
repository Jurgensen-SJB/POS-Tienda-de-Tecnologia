import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const ClientModal = () => {
  const {
    activeModal,
    closeModal,
    clients,
    assignClient,
    saveNewClient,
    validateOtp,
    resendVerification,
    refreshVerificationStatus,
    showToast
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [tipoDoc, setTipoDoc] = useState('CC');
  const [newName, setNewName] = useState('');
  const [newDoc, setNewDoc] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [pendingClient, setPendingClient] = useState(null);
  const [otpInput, setOtpInput] = useState('');
  const [validatingOtp, setValidatingOtp] = useState(false);
  const [otpClientTarget, setOtpClientTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (activeModal !== 'client') return null;

  const activeRegisteredClients = clients.filter(
    c =>
      c.id_cliente !== 1 &&
      c.numero_identificacion !== '0000000000' &&
      (c.estado || 'ACTIVO').toUpperCase() === 'ACTIVO' &&
      (!searchTerm.trim() ||
        `${c.nombres} ${c.apellidos || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.numero_identificacion || '').includes(searchTerm.trim()) ||
        (c.correo || '').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleQuickCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newDoc.trim() || !newEmail.trim()) {
      showToast('Nombre, documento y correo electrónico son obligatorios', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const created = await saveNewClient(
        {
          tipo_identificacion: tipoDoc,
          numero_identificacion: newDoc.trim(),
          nombres: newName.trim(),
          apellidos: '',
          telefono: newPhone.trim(),
          correo: newEmail.trim(),
          estado: 'ACTIVO'
        },
        false
      );
      setPendingClient(created);
      setNewName('');
      setNewDoc('');
      setNewEmail('');
      setNewPhone('');
    } catch {
      // handled in saveNewClient
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (clientObj) => {
    if (!otpInput.trim() || otpInput.trim().length < 6) {
      showToast('Por favor ingresa los 6 dígitos dictados por el cliente', 'warning');
      return;
    }
    setValidatingOtp(true);
    try {
      const res = await validateOtp('cliente', clientObj.id_cliente, otpInput.trim());
      if (res.success) {
        const fullName = `${clientObj.nombres} ${clientObj.apellidos || ''}`.trim();
        const docLabel = `${clientObj.tipo_identificacion || 'DOC'}: ${clientObj.numero_identificacion}`;
        setPendingClient(null);
        setOtpClientTarget(null);
        setOtpInput('');
        assignClient(fullName, docLabel, clientObj.id_cliente, true, clientObj.correo);
      }
    } finally {
      setValidatingOtp(false);
    }
  };

  const handleCheckAndAssign = async (clientObj) => {
    const status = await refreshVerificationStatus('cliente', clientObj.id_cliente);
    if (status && status.correo_verificado) {
      const fullName = `${clientObj.nombres} ${clientObj.apellidos || ''}`.trim();
      const docLabel = `${clientObj.tipo_identificacion || 'DOC'}: ${clientObj.numero_identificacion}`;
      setPendingClient(null);
      assignClient(fullName, docLabel, clientObj.id_cliente, true, clientObj.correo);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-3 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">verified_user</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Asignar Cliente Registrado</h3>
              <p className="text-[10px] text-slate-400">
                Obligatorio: Todo cliente debe estar registrado y con correo verificado
              </p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-slate-600 cursor-pointer" onClick={closeModal}>
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Banner si se acaba de registrar un cliente y está pendiente del código OTP */}
        {pendingClient && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs space-y-2.5">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-amber-600 text-lg shrink-0">pin</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-amber-900">
                  Código OTP enviado a {pendingClient.correo}
                </p>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-snug">
                  Pídele al cliente <strong>{pendingClient.nombres}</strong> que te dicte el <strong>código de 6 dígitos</strong>:
                </p>
              </div>
            </div>

            {/* Input para que el cajero digite los 6 dígitos */}
            <div className="flex gap-1.5">
              <input
                type="text"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Ej. 123456"
                className="w-36 px-3 py-1.5 bg-white border-2 border-amber-400 focus:border-blue-600 rounded-lg text-center font-mono font-bold text-sm tracking-widest focus:outline-none"
              />
              <button
                type="button"
                disabled={validatingOtp}
                onClick={() => handleVerifyOtp(pendingClient)}
                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-xs">verified</span>
                {validatingOtp ? 'Validando...' : 'Confirmar Código y Asignar'}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-500 pt-1 border-t border-amber-200/60">
              {pendingClient.codigo_otp && (
                <span className="font-mono bg-white/80 px-2 py-0.5 rounded border border-amber-200 text-amber-900 font-bold">
                  Código de prueba: {pendingClient.codigo_otp}
                </span>
              )}
              <button
                type="button"
                onClick={() => resendVerification('cliente', pendingClient.id_cliente)}
                className="text-blue-700 hover:underline font-semibold cursor-pointer"
              >
                Reenviar código al correo
              </button>
            </div>
          </div>
        )}

        {/* Modal/Caja de validación OTP si se seleccionó un cliente ya registrado pero no verificado */}
        {otpClientTarget && (
          <div className="p-3 bg-blue-50 border border-blue-300 rounded-xl text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-900 flex items-center gap-1">
                <span className="material-symbols-outlined text-blue-600 text-sm">pin</span>
                Digitar código de {otpClientTarget.nombres}:
              </span>
              <button
                onClick={() => { setOtpClientTarget(null); setOtpInput(''); }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Código de 6 dígitos"
                className="w-36 px-3 py-1.5 bg-white border-2 border-blue-400 focus:border-blue-600 rounded-lg text-center font-mono font-bold text-sm tracking-widest focus:outline-none"
              />
              <button
                type="button"
                disabled={validatingOtp}
                onClick={() => handleVerifyOtp(otpClientTarget)}
                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-xs">check</span>
                {validatingOtp ? 'Validando...' : 'Validar y Asignar'}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2.5 text-xs">
          {/* Buscador de Clientes Registrados */}
          <div>
            <span className="font-semibold text-slate-700 block text-[11px] mb-1">
              Seleccionar Cliente del Directorio:
            </span>
            <div className="relative mb-2">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                search
              </span>
              <input
                type="text"
                placeholder="Buscar por nombre, documento o correo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-0.5">
              {activeRegisteredClients.length === 0 ? (
                <p className="text-center text-slate-400 py-4 text-[11px]">
                  No se encontraron clientes registrados con ese criterio
                </p>
              ) : (
                activeRegisteredClients.map((c) => {
                  const fullName = `${c.nombres} ${c.apellidos || ''}`.trim();
                  const docLabel = `${c.tipo_identificacion || 'DOC'}: ${c.numero_identificacion}`;
                  const isVerified = Boolean(c.correo_verificado);

                  return (
                    <div
                      key={c.id_cliente}
                      className={`p-2.5 rounded-xl border transition-colors flex items-center justify-between gap-2 ${
                        isVerified
                          ? 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/40'
                          : 'border-amber-200 bg-amber-50/40'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-800 truncate">{fullName}</p>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold border shrink-0 ${
                              isVerified
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border-amber-300'
                            }`}
                          >
                            {isVerified ? 'Verificado ✓' : 'Correo Pendiente'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          {docLabel} {c.correo ? `• ${c.correo}` : ''}
                        </p>
                      </div>

                      {isVerified ? (
                        <button
                          type="button"
                          onClick={() => assignClient(fullName, docLabel, c.id_cliente, true, c.correo)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg transition-colors cursor-pointer shrink-0"
                        >
                          Seleccionar
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => { setOtpClientTarget(c); setOtpInput(''); }}
                            title="Ingresar código de 6 dígitos dictado"
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg cursor-pointer flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>pin</span>
                            Validar Código
                          </button>
                          <button
                            type="button"
                            onClick={() => resendVerification('cliente', c.id_cliente)}
                            title="Reenviar código al correo"
                            className="p-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-xs">forward_to_inbox</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Registro Rápido con Verificación por Correo */}
          <div className="pt-2.5 border-t border-slate-100">
            <span className="font-semibold text-slate-700 block text-[11px] mb-1.5">
              Registrar Nuevo Cliente (Requiere verificación por correo):
            </span>
            <form className="space-y-2" onSubmit={handleQuickCreate}>
              <div className="grid grid-cols-3 gap-1.5">
                <select
                  value={tipoDoc}
                  onChange={(e) => setTipoDoc(e.target.value)}
                  className="px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none"
                >
                  <option value="CC">CC</option>
                  <option value="NIT">NIT</option>
                  <option value="CE">CE</option>
                  <option value="PPT">PPT</option>
                  <option value="TI">TI</option>
                  <option value="PASAPORTE">Pasaporte</option>
                </select>
                <input
                  className="col-span-2 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  placeholder="Número Documento *"
                  required
                  type="text"
                  value={newDoc}
                  onChange={(e) => setNewDoc(e.target.value)}
                />
              </div>
              <input
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                placeholder="Nombre Completo / Razón Social *"
                required
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  placeholder="Correo electrónico *"
                  required
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
                <input
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  placeholder="Teléfono (opcional)"
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
              </div>
              <button
                disabled={submitting}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                type="submit"
              >
                <span className="material-symbols-outlined text-sm">mark_email_read</span>
                {submitting ? 'Registrando y enviando enlace...' : 'Registrar y Enviar Enlace de Verificación'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/api';

export const NewClientModal = () => {
  const { activeModal, closeModal, saveNewClient, validateOtp, resendVerification, refreshVerificationStatus, showToast } = useApp();

  const [tipoDoc, setTipoDoc] = useState('CC');
  const [numDoc, setNumDoc] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [direccion, setDireccion] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdClient, setCreatedClient] = useState(null);
  const [otpInput, setOtpInput] = useState('');
  const [validatingOtp, setValidatingOtp] = useState(false);
  const [smtpUser, setSmtpUser] = useState('johanrojas100@gmail.com');
  const [smtpPass, setSmtpPass] = useState('');
  const [configuringSmtp, setConfiguringSmtp] = useState(false);

  if (activeModal !== 'new-client') return null;

  const handleClose = () => {
    setCreatedClient(null);
    closeModal();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!numDoc.trim() || !nombres.trim() || !correo.trim()) {
      showToast('Número de documento, nombres y correo electrónico son obligatorios', 'warning');
      return;
    }

    setLoading(true);
    try {
      const created = await saveNewClient(
        {
          tipo_identificacion: tipoDoc,
          numero_identificacion: numDoc.trim(),
          nombres: nombres.trim(),
          apellidos: apellidos.trim(),
          telefono: telefono.trim(),
          correo: correo.trim(),
          direccion: direccion.trim(),
          estado: 'ACTIVO'
        },
        false
      );
      setCreatedClient(created);
      setNumDoc('');
      setNombres('');
      setApellidos('');
      setTelefono('');
      setCorreo('');
      setDireccion('');
    } catch {
      // handled in saveNewClient
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-slate-400 focus:outline-none transition-colors';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined text-base">person_add</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Registrar Nuevo Cliente</h3>
              <p className="text-[11px] text-slate-400">Verificación obligatoria por enlace al correo electrónico</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {createdClient ? (
          <div className="p-5 space-y-3.5 text-xs overflow-y-auto">
            {/* Bloque principal: Validación de código dictado en caja */}
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
                <span className="material-symbols-outlined text-emerald-600 text-lg">pin</span>
                Ingresar Código de 6 dígitos dictado por el cliente
              </div>
              <p className="text-[11px] text-emerald-800 leading-snug">
                Pídele a <strong>{createdClient.nombres}</strong> los 6 dígitos que le llegaron a <strong>{createdClient.correo}</strong>:
              </p>
              <div className="flex gap-1.5 pt-1">
                <input
                  type="text"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ej. 123456"
                  className="w-36 px-3 py-2 bg-white border-2 border-emerald-400 focus:border-blue-600 rounded-lg text-center font-mono font-bold text-base tracking-widest focus:outline-none"
                />
                <button
                  type="button"
                  disabled={validatingOtp}
                  onClick={async () => {
                    if (!otpInput.trim() || otpInput.trim().length < 6) {
                      showToast('Ingresa los 6 dígitos dictados por el cliente', 'warning');
                      return;
                    }
                    setValidatingOtp(true);
                    try {
                      const res = await validateOtp('cliente', createdClient.id_cliente, otpInput.trim());
                      if (res.success) {
                        handleClose();
                      }
                    } finally {
                      setValidatingOtp(false);
                    }
                  }}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  <span className="material-symbols-outlined text-sm">verified</span>
                  {validatingOtp ? 'Validando...' : 'Validar y Activar Cliente'}
                </button>
              </div>

              {createdClient.codigo_otp && (
                <div className="flex items-center justify-between text-[10px] text-emerald-900 bg-white/70 px-2 py-1 rounded border border-emerald-200">
                  <span>Código de prueba generado:</span>
                  <span className="font-mono font-bold tracking-wider">{createdClient.codigo_otp}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {createdClient.previewUrl && (
                <button
                  type="button"
                  onClick={() => window.open(createdClient.previewUrl, '_blank')}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">mail</span>
                  Ver Correo Enviado (Buzón de Prueba Ethereal)
                </button>
              )}
              {createdClient.verificationUrl && (
                <button
                  type="button"
                  onClick={() => window.open(createdClient.verificationUrl, '_blank')}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                  Abrir Enlace de Verificación Ahora
                </button>
              )}
              <button
                type="button"
                onClick={async () => {
                  const st = await refreshVerificationStatus('cliente', createdClient.id_cliente);
                  if (st?.correo_verificado) handleClose();
                }}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">verified</span>
                Comprobar Estado de Verificación
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-3.5 text-xs">
            {/* Document Type & Number */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 text-[11px] mb-1">
                  Tipo Doc. <span className="text-rose-500">*</span>
                </label>
                <select
                  value={tipoDoc}
                  onChange={(e) => setTipoDoc(e.target.value)}
                  className={inputCls}
                >
                  <option value="CC">CC (Cédula de Ciudadanía)</option>
                  <option value="NIT">NIT</option>
                  <option value="CE">CE (Cédula de Extranjería)</option>
                  <option value="PPT">PPT (Permiso por Protección Temporal)</option>
                  <option value="TI">TI (Tarjeta de Identidad)</option>
                  <option value="PASAPORTE">Pasaporte</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block font-semibold text-slate-700 text-[11px] mb-1">
                  Número de documento <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder={tipoDoc === 'NIT' ? 'Ej. 900123456-7' : 'Ej. 1020304050'}
                  value={numDoc}
                  onChange={(e) => setNumDoc(e.target.value)}
                  required
                  className={`${inputCls} font-mono`}
                />
              </div>
            </div>

            {/* Names & Surnames */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 text-[11px] mb-1">
                  Nombres / Razón Social <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nombres"
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 text-[11px] mb-1">
                  Apellidos
                </label>
                <input
                  type="text"
                  placeholder="Apellidos (opcional)"
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 text-[11px] mb-1">
                  Correo Electrónico <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="cliente@email.com"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 text-[11px] mb-1">
                  Teléfono / Celular
                </label>
                <input
                  type="text"
                  placeholder="+57 300 000 0000"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block font-semibold text-slate-700 text-[11px] mb-1">
                Dirección Fiscal / Entrega
              </label>
              <input
                type="text"
                placeholder="Ej. Cra 15 #88-20, Bogotá D.C."
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className={inputCls}
              />
            </div>

            {/* Footer Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={handleClose}
                className="px-3.5 py-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">mark_email_read</span>
                {loading ? 'Enviando...' : 'Registrar y Enviar Verificación'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/api';

export const NewUserModal = () => {
  const { activeModal, closeModal, setEmployees, refreshVerificationStatus, showToast, currentUser } = useApp();

  const [tipoDoc, setTipoDoc] = useState('CC');
  const [numDoc, setNumDoc] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [cargo, setCargo] = useState('Cajero Turno Rotativo');
  const [role, setRole] = useState('Cajero');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [createdEmp, setCreatedEmp] = useState(null);
  const [loading, setLoading] = useState(false);

  if (activeModal !== 'new-user') return null;

  const handleClose = () => {
    setCreatedEmp(null);
    closeModal();
  };

  const handleNameChange = (val) => {
    setNombres(val);
    if (!username && val) {
      const clean = val.toLowerCase().replace(/\s+/g, '');
      setUsername(clean);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombres.trim() || !apellidos.trim() || !numDoc.trim() || !correo.trim()) {
      showToast('Por favor completa nombres, apellidos, identificación y correo electrónico', 'warning');
      return;
    }

    const payload = {
      tipo_identificacion: tipoDoc,
      numero_identificacion: numDoc.trim(),
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      telefono: telefono.trim(),
      correo: correo.trim(),
      cargo: cargo.trim() || role,
      rol: role,
      nombre_usuario: username.trim() || `${nombres.trim().toLowerCase().split(' ')[0]}.${numDoc.trim().slice(-3)}`,
      password: password || '123456',
      id_usuario: currentUser?.id_usuario || 1
    };

    setLoading(true);
    try {
      const newEmp = await api.createEmployee(payload);
      setEmployees(prev => [...prev, newEmp]);
      setCreatedEmp(newEmp);
      showToast(`Colaborador registrado. Enlace de verificación enviado a ${payload.correo}`, 'mark_email_read');
      setNumDoc('');
      setNombres('');
      setApellidos('');
      setTelefono('');
      setCorreo('');
      setUsername('');
      setPassword('');
    } catch (err) {
      showToast(err.message || 'Error al registrar colaborador', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-3 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">person_add</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Registrar Nuevo Empleado</h3>
              <p className="text-[10px] text-slate-400">Ficha de colaborador, credenciales RBAC y verificación por correo</p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer" onClick={handleClose}>
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {createdEmp ? (
          <div className="space-y-4 text-xs pt-1">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                <span className="material-symbols-outlined text-blue-600">mark_email_read</span>
                ¡Enlace de Activación Enviado!
              </div>
              <p className="text-slate-600 leading-relaxed">
                Se envió un correo con enlace de confirmación a <strong>{createdEmp.correo}</strong> para{' '}
                <strong>{createdEmp.nombres} {createdEmp.apellidos}</strong>.
              </p>
              <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2 font-medium">
                ⚠️ El colaborador no podrá iniciar sesión en el sistema hasta que confirme su correo haciendo clic en el enlace.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {createdEmp.previewUrl && (
                <button
                  type="button"
                  onClick={() => window.open(createdEmp.previewUrl, '_blank')}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">mail</span>
                  Ver Correo Enviado (Buzón de Prueba Ethereal)
                </button>
              )}
              {createdEmp.verificationUrl && (
                <button
                  type="button"
                  onClick={() => window.open(createdEmp.verificationUrl, '_blank')}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                  Abrir Enlace de Verificación Ahora
                </button>
              )}
              <button
                type="button"
                onClick={async () => {
                  const st = await refreshVerificationStatus('empleado', createdEmp.id_empleado);
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
          <form className="space-y-2.5 text-xs" onSubmit={handleSubmit}>
            {/* Identificación */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="font-semibold text-slate-700 block mb-0.5 text-[11px]">Tipo Doc.</label>
                <select
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  value={tipoDoc}
                  onChange={(e) => setTipoDoc(e.target.value)}
                >
                  <option value="CC">CC (Cédula de Ciudadanía)</option>
                  <option value="CE">CE (Cédula de Extranjería)</option>
                  <option value="PPT">PPT (Permiso por Protección Temporal)</option>
                  <option value="TI">TI (Tarjeta de Identidad)</option>
                  <option value="PASAPORTE">Pasaporte</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="font-semibold text-slate-700 block mb-0.5 text-[11px]">N° Identificación *</label>
                <input
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  placeholder="Ej. 1020304050"
                  required
                  type="text"
                  value={numDoc}
                  onChange={(e) => setNumDoc(e.target.value)}
                />
              </div>
            </div>

            {/* Nombres y Apellidos */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-700 block mb-0.5 text-[11px]">Nombres *</label>
                <input
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  placeholder="Ej. Martín"
                  required
                  type="text"
                  value={nombres}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-0.5 text-[11px]">Apellidos *</label>
                <input
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  placeholder="Ej. Ramos"
                  required
                  type="text"
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                />
              </div>
            </div>

            {/* Contacto */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-700 block mb-0.5 text-[11px]">Correo Electrónico *</label>
                <input
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  placeholder="martin@empresa.com"
                  required
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-0.5 text-[11px]">Teléfono</label>
                <input
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  placeholder="+57 300 000 0000"
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </div>
            </div>

            {/* Cargo y Rol */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-700 block mb-0.5 text-[11px]">Cargo Operativo</label>
                <input
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  placeholder="Ej. Cajero Principal"
                  type="text"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-0.5 text-[11px]">Rol RBAC</label>
                <select
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="Cajero">Cajero (Ventas y cobros)</option>
                  <option value="Supervisor de Caja">Supervisor (Arqueos y turnos)</option>
                  <option value="Administrador">Administrador (Control Total)</option>
                </select>
              </div>
            </div>

            {/* Credenciales de Acceso */}
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Credenciales de Acceso al Terminal
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-medium text-slate-600 block text-[10px] mb-0.5">Usuario</label>
                  <input
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    placeholder="ej. martin.ramos"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-600 block text-[10px] mb-0.5">Contraseña Inicial</label>
                  <input
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    placeholder="Mínimo 6 caracteres"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
                onClick={handleClose}
                type="button"
              >
                Cancelar
              </button>
              <button
                disabled={loading}
                className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                type="submit"
              >
                {loading ? 'Enviando...' : 'Registrar y Enviar Verificación'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

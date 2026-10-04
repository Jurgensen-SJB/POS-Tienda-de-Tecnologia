import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/api';

const ALL_PERMISOS_CATALOG = [
  { nombre: 'ver_pos',             descripcion: 'Acceso al Terminal POS',   modulo: 'POS' },
  { nombre: 'cobrar',              descripcion: 'Realizar cobros',           modulo: 'POS' },
  { nombre: 'aplicar_descuento',   descripcion: 'Aplicar descuentos',        modulo: 'POS' },
  { nombre: 'anular_venta',        descripcion: 'Anular ventas',             modulo: 'POS' },
  { nombre: 'ver_caja',            descripcion: 'Ver control de caja',       modulo: 'CAJA' },
  { nombre: 'abrir_caja',          descripcion: 'Apertura de caja',          modulo: 'CAJA' },
  { nombre: 'cerrar_caja',         descripcion: 'Cierre de caja (Z)',        modulo: 'CAJA' },
  { nombre: 'corte_parcial',       descripcion: 'Corte parcial (X)',         modulo: 'CAJA' },
  { nombre: 'ver_inventario',      descripcion: 'Ver inventario',            modulo: 'INVENTARIO' },
  { nombre: 'crear_producto',      descripcion: 'Crear productos',           modulo: 'INVENTARIO' },
  { nombre: 'editar_producto',     descripcion: 'Editar productos',          modulo: 'INVENTARIO' },
  { nombre: 'ver_clientes',        descripcion: 'Ver clientes',              modulo: 'CLIENTES' },
  { nombre: 'crear_cliente',       descripcion: 'Registrar clientes',        modulo: 'CLIENTES' },
  { nombre: 'ver_empleados',       descripcion: 'Ver empleados',             modulo: 'EMPLEADOS' },
  { nombre: 'crear_empleado',      descripcion: 'Registrar empleados',       modulo: 'EMPLEADOS' },
  { nombre: 'modificar_empleado',  descripcion: 'Modificar empleados',       modulo: 'EMPLEADOS' },
  { nombre: 'desactivar_empleado', descripcion: 'Desactivar empleados',      modulo: 'EMPLEADOS' },
  { nombre: 'ver_auditoria',       descripcion: 'Ver auditoria',             modulo: 'AUDITORIA' },
  { nombre: 'ver_compras',         descripcion: 'Ver compras',               modulo: 'COMPRAS' },
  { nombre: 'crear_compra',        descripcion: 'Registrar compras',         modulo: 'COMPRAS' },
];
const MODULOS = ['POS','CAJA','INVENTARIO','CLIENTES','EMPLEADOS','AUDITORIA','COMPRAS'];

function getDefaultPermisosByRol(rol = '') {
  const r = rol.toLowerCase();
  if (r.includes('admin')) return ALL_PERMISOS_CATALOG.map(p => p.nombre);
  if (r.includes('supervis')) return ['ver_pos','cobrar','aplicar_descuento','anular_venta','ver_caja','abrir_caja','cerrar_caja','corte_parcial','ver_inventario','ver_clientes','crear_cliente','ver_empleados'];
  return ['ver_pos','cobrar','ver_caja','ver_clientes'];
}

export const EditUserModal = () => {
  const { activeModal, closeModal, employeeToEdit, saveEditedEmployee, showToast, allPermisos, updateRolPermisos, currentUser } = useApp();

  const [tipoDoc, setTipoDoc]         = useState('DNI');
  const [numDoc, setNumDoc]           = useState('');
  const [nombres, setNombres]         = useState('');
  const [apellidos, setApellidos]     = useState('');
  const [telefono, setTelefono]       = useState('');
  const [correo, setCorreo]           = useState('');
  const [cargo, setCargo]             = useState('');
  const [role, setRole]               = useState('Cajero');
  const [estado, setEstado]           = useState('ACTIVO');
  const [permisos, setPermisos]       = useState([]);
  const [activeTab, setActiveTab]     = useState('datos');

  // Credenciales
  const [nombreUsuario, setNombreUsuario]         = useState('');
  const [passwordActual, setPasswordActual]       = useState('');
  const [nuevaPassword, setNuevaPassword]         = useState('');
  const [confirmarPass, setConfirmarPass]         = useState('');
  const [showPasswordActual, setShowPasswordActual] = useState(false);
  const [showPass, setShowPass]                   = useState(false);
  const [showConfirmPass, setShowConfirmPass]     = useState(false);
  const [savingCreds, setSavingCreds]             = useState(false);
  const [loadingCreds, setLoadingCreds]           = useState(false);

  useEffect(() => {
    if (employeeToEdit) {
      setTipoDoc(employeeToEdit.tipo_identificacion || 'DNI');
      setNumDoc(employeeToEdit.numero_identificacion || '');
      setNombres(employeeToEdit.nombres || '');
      setApellidos(employeeToEdit.apellidos || '');
      setTelefono(employeeToEdit.telefono || '');
      setCorreo(employeeToEdit.correo || '');
      setCargo(employeeToEdit.cargo || '');
      const r = employeeToEdit.rol || employeeToEdit.cargo || 'Cajero';
      setRole(r);
      setEstado(employeeToEdit.estado || 'ACTIVO');
      setPermisos(getDefaultPermisosByRol(r));
      setNombreUsuario(employeeToEdit.nombre_usuario || '');
      setPasswordActual('');
      setNuevaPassword('');
      setConfirmarPass('');
      setShowPasswordActual(false);
      setActiveTab('datos');
    }
  }, [employeeToEdit]);

  // Cargar credenciales reales al abrir la pestana de credenciales
  useEffect(() => {
    if (activeTab === 'credenciales' && employeeToEdit?.id_empleado) {
      setLoadingCreds(true);
      api.getEmployeeCredentials(employeeToEdit.id_empleado)
        .then(data => {
          if (data.nombre_usuario) setNombreUsuario(data.nombre_usuario);
          setPasswordActual(data.password || '');
        })
        .catch(() => {})
        .finally(() => setLoadingCreds(false));
    }
  }, [activeTab, employeeToEdit?.id_empleado]);

  if (activeModal !== 'edit-user' || !employeeToEdit) return null;

  const catalog = allPermisos.length > 0 ? allPermisos : ALL_PERMISOS_CATALOG;
  const byModulo = MODULOS.reduce((acc, mod) => { acc[mod] = catalog.filter(p => p.modulo === mod); return acc; }, {});

  const togglePermiso = (nombre) => setPermisos(prev => prev.includes(nombre) ? prev.filter(p => p !== nombre) : [...prev, nombre]);
  const toggleModulo  = (mod) => {
    const mp = (byModulo[mod] || []).map(p => p.nombre);
    const allOn = mp.every(p => permisos.includes(p));
    setPermisos(prev => allOn ? prev.filter(p => !mp.includes(p)) : [...new Set([...prev, ...mp])]);
  };
  const handleRoleChange = (r) => { setRole(r); setPermisos(getDefaultPermisosByRol(r)); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombres.trim() || !apellidos.trim()) { showToast('Nombres y apellidos obligatorios', 'warning'); return; }
    await saveEditedEmployee(employeeToEdit.id_empleado, {
      tipo_identificacion: tipoDoc, numero_identificacion: numDoc.trim(),
      nombres: nombres.trim(), apellidos: apellidos.trim(),
      telefono: telefono.trim(), correo: correo.trim(),
      cargo: cargo.trim() || role, rol: role, estado,
    });
    const rolId = role.toLowerCase().includes('admin') ? 1 : role.toLowerCase().includes('supervis') ? 2 : 3;
    await updateRolPermisos(rolId, permisos);
  };

  const handleSaveCredentials = async () => {
    if (!nombreUsuario.trim()) { showToast('El nombre de usuario es obligatorio', 'warning'); return; }
    if (nombreUsuario.trim().length < 3) { showToast('Minimo 3 caracteres para el usuario', 'warning'); return; }
    if (nuevaPassword && nuevaPassword.length < 6) { showToast('La contrasena debe tener al menos 6 caracteres', 'warning'); return; }
    if (nuevaPassword && nuevaPassword !== confirmarPass) { showToast('Las contrasenas no coinciden', 'warning'); return; }
    setSavingCreds(true);
    try {
      await api.updateEmployeeCredentials(employeeToEdit.id_empleado, {
        nombre_usuario: nombreUsuario.trim().toLowerCase(),
        nueva_password: nuevaPassword || undefined,
        id_usuario: currentUser?.id_usuario || 1
      });
      if (nuevaPassword) setPasswordActual(nuevaPassword);
      showToast('Credenciales de ' + nombres + ' actualizadas', 'key');
      setNuevaPassword(''); setConfirmarPass('');
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally { setSavingCreds(false); }
  };

  const getStr = (pw) => { if (!pw) return 0; if (pw.length >= 8 && /[A-Z]/.test(pw) && /[0-9]/.test(pw)) return 4; if (pw.length >= 8) return 3; if (pw.length >= 6) return 2; return 1; };
  const strLabel = ['','Muy debil','Debil','Buena','Fuerte'];
  const strColor = ['','bg-rose-400','bg-amber-400','bg-blue-500','bg-emerald-500'];
  const strText  = ['','text-rose-500','text-amber-600','text-blue-600','text-emerald-600'];

  const ic = 'w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-slate-400 focus:outline-none transition-colors';
  const tabs = [
    { id: 'datos', label: 'Datos generales' },
    { id: 'credenciales', label: 'Credenciales' },
    { id: 'permisos', label: 'Permisos' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Modificar colaborador</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">{nombres || employeeToEdit.nombres} {apellidos || employeeToEdit.apellidos}</p>
          </div>
          <button className="text-slate-400 hover:text-slate-600 cursor-pointer" onClick={closeModal}>
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-5 shrink-0">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`py-2.5 px-1 mr-4 text-xs font-semibold border-b-2 transition-colors ${activeTab === tab.id ? 'border-slate-800 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <form className="flex flex-col flex-1 overflow-hidden" onSubmit={handleSubmit}>
          <div className="flex-1 overflow-y-auto px-5 py-4">

            {/* TAB: Datos */}
            {activeTab === 'datos' && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Tipo Doc.</label>
                    <select className={ic} value={tipoDoc} onChange={e => setTipoDoc(e.target.value)}>
                      <option>DNI</option><option>Cedula</option><option>Pasaporte</option><option value="Extranjeria">Carnet Ext.</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="font-semibold text-slate-600 block mb-1">N Identificacion</label>
                    <input className={ic} type="text" value={numDoc} onChange={e => setNumDoc(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="font-semibold text-slate-600 block mb-1">Nombres *</label><input className={ic} required type="text" value={nombres} onChange={e => setNombres(e.target.value)} /></div>
                  <div><label className="font-semibold text-slate-600 block mb-1">Apellidos *</label><input className={ic} required type="text" value={apellidos} onChange={e => setApellidos(e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="font-semibold text-slate-600 block mb-1">Telefono</label><input className={ic} type="text" value={telefono} onChange={e => setTelefono(e.target.value)} /></div>
                  <div><label className="font-semibold text-slate-600 block mb-1">Correo</label><input className={ic} type="email" value={correo} onChange={e => setCorreo(e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="font-semibold text-slate-600 block mb-1">Cargo operativo</label><input className={ic} type="text" value={cargo} onChange={e => setCargo(e.target.value)} placeholder="Ej: Cajera Turno" /></div>
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Rol RBAC</label>
                    <select className={ic} value={role} onChange={e => handleRoleChange(e.target.value)}>
                      <option value="Cajero">Cajero</option>
                      <option value="Supervisor de Caja">Supervisor</option>
                      <option value="Administrador General">Administrador</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Estado</label>
                  <select className={ic} value={estado} onChange={e => setEstado(e.target.value)}>
                    <option value="ACTIVO">ACTIVO - permite acceso y turnos</option>
                    <option value="INACTIVO">INACTIVO - acceso bloqueado</option>
                  </select>
                </div>
              </div>
            )}

            {/* TAB: Credenciales */}
            {activeTab === 'credenciales' && (
              <div className="space-y-4 text-xs">
                {/* Banner */}
                <div className="flex items-start gap-2.5 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <span className="material-symbols-outlined text-blue-600 shrink-0" style={{fontSize:'16px'}}>admin_panel_settings</span>
                  <div>
                    <p className="font-bold text-blue-800 text-[11px]">Gestion de Credenciales</p>
                    <p className="text-blue-600 text-[10px] mt-0.5 leading-snug">Solo visible para Administradores. Los cambios aplican en el proximo inicio de sesion.</p>
                  </div>
                </div>

                {loadingCreds ? (
                  <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    <span className="text-[11px]">Cargando credenciales...</span>
                  </div>
                ) : (
                  <>
                    {/* Credenciales actuales - solo lectura */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                      <p className="font-bold text-slate-700 text-[11px] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-slate-500" style={{fontSize:'13px'}}>info</span>
                        Credenciales actuales del sistema
                      </p>
                      {/* Usuario */}
                      <div>
                        <label className="font-semibold text-slate-500 block mb-1">Usuario de acceso</label>
                        <div className="flex items-center gap-2 px-2.5 py-2 bg-white border border-slate-200 rounded-lg">
                          <span className="material-symbols-outlined text-slate-400" style={{fontSize:'13px'}}>person</span>
                          <span className="font-mono font-semibold text-slate-800 text-xs flex-1">
                            {nombreUsuario || <span className="text-slate-400 italic font-normal font-sans">Sin usuario asignado</span>}
                          </span>
                        </div>
                      </div>
                      {/* Contrasena actual */}
                      <div>
                        <label className="font-semibold text-slate-500 block mb-1">Contrasena actual</label>
                        <div className="flex items-center gap-2 px-2.5 py-2 bg-white border border-slate-200 rounded-lg">
                          <span className="material-symbols-outlined text-slate-400" style={{fontSize:'13px'}}>lock</span>
                          <span className="font-mono font-semibold text-slate-800 text-xs flex-1 tracking-widest">
                            {passwordActual
                              ? (showPasswordActual ? passwordActual : '\u2022'.repeat(Math.min(passwordActual.length, 12)))
                              : <span className="text-slate-400 italic font-normal tracking-normal font-sans">No disponible</span>
                            }
                          </span>
                          {passwordActual && (
                            <button type="button" onClick={() => setShowPasswordActual(!showPasswordActual)}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                              title={showPasswordActual ? 'Ocultar' : 'Ver contrasena'}>
                              <span className="material-symbols-outlined" style={{fontSize:'14px'}}>
                                {showPasswordActual ? 'visibility_off' : 'visibility'}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Editar nombre de usuario */}
                    <div>
                      <label className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                        <span className="material-symbols-outlined" style={{fontSize:'13px'}}>edit</span>
                        Cambiar Nombre de Usuario
                      </label>
                      <input className={ic} type="text" value={nombreUsuario}
                        onChange={e => setNombreUsuario(e.target.value)}
                        placeholder="ej: camila.cajera" autoComplete="off" />
                      {nombreUsuario && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          Ingreso como: <strong className="text-slate-600 font-mono">{nombreUsuario.toLowerCase()}</strong>
                        </p>
                      )}
                    </div>

                    {/* Cambiar contrasena */}
                    <div className="border-t border-slate-100 pt-3">
                      <p className="font-bold text-slate-700 mb-3 flex items-center gap-1">
                        <span className="material-symbols-outlined" style={{fontSize:'13px'}}>lock</span>
                        Cambiar Contrasena
                        <span className="font-normal text-slate-400 ml-1 text-[10px]">(opcional)</span>
                      </p>
                      <div className="space-y-2.5">
                        <div>
                          <label className="font-semibold text-slate-600 block mb-1">Nueva Contrasena</label>
                          <div className="relative">
                            <input className={ic + ' pr-9'} type={showPass ? 'text' : 'password'}
                              value={nuevaPassword} onChange={e => setNuevaPassword(e.target.value)}
                              placeholder="Minimo 6 caracteres" autoComplete="new-password" />
                            <button type="button" onClick={() => setShowPass(!showPass)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                              <span className="material-symbols-outlined" style={{fontSize:'14px'}}>{showPass ? 'visibility_off' : 'visibility'}</span>
                            </button>
                          </div>
                          {nuevaPassword && (() => {
                            const s = getStr(nuevaPassword);
                            return (
                              <div className="mt-1.5 flex items-center gap-1">
                                {[1,2,3,4].map(lvl => (
                                  <div key={lvl} className={`h-1 flex-1 rounded-full ${lvl <= s ? strColor[s] : 'bg-slate-200'}`} />
                                ))}
                                <span className={`text-[9px] font-bold ml-1 ${strText[s]}`}>{strLabel[s]}</span>
                              </div>
                            );
                          })()}
                        </div>
                        <div>
                          <label className="font-semibold text-slate-600 block mb-1">Confirmar Contrasena</label>
                          <div className="relative">
                            <input
                              className={`${ic} pr-9 ${confirmarPass && nuevaPassword !== confirmarPass ? 'border-rose-300 bg-rose-50' : confirmarPass && nuevaPassword === confirmarPass ? 'border-emerald-300 bg-emerald-50' : ''}`}
                              type={showConfirmPass ? 'text' : 'password'}
                              value={confirmarPass} onChange={e => setConfirmarPass(e.target.value)}
                              placeholder="Repite la nueva contrasena" autoComplete="new-password" />
                            <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                              <span className="material-symbols-outlined" style={{fontSize:'14px'}}>{showConfirmPass ? 'visibility_off' : 'visibility'}</span>
                            </button>
                          </div>
                          {confirmarPass && (
                            <p className={`text-[10px] mt-1 flex items-center gap-1 ${nuevaPassword === confirmarPass ? 'text-emerald-600' : 'text-rose-500'}`}>
                              <span className="material-symbols-outlined" style={{fontSize:'11px'}}>{nuevaPassword === confirmarPass ? 'check_circle' : 'cancel'}</span>
                              {nuevaPassword === confirmarPass ? 'Las contrasenas coinciden' : 'No coinciden'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <button type="button" onClick={handleSaveCredentials} disabled={savingCreds}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer transition-colors">
                      <span className="material-symbols-outlined" style={{fontSize:'14px'}}>key</span>
                      {savingCreds ? 'Guardando...' : 'Guardar Credenciales'}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* TAB: Permisos */}
            {activeTab === 'permisos' && (
              <div className="space-y-2 text-xs">
                <p className="text-[11px] text-slate-500 mb-3">
                  Activa o desactiva permisos individuales.
                  <span className="font-semibold text-slate-700"> {permisos.length}/{catalog.length} activos.</span>
                </p>
                {MODULOS.map(mod => {
                  const mp = byModulo[mod] || [];
                  if (mp.length === 0) return null;
                  const allOn = mp.every(p => permisos.includes(p.nombre));
                  const someOn = mp.some(p => permisos.includes(p.nombre));
                  return (
                    <div key={mod} className="border border-slate-200 rounded-lg overflow-hidden">
                      <button type="button" onClick={() => toggleModulo(mod)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors">
                        <span className="font-bold text-slate-700 text-[10px] uppercase tracking-wide">{mod}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">{mp.filter(p => permisos.includes(p.nombre)).length}/{mp.length}</span>
                          <div className={`w-8 h-4 rounded-full relative ${allOn ? 'bg-slate-700' : someOn ? 'bg-slate-300' : 'bg-slate-200'}`}>
                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${allOn ? 'left-4' : 'left-0.5'}`} />
                          </div>
                        </div>
                      </button>
                      <div className="divide-y divide-slate-100">
                        {mp.map(p => {
                          const on = permisos.includes(p.nombre);
                          return (
                            <label key={p.nombre} className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-slate-50">
                              <span className={`text-[11px] ${on ? 'text-slate-700' : 'text-slate-400'}`}>{p.descripcion}</span>
                              <input type="checkbox" className="w-3.5 h-3.5 accent-slate-700 cursor-pointer" checked={on} onChange={() => togglePermiso(p.nombre)} />
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {activeTab !== 'credenciales' && (
            <div className="flex gap-2 px-5 py-4 border-t border-slate-100 shrink-0">
              <button type="button" onClick={closeModal} className="flex-1 py-2 text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer">Cancelar</button>
              <button type="submit" className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors">Guardar cambios</button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

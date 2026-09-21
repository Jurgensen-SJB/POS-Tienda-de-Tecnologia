import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

const ALL_PERMISOS_CATALOG = [
  { nombre: 'ver_pos',          descripcion: 'Acceso al Terminal POS',     modulo: 'POS' },
  { nombre: 'cobrar',           descripcion: 'Realizar cobros',             modulo: 'POS' },
  { nombre: 'aplicar_descuento',descripcion: 'Aplicar descuentos',          modulo: 'POS' },
  { nombre: 'anular_venta',     descripcion: 'Anular ventas',               modulo: 'POS' },
  { nombre: 'ver_caja',         descripcion: 'Ver control de caja',         modulo: 'CAJA' },
  { nombre: 'abrir_caja',       descripcion: 'Apertura de caja',            modulo: 'CAJA' },
  { nombre: 'cerrar_caja',      descripcion: 'Cierre de caja (Z)',          modulo: 'CAJA' },
  { nombre: 'corte_parcial',    descripcion: 'Corte parcial (X)',           modulo: 'CAJA' },
  { nombre: 'ver_inventario',   descripcion: 'Ver inventario',              modulo: 'INVENTARIO' },
  { nombre: 'crear_producto',   descripcion: 'Crear productos',             modulo: 'INVENTARIO' },
  { nombre: 'editar_producto',  descripcion: 'Editar productos',            modulo: 'INVENTARIO' },
  { nombre: 'ver_clientes',     descripcion: 'Ver clientes',                modulo: 'CLIENTES' },
  { nombre: 'crear_cliente',    descripcion: 'Registrar clientes',          modulo: 'CLIENTES' },
  { nombre: 'ver_empleados',       descripcion: 'Ver empleados',               modulo: 'EMPLEADOS' },
  { nombre: 'crear_empleado',      descripcion: 'Registrar empleados',         modulo: 'EMPLEADOS' },
  { nombre: 'modificar_empleado',  descripcion: 'Modificar empleados',         modulo: 'EMPLEADOS' },
  { nombre: 'desactivar_empleado', descripcion: 'Desactivar empleados',        modulo: 'EMPLEADOS' },
  { nombre: 'ver_auditoria',       descripcion: 'Ver auditoría',               modulo: 'AUDITORIA' },
  { nombre: 'ver_compras',         descripcion: 'Ver compras',                 modulo: 'COMPRAS' },
  { nombre: 'crear_compra',        descripcion: 'Registrar compras',           modulo: 'COMPRAS' },
];

const MODULOS = ['POS', 'CAJA', 'INVENTARIO', 'CLIENTES', 'EMPLEADOS', 'AUDITORIA', 'COMPRAS'];

function getDefaultPermisosByRol(rol = '') {
  const r = rol.toLowerCase();
  if (r.includes('admin')) return ALL_PERMISOS_CATALOG.map(p => p.nombre);
  if (r.includes('supervis')) return ['ver_pos','cobrar','aplicar_descuento','anular_venta','ver_caja','abrir_caja','cerrar_caja','corte_parcial','ver_inventario','ver_clientes','crear_cliente','ver_empleados'];
  return ['ver_pos','cobrar','ver_caja','ver_clientes'];
}

export const EditUserModal = () => {
  const { activeModal, closeModal, employeeToEdit, saveEditedEmployee, showToast, allPermisos, updateRolPermisos } = useApp();

  const [tipoDoc, setTipoDoc]     = useState('DNI');
  const [numDoc, setNumDoc]       = useState('');
  const [nombres, setNombres]     = useState('');
  const [apellidos, setApellidos] = useState('');
  const [telefono, setTelefono]   = useState('');
  const [correo, setCorreo]       = useState('');
  const [cargo, setCargo]         = useState('');
  const [role, setRole]           = useState('Cajero');
  const [estado, setEstado]       = useState('ACTIVO');
  const [permisos, setPermisos]   = useState([]);
  const [activeTab, setActiveTab] = useState('datos');

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
      setActiveTab('datos');
    }
  }, [employeeToEdit]);

  if (activeModal !== 'edit-user' || !employeeToEdit) return null;

  const catalog = allPermisos.length > 0 ? allPermisos : ALL_PERMISOS_CATALOG;
  const byModulo = MODULOS.reduce((acc, mod) => {
    acc[mod] = catalog.filter(p => p.modulo === mod);
    return acc;
  }, {});

  const togglePermiso = (nombre) => {
    setPermisos(prev =>
      prev.includes(nombre) ? prev.filter(p => p !== nombre) : [...prev, nombre]
    );
  };

  const toggleModulo = (mod) => {
    const modPerms = (byModulo[mod] || []).map(p => p.nombre);
    const allOn = modPerms.every(p => permisos.includes(p));
    if (allOn) {
      setPermisos(prev => prev.filter(p => !modPerms.includes(p)));
    } else {
      setPermisos(prev => [...new Set([...prev, ...modPerms])]);
    }
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setPermisos(getDefaultPermisosByRol(newRole));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombres.trim() || !apellidos.trim()) {
      showToast('Nombres y apellidos son obligatorios', 'warning');
      return;
    }
    const updatePayload = {
      tipo_identificacion: tipoDoc,
      numero_identificacion: numDoc.trim(),
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      telefono: telefono.trim(),
      correo: correo.trim(),
      cargo: cargo.trim() || role,
      rol: role,
      estado,
    };
    await saveEditedEmployee(employeeToEdit.id_empleado, updatePayload);
    // Map role to id_rol for permissions update
    const rolId = role.toLowerCase().includes('admin') ? 1 : role.toLowerCase().includes('supervis') ? 2 : 3;
    await updateRolPermisos(rolId, permisos);
  };

  const inputCls = 'w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-slate-400 focus:outline-none transition-colors';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Modificar colaborador</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {nombres || employeeToEdit.nombres} {apellidos || employeeToEdit.apellidos}
            </p>
          </div>
          <button className="text-slate-400 hover:text-slate-600 transition-colors" onClick={closeModal}>
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-5 shrink-0">
          {[
            { id: 'datos', label: 'Datos generales' },
            { id: 'permisos', label: 'Permisos de acceso' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2.5 px-1 mr-4 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-slate-800 text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form className="flex flex-col flex-1 overflow-hidden" onSubmit={handleSubmit}>
          <div className="flex-1 overflow-y-auto px-5 py-4">

            {/* ── TAB: Datos ── */}
            {activeTab === 'datos' && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Tipo Doc.</label>
                    <select className={inputCls} value={tipoDoc} onChange={e => setTipoDoc(e.target.value)}>
                      <option>DNI</option>
                      <option>Cédula</option>
                      <option>Pasaporte</option>
                      <option value="Extranjería">Carnet Ext.</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="font-semibold text-slate-600 block mb-1">N° Identificación</label>
                    <input className={inputCls} type="text" value={numDoc} onChange={e => setNumDoc(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Nombres *</label>
                    <input className={inputCls} required type="text" value={nombres} onChange={e => setNombres(e.target.value)} />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Apellidos *</label>
                    <input className={inputCls} required type="text" value={apellidos} onChange={e => setApellidos(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Teléfono</label>
                    <input className={inputCls} type="text" value={telefono} onChange={e => setTelefono(e.target.value)} />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Correo</label>
                    <input className={inputCls} type="email" value={correo} onChange={e => setCorreo(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Cargo operativo</label>
                    <input className={inputCls} type="text" value={cargo} onChange={e => setCargo(e.target.value)} placeholder="Ej: Cajera Turno Mañana" />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Rol RBAC</label>
                    <select className={inputCls} value={role} onChange={e => handleRoleChange(e.target.value)}>
                      <option value="Cajero">Cajero</option>
                      <option value="Supervisor de Caja">Supervisor</option>
                      <option value="Administrador General">Administrador</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Estado</label>
                  <select className={inputCls} value={estado} onChange={e => setEstado(e.target.value)}>
                    <option value="ACTIVO">ACTIVO — permite acceso y turnos</option>
                    <option value="INACTIVO">INACTIVO — acceso bloqueado</option>
                  </select>
                </div>
              </div>
            )}

            {/* ── TAB: Permisos ── */}
            {activeTab === 'permisos' && (
              <div className="space-y-2 text-xs">
                <p className="text-[11px] text-slate-500 mb-3">
                  Activa o desactiva permisos individuales. Al cambiar el rol en "Datos generales" se aplican los permisos predeterminados.
                  <span className="font-semibold text-slate-700"> {permisos.length}/{catalog.length} permisos activos.</span>
                </p>
                {MODULOS.map(mod => {
                  const modPerms = byModulo[mod] || [];
                  if (modPerms.length === 0) return null;
                  const allOn = modPerms.every(p => permisos.includes(p.nombre));
                  const someOn = modPerms.some(p => permisos.includes(p.nombre));
                  return (
                    <div key={mod} className="border border-slate-200 rounded-lg overflow-hidden">
                      {/* Module header */}
                      <button
                        type="button"
                        onClick={() => toggleModulo(mod)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <span className="font-bold text-slate-700 text-[10px] uppercase tracking-wide">{mod}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">{modPerms.filter(p => permisos.includes(p.nombre)).length}/{modPerms.length}</span>
                          <div className={`w-8 h-4 rounded-full transition-colors relative ${allOn ? 'bg-slate-700' : someOn ? 'bg-slate-300' : 'bg-slate-200'}`}>
                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${allOn ? 'left-4' : 'left-0.5'}`} />
                          </div>
                        </div>
                      </button>
                      {/* Individual permissions */}
                      <div className="divide-y divide-slate-100">
                        {modPerms.map(p => {
                          const on = permisos.includes(p.nombre);
                          return (
                            <label key={p.nombre} className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors">
                              <span className={`text-[11px] ${on ? 'text-slate-700' : 'text-slate-400'}`}>{p.descripcion}</span>
                              <input
                                type="checkbox"
                                className="w-3.5 h-3.5 accent-slate-700 cursor-pointer"
                                checked={on}
                                onChange={() => togglePermiso(p.nombre)}
                              />
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

          {/* Footer */}
          <div className="flex gap-2 px-5 py-4 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/api';

const ALL_PERMISOS_CATALOG = [
  { nombre: 'ver_pos',          descripcion: 'Acceso al Terminal POS',              modulo: 'POS' },
  { nombre: 'cobrar',           descripcion: 'Realizar cobros',                      modulo: 'POS' },
  { nombre: 'aplicar_descuento',descripcion: 'Aplicar descuentos a ventas',          modulo: 'POS' },
  { nombre: 'anular_venta',     descripcion: 'Anular ventas completadas',            modulo: 'POS' },
  { nombre: 'ver_caja',         descripcion: 'Ver control de caja',                  modulo: 'CAJA' },
  { nombre: 'abrir_caja',       descripcion: 'Apertura de caja',                     modulo: 'CAJA' },
  { nombre: 'cerrar_caja',      descripcion: 'Cierre de caja (Z)',                   modulo: 'CAJA' },
  { nombre: 'corte_parcial',    descripcion: 'Corte parcial (X)',                    modulo: 'CAJA' },
  { nombre: 'ver_inventario',   descripcion: 'Ver catálogo e inventario',            modulo: 'INVENTARIO' },
  { nombre: 'crear_producto',   descripcion: 'Crear nuevos productos',               modulo: 'INVENTARIO' },
  { nombre: 'editar_producto',  descripcion: 'Editar productos existentes',          modulo: 'INVENTARIO' },
  { nombre: 'ver_clientes',     descripcion: 'Ver directorio de clientes',           modulo: 'CLIENTES' },
  { nombre: 'crear_cliente',    descripcion: 'Registrar nuevos clientes',            modulo: 'CLIENTES' },
  { nombre: 'ver_empleados',       descripcion: 'Ver lista de empleados',               modulo: 'EMPLEADOS' },
  { nombre: 'crear_empleado',      descripcion: 'Registrar nuevos empleados',           modulo: 'EMPLEADOS' },
  { nombre: 'modificar_empleado',  descripcion: 'Modificar datos de empleados',         modulo: 'EMPLEADOS' },
  { nombre: 'desactivar_empleado', descripcion: 'Activar o desactivar empleados',       modulo: 'EMPLEADOS' },
  { nombre: 'ver_auditoria',       descripcion: 'Ver registro de auditoría',            modulo: 'AUDITORIA' },
  { nombre: 'ver_compras',         descripcion: 'Ver compras y proveedores',            modulo: 'COMPRAS' },
  { nombre: 'crear_compra',        descripcion: 'Registrar compras',                   modulo: 'COMPRAS' },
];

const MODULOS = ['POS', 'CAJA', 'INVENTARIO', 'CLIENTES', 'EMPLEADOS', 'AUDITORIA', 'COMPRAS'];

function getDefaultPermisosByRol(rol = '') {
  const r = rol.toLowerCase();
  if (r.includes('admin')) return ALL_PERMISOS_CATALOG.map(p => p.nombre);
  if (r.includes('supervis')) return ['ver_pos','cobrar','aplicar_descuento','anular_venta','ver_caja','abrir_caja','cerrar_caja','corte_parcial','ver_inventario','ver_clientes','crear_cliente','ver_empleados'];
  return ['ver_pos','cobrar','ver_caja','ver_clientes'];
}

export const EmployeeDetailModal = () => {
  const { activeModal, closeModal, employeeDetail, openEditEmployee, openDeactivateEmployee, allPermisos, isAdmin } = useApp();
  const [empPermisos, setEmpPermisos] = useState([]);

  useEffect(() => {
    if (employeeDetail) {
      const rol = employeeDetail.rol || employeeDetail.cargo || 'Cajero';
      // Set default immediately
      setEmpPermisos(getDefaultPermisosByRol(rol));

      // Query server for updated / custom permissions for this employee/user
      const idToQuery = employeeDetail.id_usuario || employeeDetail.id_empleado;
      if (idToQuery) {
        api.getPermisosByUsuario(idToQuery)
          .then((res) => {
            if (res && res.permisos && Array.isArray(res.permisos)) {
              setEmpPermisos(res.permisos);
            }
          })
          .catch(() => {});
      }
    }
  }, [employeeDetail]);

  if (activeModal !== 'detail-user' || !employeeDetail) return null;

  const role = employeeDetail.rol || employeeDetail.cargo || 'Cajero';
  const isActive = (employeeDetail.estado || 'ACTIVO').toUpperCase() === 'ACTIVO';

  const getInitials = (n, a) => `${n?.[0] || 'E'}${a?.[0] || 'M'}`.toUpperCase();

  const catalog = allPermisos.length > 0 ? allPermisos : ALL_PERMISOS_CATALOG;
  const byModulo = MODULOS.reduce((acc, mod) => {
    acc[mod] = catalog.filter(p => p.modulo === mod);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-sm border border-slate-200">
              {getInitials(employeeDetail.nombres, employeeDetail.apellidos)}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {employeeDetail.nombres} {employeeDetail.apellidos}
              </h3>
              <p className="text-[11px] text-slate-500">{employeeDetail.cargo || role}</p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-slate-600 transition-colors" onClick={closeModal}>
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Estado y rol */}
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200 font-medium">{role}</span>
            <span className={`px-2 py-1 rounded-lg border font-medium ${isActive ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
              {isActive ? 'Activo' : 'Inactivo'}
            </span>
          </div>

          {/* Datos */}
          <div className="space-y-1.5 text-xs">
            {[
              ['Documento', `${employeeDetail.tipo_identificacion || 'DNI'}: ${employeeDetail.numero_identificacion || '—'}`],
              ['Correo', employeeDetail.correo || '—'],
              ['Teléfono', employeeDetail.telefono || '—'],
              ['Usuario de acceso', employeeDetail.nombre_usuario || '—'],
              ['Fecha de ingreso', employeeDetail.fecha_ingreso ? String(employeeDetail.fecha_ingreso).split('T')[0] : '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">{label}</span>
                <span className="font-medium text-slate-800 font-mono text-[11px]">{value}</span>
              </div>
            ))}
          </div>

          {/* Permisos por módulo */}
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Permisos asignados</p>
            <div className="space-y-2">
              {MODULOS.map(mod => {
                const modPerms = byModulo[mod] || [];
                if (modPerms.length === 0) return null;
                const granted = modPerms.filter(p => empPermisos.includes(p.nombre));
                if (granted.length === 0 && empPermisos.length > 0) return null;
                return (
                  <div key={mod} className="border border-slate-100 rounded-lg overflow-hidden">
                    <div className="bg-slate-50 px-3 py-1.5 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">{mod}</span>
                      <span className="text-[10px] text-slate-400">{granted.length}/{modPerms.length}</span>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {modPerms.map(p => {
                        const active = empPermisos.includes(p.nombre);
                        return (
                          <div key={p.nombre} className="px-3 py-1.5 flex items-center justify-between gap-2">
                            <span className={`text-[11px] ${active ? 'text-slate-700' : 'text-slate-300 line-through'}`}>
                              {p.descripcion}
                            </span>
                            <span className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${active ? 'bg-slate-700' : 'bg-slate-100'}`}>
                              {active && <span className="material-symbols-outlined text-white" style={{fontSize:'10px'}}>check</span>}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-2 px-5 py-4 border-t border-slate-100 shrink-0">
          {isAdmin && (
            <>
              <button
                onClick={() => { closeModal(); openEditEmployee(employeeDetail); }}
                className="flex-1 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                Modificar
              </button>
              <button
                onClick={() => { closeModal(); openDeactivateEmployee(employeeDetail); }}
                className="flex-1 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">{isActive ? 'person_off' : 'how_to_reg'}</span>
                {isActive ? 'Desactivar' : 'Activar'}
              </button>
            </>
          )}
          <button
            onClick={closeModal}
            className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

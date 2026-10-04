import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../api/api';
import { useApp } from '../../context/AppContext';

export const AuditoriaView = () => {
  const { showToast, employees = [] } = useApp();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOp, setFilterOp] = useState('TODOS');
  const [filterUser, setFilterUser] = useState('TODOS');
  const [filterTabla, setFilterTabla] = useState('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditoria();
      if (Array.isArray(data)) {
        setLogs(data);
      }
    } catch (err) {
      console.warn('Could not load audit logs:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  // Extraer lista única de usuarios registrados en los logs
  const availableUsers = useMemo(() => {
    const userMap = new Map();
    logs.forEach(item => {
      const uName = item.usuario || `Usuario #${item.id_usuario}`;
      if (!userMap.has(uName)) {
        userMap.set(uName, {
          id: item.id_usuario,
          nombre: uName,
          rol: item.rol || 'Sistema'
        });
      }
    });
    return Array.from(userMap.values());
  }, [logs]);

  // Extraer lista única de tablas afectadas
  const availableTables = useMemo(() => {
    const set = new Set();
    logs.forEach(item => {
      if (item.tabla_afectada) set.add(item.tabla_afectada);
    });
    return Array.from(set).sort();
  }, [logs]);

  const getOpBadge = (op = '') => {
    switch (op.toUpperCase()) {
      case 'CREAR':
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
      case 'MODIFICAR':
        return { bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' };
      case 'DESACTIVAR':
        return { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' };
      case 'ANULAR':
        return { bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' };
      default:
        return { bg: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' };
    }
  };

  // Filtrado compuesto
  const filteredLogs = useMemo(() => {
    return logs.filter(item => {
      const matchOp = filterOp === 'TODOS' || (item.operacion && item.operacion.toUpperCase() === filterOp);
      
      const itemUser = (item.usuario || '').toLowerCase();
      const matchUser = filterUser === 'TODOS' || itemUser === filterUser.toLowerCase();

      const matchTabla = filterTabla === 'TODOS' || item.tabla_afectada === filterTabla;

      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q ||
        (item.usuario && item.usuario.toLowerCase().includes(q)) ||
        (item.tabla_afectada && item.tabla_afectada.toLowerCase().includes(q)) ||
        (item.descripcion && item.descripcion.toLowerCase().includes(q)) ||
        (item.operacion && item.operacion.toLowerCase().includes(q)) ||
        String(item.id_registro_afectado || '').includes(q);

      return matchOp && matchUser && matchTabla && matchSearch;
    });
  }, [logs, filterOp, filterUser, filterTabla, searchTerm]);

  // Contadores por usuario seleccionado
  const userCounts = useMemo(() => {
    const counts = {};
    logs.forEach(l => {
      const u = l.usuario || 'Desconocido';
      counts[u] = (counts[u] || 0) + 1;
    });
    return counts;
  }, [logs]);

  const formatTime = (ts) => {
    if (!ts) return '--:--:--';
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return String(ts);
    }
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      return d.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <section className="flex flex-col gap-3 h-full overflow-hidden" id="view-auditoria">
      {/* Header */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">history_toggle_off</span>
              Auditoría y Bitácora de Operaciones (registro_operaciones)
            </h2>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Base de Datos Activa ({logs.length} eventos)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro detallado de acciones por cada empleado / usuario: creación, edición, anulaciones y cambios de estado
          </p>
        </div>

        <button
          onClick={() => {
            loadAuditLogs();
            showToast('Bitácora actualizada con la base de datos', 'refresh');
          }}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200 cursor-pointer shadow-2xs"
        >
          <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>refresh</span>
          Actualizar
        </button>
      </div>

      {/* Tarjetas resumen por usuario */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
        <div 
          onClick={() => setFilterUser('TODOS')}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
            filterUser === 'TODOS' 
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span>Todos los Usuarios</span>
            <span className="text-xs font-mono">{logs.length}</span>
          </div>
          <span className={`text-[10px] block mt-0.5 ${filterUser === 'TODOS' ? 'text-slate-300' : 'text-slate-400'}`}>
            Supervisión global
          </span>
        </div>

        {availableUsers.slice(0, 3).map(u => {
          const isSelected = filterUser.toLowerCase() === u.nombre.toLowerCase();
          const count = userCounts[u.nombre] || 0;
          return (
            <div 
              key={u.id}
              onClick={() => setFilterUser(isSelected ? 'TODOS' : u.nombre)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isSelected 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                  : 'bg-white text-slate-700 border-slate-200 hover:border-blue-200'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold truncate">
                <span className="truncate">{u.nombre}</span>
                <span className="text-xs font-mono ml-1">{count}</span>
              </div>
              <span className={`text-[10px] block mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                {u.rol}
              </span>
            </div>
          );
        })}
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
        {/* Buscador */}
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por usuario, tabla, ID de registro o motivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Filtro por Usuario */}
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-500 text-[11px]">Usuario:</span>
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="TODOS">Todos los usuarios ({logs.length})</option>
            {availableUsers.map(u => (
              <option key={u.id} value={u.nombre}>
                {u.nombre} ({userCounts[u.nombre] || 0} ops)
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por Tabla */}
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-500 text-[11px]">Tabla:</span>
          <select
            value={filterTabla}
            onChange={(e) => setFilterTabla(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 font-mono"
          >
            <option value="TODOS">Todas las tablas</option>
            {availableTables.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Botones de Operación */}
        <div className="flex gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          {['TODOS', 'CREAR', 'MODIFICAR', 'DESACTIVAR', 'ANULAR'].map(op => (
            <button
              key={op}
              onClick={() => setFilterOp(op)}
              className={`px-2 py-1 rounded text-[10.5px] font-bold transition-colors cursor-pointer ${
                filterOp === op ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:bg-white'
              }`}
            >
              {op}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla con scroll independiente */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] sticky top-0 z-10 shadow-xs">
              <tr>
                <th className="p-3">Fecha &amp; Hora</th>
                <th className="p-3">Usuario Responsable</th>
                <th className="p-3 text-center">Operación</th>
                <th className="p-3">Tabla Afectada</th>
                <th className="p-3 text-center">ID Registro</th>
                <th className="p-3">Descripción / Motivo</th>
                <th className="p-3 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    <span className="material-symbols-outlined text-2xl animate-spin text-blue-600 mb-1 block">sync</span>
                    Cargando bitácora de operaciones...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    No hay operaciones que coincidan con los filtros seleccionados
                  </td>
                </tr>
              ) : (
                filteredLogs.map((ev) => {
                  const badge = getOpBadge(ev.operacion);
                  return (
                    <tr key={ev.id_registro} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 whitespace-nowrap">
                        <span className="font-mono text-slate-800 font-semibold block text-[11px]">
                          {formatTime(ev.fecha_hora)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatDate(ev.fecha_hora)}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="font-bold text-slate-900 block">
                          {ev.usuario || `Usuario #${ev.id_usuario}`}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {ev.rol || 'Rol del sistema'}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                          {ev.operacion}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap font-mono font-bold text-slate-700 text-xs">
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200">
                          {ev.tabla_afectada}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap font-mono text-slate-600 text-center font-bold">
                        #{ev.id_registro_afectado || 'N/A'}
                      </td>
                      <td className="p-3 text-slate-600 max-w-sm truncate" title={ev.descripcion || JSON.stringify(ev.datos_nuevos || {})}>
                        {ev.descripcion || JSON.stringify(ev.datos_nuevos || {})}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedLog(ev)}
                          className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer ml-auto shadow-2xs"
                        >
                          <span className="material-symbols-outlined text-xs">visibility</span>
                          Inspeccionar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Inspector de Datos JSON de Auditoría */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-400">verified</span>
                <div>
                  <span className="font-bold text-sm block">
                    Registro de Auditoría #{selectedLog.id_registro} · {selectedLog.operacion}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Tabla: <strong className="text-white font-mono">{selectedLog.tabla_afectada}</strong> · ID #{selectedLog.id_registro_afectado}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4 text-xs overflow-y-auto">
              {/* Metadatos */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Usuario</span>
                  <span className="font-bold text-slate-900">{selectedLog.usuario || 'Sistema'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Rol</span>
                  <span className="font-semibold text-slate-700">{selectedLog.rol || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Fecha y Hora</span>
                  <span className="font-mono text-slate-700">
                    {new Date(selectedLog.fecha_hora).toLocaleString('es-PE')}
                  </span>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Descripción de la Operación
                </span>
                <p className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-800 font-medium">
                  {selectedLog.descripcion || 'Sin descripción adicional'}
                </p>
              </div>

              {/* Datos Anteriores vs Nuevos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Estado Anterior
                  </span>
                  <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48 border border-slate-800">
                    {selectedLog.datos_anteriores 
                      ? JSON.stringify(selectedLog.datos_anteriores, null, 2) 
                      : '// No aplica / Nuevo registro'}
                  </pre>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                    Datos Asentados (Nuevos)
                  </span>
                  <pre className="p-3 bg-slate-900 text-emerald-300 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48 border border-slate-800">
                    {selectedLog.datos_nuevos 
                      ? JSON.stringify(selectedLog.datos_nuevos, null, 2) 
                      : '// Sin datos'}
                  </pre>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};


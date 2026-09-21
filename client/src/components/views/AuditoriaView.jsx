import React, { useState, useEffect } from 'react';
import { api } from '../../api/api';
import { useApp } from '../../context/AppContext';

export const AuditoriaView = () => {
  const { showToast } = useApp();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOp, setFilterOp] = useState('TODOS');
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredLogs = logs.filter(item => {
    const matchOp = filterOp === 'TODOS' || (item.operacion && item.operacion.toUpperCase() === filterOp);
    const q = searchTerm.toLowerCase().trim();
    const matchSearch = !q ||
      (item.usuario && item.usuario.toLowerCase().includes(q)) ||
      (item.tabla_afectada && item.tabla_afectada.toLowerCase().includes(q)) ||
      (item.descripcion && item.descripcion.toLowerCase().includes(q)) ||
      (item.operacion && item.operacion.toLowerCase().includes(q));
    return matchOp && matchSearch;
  });

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
    <section className="flex flex-col gap-3 h-full overflow-y-auto pr-1" id="view-auditoria">
      {/* Header */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">history_toggle_off</span>
              Auditoría y Bitácora de Operaciones (registro_operaciones)
            </h2>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              En Tiempo Real
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Historial inmutable de operaciones (CREAR, MODIFICAR, DESACTIVAR, ANULAR) registradas en el sistema
          </p>
        </div>

        <button
          onClick={() => {
            loadAuditLogs();
            showToast('Bitácora actualizada', 'refresh');
          }}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          Actualizar
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por usuario, tabla o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
          {['TODOS', 'CREAR', 'MODIFICAR', 'DESACTIVAR', 'ANULAR'].map(op => (
            <button
              key={op}
              onClick={() => setFilterOp(op)}
              className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                filterOp === op ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {op}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px]">
              <tr>
                <th className="p-3">Fecha &amp; Hora</th>
                <th className="p-3">Usuario</th>
                <th className="p-3">Operación</th>
                <th className="p-3">Tabla Afectada</th>
                <th className="p-3">ID Reg.</th>
                <th className="p-3">Detalle / Descripción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-slate-400">
                    Cargando bitácora de operaciones...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">
                    No hay operaciones que coincidan con los filtros seleccionados
                  </td>
                </tr>
              ) : (
                filteredLogs.map((ev) => {
                  const badge = getOpBadge(ev.operacion);
                  return (
                    <tr key={ev.id_registro} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 whitespace-nowrap">
                        <span className="font-mono text-slate-700 font-semibold block">
                          {formatTime(ev.fecha_hora)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDate(ev.fecha_hora)}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="font-bold text-slate-800 block">
                          {ev.usuario || `Usuario #${ev.id_usuario}`}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {ev.rol || 'Rol del sistema'}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                          {ev.operacion}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap font-mono font-medium text-slate-600">
                        {ev.tabla_afectada}
                      </td>
                      <td className="p-3 whitespace-nowrap font-mono text-slate-400 text-xs">
                        #{ev.id_registro_afectado || 'N/A'}
                      </td>
                      <td className="p-3 text-slate-600 max-w-md truncate" title={ev.descripcion}>
                        {ev.descripcion || JSON.stringify(ev.datos_nuevos || {})}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

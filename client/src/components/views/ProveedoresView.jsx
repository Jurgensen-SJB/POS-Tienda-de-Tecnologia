import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/api';
import { useApp } from '../../context/AppContext';

// ─── MODAL: Nuevo Proveedor (Estilo unificado con Catálogo & Stock) ───────────
const NewProviderModal = ({ onClose, onSaved }) => {
  const [form, setForm] = useState({ nombre: '', identificacion: '', telefono: '', correo: '', direccion: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError('El nombre / razón social del proveedor es obligatorio.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const created = await api.createProvider(form);
      onSaved(created);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al registrar proveedor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none animate-fade-in" id="modal-new-provider">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-3.5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-lg">local_shipping</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Registrar Nuevo Proveedor</h3>
              <p className="text-[11px] text-slate-500">Ingresa la información comercial, tributaria y datos de contacto</p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors" onClick={onClose} id="btn-close-new-provider">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Form */}
        <form className="space-y-3 text-xs" onSubmit={handleSubmit}>
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Nombre / Razón Social *</label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Ej: Apple Latinoamérica S.A."
              required
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">RUC / Identificación Fiscal</label>
              <input
                name="identificacion"
                value={form.identificacion}
                onChange={handleChange}
                placeholder="RUC-20XXXXXXXXX"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Teléfono / Celular</label>
              <input
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                placeholder="+51-9XXXXXXXX"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Correo Electrónico</label>
              <input
                name="correo"
                type="email"
                value={form.correo}
                onChange={handleChange}
                placeholder="ventas@proveedor.com"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Dirección / Sede</label>
              <input
                name="direccion"
                value={form.direccion}
                onChange={handleChange}
                placeholder="Ciudad, País"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
              onClick={onClose}
              id="btn-cancel-new-provider"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              id="btn-save-new-provider"
            >
              {loading ? (
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-sm">check</span>
              )}
              {loading ? 'Guardando...' : 'Guardar Proveedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── MODAL: Modificar Proveedor ──────────────────────────────────────────────
const EditProviderModal = ({ provider, onClose, onSaved }) => {
  const [form, setForm] = useState({
    nombre: provider.nombre || '',
    identificacion: provider.identificacion || '',
    telefono: provider.telefono || '',
    correo: provider.correo || '',
    direccion: provider.direccion || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError('El nombre del proveedor es obligatorio.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const updated = await api.updateProvider(provider.id_proveedor, form);
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al actualizar proveedor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none animate-fade-in" id="modal-edit-provider">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-3.5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-lg">edit</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Modificar Proveedor</h3>
              <p className="text-[11px] text-slate-500">Actualizar datos de registro de #{provider.id_proveedor}</p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors" onClick={onClose} id="btn-close-edit-provider">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Form */}
        <form className="space-y-3 text-xs" onSubmit={handleSubmit}>
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Nombre / Razón Social *</label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">RUC / Identificación Fiscal</label>
              <input
                name="identificacion"
                value={form.identificacion}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Teléfono / Celular</label>
              <input
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Correo Electrónico</label>
              <input
                name="correo"
                type="email"
                value={form.correo}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Dirección / Sede</label>
              <input
                name="direccion"
                value={form.direccion}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
              onClick={onClose}
              id="btn-cancel-edit-provider"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              id="btn-save-edit-provider"
            >
              {loading ? (
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-sm">check</span>
              )}
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── MODAL: Detalle de Proveedor (Ficha Técnica) ──────────────────────────────
const ProviderDetailModal = ({ provider, onClose, onEdit, onToggle }) => {
  const isActive = (provider.estado || 'ACTIVO').toUpperCase() === 'ACTIVO';
  const fechaReg = provider.fecha_registro
    ? new Date(provider.fecha_registro).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none animate-fade-in" id="modal-detail-provider">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <span className="material-symbols-outlined text-base">local_shipping</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Ficha del Proveedor</h3>
              <p className="text-[11px] text-slate-400">Consulta detallada de información y estatus comercial</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            id="btn-close-detail-provider"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Top Card */}
          <div className="flex gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl items-center">
            <div className="w-14 h-14 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-2xl">storefront</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                  isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {isActive ? '● ACTIVO' : '● INACTIVO'}
                </span>
                <span className="text-slate-400 text-[10px] font-mono">ID #{provider.id_proveedor}</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm truncate">{provider.nombre}</h4>
              <p className="text-slate-500 text-[11px] font-mono">{provider.identificacion || 'Sin RUC registrado'}</p>
            </div>
          </div>

          {/* Grid Stats / Info */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Teléfono</span>
              <div className="flex items-center gap-1 text-slate-700 font-semibold">
                <span className="material-symbols-outlined text-xs text-slate-400">call</span>
                <span>{provider.telefono || 'No registrado'}</span>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Correo Electrónico</span>
              <div className="flex items-center gap-1 text-slate-700 font-semibold truncate">
                <span className="material-symbols-outlined text-xs text-slate-400">mail</span>
                <span className="truncate">{provider.correo || 'No registrado'}</span>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Dirección / Sede</span>
              <div className="flex items-center gap-1 text-slate-700">
                <span className="material-symbols-outlined text-xs text-slate-400 shrink-0">location_on</span>
                <span>{provider.direccion || 'Sin dirección especificada'}</span>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Fecha de Alta en el Sistema</span>
              <div className="flex items-center gap-1 text-slate-700">
                <span className="material-symbols-outlined text-xs text-slate-400">calendar_today</span>
                <span>{fechaReg}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0 bg-slate-50 rounded-b-2xl">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { onClose(); onEdit(provider); }}
              id="btn-edit-from-detail"
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-xs">edit</span>
              Modificar
            </button>
            <button
              onClick={() => onToggle(provider)}
              id="btn-toggle-from-detail"
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-xs">
                {isActive ? 'block' : 'check_circle'}
              </span>
              {isActive ? 'Desactivar' : 'Activar'}
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── MODAL: Confirmar Desactivar / Activar (Estilo DeactivateProductModal) ────
const DeactivateProviderModal = ({ provider, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const isActive = (provider.estado || 'ACTIVO').toUpperCase() === 'ACTIVO';
  const actionText = isActive ? 'Desactivar' : 'Activar';

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const newEstado = isActive ? 'INACTIVO' : 'ACTIVO';
      const updated = await api.toggleProviderStatus(provider.id_proveedor, newEstado);
      onConfirm(updated);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none animate-fade-in" id="modal-deactivate-provider">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
            isActive ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
          }`}>
            <span className="material-symbols-outlined text-lg">
              {isActive ? 'block' : 'check_circle'}
            </span>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              ¿{actionText} proveedor?
            </h3>
            <p className="text-[11px] text-slate-400">
              #{provider.id_proveedor} - {provider.identificacion || 'Sin RUC'}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {isActive ? (
            <>
              El proveedor <span className="font-semibold text-slate-800">{provider.nombre}</span> pasará a estado <span className="font-semibold text-amber-700">INACTIVO</span>. Ya no aparecerá en las búsquedas activas para compras ni reposición de stock.
            </>
          ) : (
            <>
              El proveedor <span className="font-semibold text-slate-800">{provider.nombre}</span> será reactivado a estado <span className="font-semibold text-emerald-700">ACTIVO</span> y podrá ser vinculado a nuevas órdenes de compra.
            </>
          )}
        </p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            id="btn-cancel-toggle-provider"
            className="px-3.5 py-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg font-semibold text-xs transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            id="btn-confirm-toggle-provider"
            className={`px-4 py-1.5 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 ${
              isActive
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            <span className="material-symbols-outlined text-xs">
              {isActive ? 'block' : 'check'}
            </span>
            {loading ? 'Procesando...' : `Confirmar y ${actionText.toLowerCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── VISTA PRINCIPAL: ProveedoresView (Idéntica a StockView) ────────────────
export const ProveedoresView = () => {
  const { showToast } = useApp();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableSearch, setTableSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('TODOS');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Modals
  const [showNew, setShowNew] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const [toggleTarget, setToggleTarget] = useState(null);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterEstado !== 'TODOS') params.estado = filterEstado;
      if (tableSearch.trim()) params.q = tableSearch.trim();
      const data = await api.getProviders(params);
      setProviders(Array.isArray(data) ? data : []);
    } catch {
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }, [filterEstado, tableSearch]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleNewSaved = (prov) => {
    setProviders((prev) => [prov, ...prev]);
    if (showToast) showToast(`Proveedor "${prov.nombre}" registrado exitosamente`, 'check_circle');
  };

  const handleEditSaved = (updated) => {
    setProviders((prev) => prev.map((p) => (p.id_proveedor === updated.id_proveedor ? updated : p)));
    if (showToast) showToast(`Proveedor "${updated.nombre}" actualizado`, 'check_circle');
  };

  const handleToggleDone = (updated) => {
    setProviders((prev) => prev.map((p) => (p.id_proveedor === updated.id_proveedor ? updated : p)));
    if (showToast) {
      const act = updated.estado === 'ACTIVO' ? 'activado' : 'desactivado';
      showToast(`Proveedor ${act} correctamente`, 'info');
    }
  };

  const handleToggle = (prov) => {
    setDetailTarget(null);
    setToggleTarget(prov);
  };

  const countActive = providers.filter((p) => (p.estado || 'ACTIVO').toUpperCase() === 'ACTIVO').length;
  const countInactive = providers.filter((p) => (p.estado || 'ACTIVO').toUpperCase() === 'INACTIVO').length;

  return (
    <section className="flex flex-col gap-3 h-full overflow-hidden" id="view-proveedores">
      {/* Top Header Card - Match Catálogo & Stock */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">local_shipping</span> Gestión de Proveedores
          </h2>
          <p className="text-xs text-slate-500">
            Registro, consulta técnica, modificación y control de estatus de mayoristas y distribuidores
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* View Mode Toggle: Tabla | Tarjetas */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('table')}
              id="btn-view-table"
              className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'table' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista en tabla detallada"
            >
              <span className="material-symbols-outlined text-sm">table_rows</span> Tabla
            </button>
            <button
              onClick={() => setViewMode('grid')}
              id="btn-view-cards"
              className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'grid' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista en tarjetas visuales"
            >
              <span className="material-symbols-outlined text-sm">grid_view</span> Tarjetas
            </button>
          </div>

          {/* New Provider Button: Dark Slate Navy like Catálogo & Stock */}
          <button
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs shrink-0 cursor-pointer"
            onClick={() => setShowNew(true)}
            id="btn-new-provider"
          >
            <span className="material-symbols-outlined text-sm font-bold">add</span> Nuevo Proveedor
          </button>
        </div>
      </div>

      {/* Search & Filter Pills: Exactly matching Catálogo & Stock */}
      <div className="flex items-center gap-2 flex-wrap text-xs shrink-0">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            search
          </span>
          <input
            type="text"
            id="provider-search"
            placeholder="Buscar por nombre, razón social, RUC o correo..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-slate-400 focus:outline-none transition-colors shadow-xs"
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
          />
        </div>

        {/* Filter Pills: Activo | Inactivo | Todos */}
        <div className="flex gap-0.5 bg-white border border-slate-200 rounded-lg p-0.5 shadow-xs" id="provider-estado-pills">
          {['ACTIVO', 'INACTIVO', 'TODOS'].map((est) => (
            <button
              key={est}
              id={`pill-estado-${est.toLowerCase()}`}
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

      {/* Main Content Area: Scrollable Downward */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex-1 min-h-0 flex flex-col overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
            <p className="text-xs">Cargando proveedores...</p>
          </div>
        ) : providers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">local_shipping</span>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-600">No se encontraron proveedores</p>
              <p className="text-xs">Prueba con otro término de búsqueda o registra un nuevo proveedor.</p>
            </div>
            <button
              onClick={() => setShowNew(true)}
              className="px-3.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
            >
              + Nuevo Proveedor
            </button>
          </div>
        ) : viewMode === 'table' ? (
          /* TABLA CON SCROLL VERTICAL Y STICKY HEADER (IGUAL A STOCKVIEW) */
          <div className="flex-1 overflow-y-auto min-h-0 relative">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 z-10 shadow-xs">
                <tr>
                  <th className="py-2.5 px-3">Proveedor / Razón Social</th>
                  <th className="py-2.5 px-3">RUC / Identificación</th>
                  <th className="py-2.5 px-3">Teléfono</th>
                  <th className="py-2.5 px-3">Correo</th>
                  <th className="py-2.5 px-3">Dirección</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                  <th className="py-2.5 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {providers.map((prov) => {
                  const isActive = (prov.estado || 'ACTIVO').toUpperCase() === 'ACTIVO';
                  return (
                    <tr
                      key={prov.id_proveedor}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      onClick={() => setDetailTarget(prov)}
                      id={`prov-row-${prov.id_proveedor}`}
                    >
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold shrink-0">
                            <span className="material-symbols-outlined text-sm">storefront</span>
                          </div>
                          <span className="group-hover:text-blue-600 transition-colors">{prov.nombre}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{prov.identificacion || '—'}</td>
                      <td className="py-2.5 px-3">{prov.telefono || '—'}</td>
                      <td className="py-2.5 px-3 text-slate-500">{prov.correo || '—'}</td>
                      <td className="py-2.5 px-3 text-slate-500 truncate max-w-[200px]">{prov.direccion || '—'}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setDetailTarget(prov)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors"
                            title="Consultar ficha"
                            id={`btn-view-prov-${prov.id_proveedor}`}
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                          </button>
                          <button
                            onClick={() => setEditTarget(prov)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors"
                            title="Modificar datos"
                            id={`btn-edit-prov-${prov.id_proveedor}`}
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button
                            onClick={() => handleToggle(prov)}
                            className={`p-1 hover:bg-slate-100 rounded transition-colors ${
                              isActive ? 'text-slate-400 hover:text-amber-600' : 'text-slate-400 hover:text-emerald-600'
                            }`}
                            title={isActive ? 'Desactivar proveedor' : 'Activar proveedor'}
                            id={`btn-toggle-prov-${prov.id_proveedor}`}
                          >
                            <span className="material-symbols-outlined text-sm">
                              {isActive ? 'block' : 'check_circle'}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* TARJETAS CON SCROLL VERTICAL (IGUAL A STOCKVIEW CARDS) */
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {providers.map((prov) => {
                const isActive = (prov.estado || 'ACTIVO').toUpperCase() === 'ACTIVO';
                return (
                  <div
                    key={prov.id_proveedor}
                    onClick={() => setDetailTarget(prov)}
                    className="border border-slate-200 rounded-xl p-3.5 hover:border-slate-300 hover:shadow-sm transition-all bg-white flex flex-col justify-between cursor-pointer group"
                    id={`prov-card-${prov.id_proveedor}`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold shrink-0">
                            <span className="material-symbols-outlined text-base">storefront</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                              {prov.nombre}
                            </h4>
                            <span className="text-[10px] font-mono text-slate-400">
                              {prov.identificacion || 'Sin RUC'}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>

                      <div className="space-y-1 my-2 text-[11px] text-slate-600 border-t border-slate-50 pt-2">
                        {prov.telefono && (
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <span className="material-symbols-outlined text-xs text-slate-400">call</span>
                            <span>{prov.telefono}</span>
                          </div>
                        )}
                        {prov.correo && (
                          <div className="flex items-center gap-1.5 text-slate-500 truncate">
                            <span className="material-symbols-outlined text-xs text-slate-400">mail</span>
                            <span className="truncate">{prov.correo}</span>
                          </div>
                        )}
                        {prov.direccion && (
                          <div className="flex items-center gap-1.5 text-slate-400 truncate text-[10px]">
                            <span className="material-symbols-outlined text-xs text-slate-300">location_on</span>
                            <span className="truncate">{prov.direccion}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setDetailTarget(prov)}
                        className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded text-xs font-semibold flex items-center gap-0.5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-xs">visibility</span> Ver
                      </button>
                      <button
                        onClick={() => setEditTarget(prov)}
                        className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded text-xs font-semibold flex items-center gap-0.5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-xs">edit</span> Modificar
                      </button>
                      <button
                        onClick={() => handleToggle(prov)}
                        className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-0.5 transition-colors ${
                          isActive ? 'text-amber-700 hover:bg-amber-50' : 'text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xs">
                          {isActive ? 'block' : 'check_circle'}
                        </span>
                        {isActive ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sticky Footer Bar - Info count */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-3">
            <span>
              Total: <strong className="text-slate-800 font-bold">{providers.length}</strong> proveedores
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Activos:{' '}
              <strong className="text-slate-800 font-bold">{countActive}</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> Inactivos:{' '}
              <strong className="text-slate-800 font-bold">{countInactive}</strong>
            </span>
          </div>

          <div className="text-[11px] text-slate-400">Gestión de Proveedores NexPOS</div>
        </div>
      </div>

      {/* Modales */}
      {showNew && <NewProviderModal onClose={() => setShowNew(false)} onSaved={handleNewSaved} />}
      {editTarget && <EditProviderModal provider={editTarget} onClose={() => setEditTarget(null)} onSaved={handleEditSaved} />}
      {detailTarget && (
        <ProviderDetailModal
          provider={detailTarget}
          onClose={() => setDetailTarget(null)}
          onEdit={(p) => setEditTarget(p)}
          onToggle={(p) => handleToggle(p)}
        />
      )}
      {toggleTarget && (
        <DeactivateProviderModal
          provider={toggleTarget}
          onClose={() => setToggleTarget(null)}
          onConfirm={handleToggleDone}
        />
      )}
    </section>
  );
};

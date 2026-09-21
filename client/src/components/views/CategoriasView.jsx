import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/api';
import { useApp } from '../../context/AppContext';

// ─── MODAL: Nueva Categoría (Estilo idéntico a Catálogo & Stock) ─────────────
const NewCategoryModal = ({ onClose, onSaved }) => {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre de la categoría es obligatorio.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const created = await api.createCategory({ nombre: nombre.trim(), descripcion: descripcion.trim() });
      onSaved(created);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al registrar categoría.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none animate-fade-in" id="modal-new-category">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-3.5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-lg">category</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Registrar Nueva Categoría</h3>
              <p className="text-[11px] text-slate-500">Clasifica y agrupa los productos del catálogo comercial</p>
            </div>
          </div>
          <button
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={onClose}
            id="btn-close-new-cat"
          >
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
            <label className="font-semibold text-slate-700 block mb-1">Nombre de la Categoría *</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Realidad Virtual & Drones"
              required
              autoFocus
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Descripción / Alcance</label>
            <textarea
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe qué tipo de dispositivos o productos abarca esta categoría..."
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
              onClick={onClose}
              id="btn-cancel-new-cat"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              id="btn-save-new-cat"
            >
              {loading ? (
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-sm">check</span>
              )}
              {loading ? 'Guardando...' : 'Guardar Categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── MODAL: Modificar Categoría ──────────────────────────────────────────────
const EditCategoryModal = ({ category, onClose, onSaved }) => {
  const [nombre, setNombre] = useState(category.nombre || '');
  const [descripcion, setDescripcion] = useState(category.descripcion || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre de la categoría es obligatorio.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const updated = await api.updateCategory(category.id_categoria, {
        nombre: nombre.trim(),
        descripcion: descripcion.trim()
      });
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al actualizar categoría.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none animate-fade-in" id="modal-edit-category">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-3.5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-lg">edit</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Modificar Categoría</h3>
              <p className="text-[11px] text-slate-500">Actualizar especificación de #{category.id_categoria}</p>
            </div>
          </div>
          <button
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={onClose}
            id="btn-close-edit-cat"
          >
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
            <label className="font-semibold text-slate-700 block mb-1">Nombre de la Categoría *</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Descripción / Alcance</label>
            <textarea
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
              onClick={onClose}
              id="btn-cancel-edit-cat"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              id="btn-save-edit-cat"
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

// ─── MODAL: Detalle de Categoría (Ficha Técnica) ─────────────────────────────
const CategoryDetailModal = ({ category, onClose, onEdit, onToggle }) => {
  const isActive = (category.estado || 'ACTIVO').toUpperCase() === 'ACTIVO';
  const fechaReg = category.fecha_registro
    ? new Date(category.fecha_registro).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none animate-fade-in" id="modal-detail-category">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <span className="material-symbols-outlined text-base">category</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Ficha de la Categoría</h3>
              <p className="text-[11px] text-slate-400">Información técnica y distribución en catálogo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            id="btn-close-detail-cat"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          <div className="flex gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl items-center">
            <div className="w-14 h-14 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-2xl">folder_open</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                    isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {isActive ? '● ACTIVO' : '● INACTIVO'}
                </span>
                <span className="text-slate-400 text-[10px] font-mono">ID #{category.id_categoria}</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm truncate">{category.nombre}</h4>
              <p className="text-slate-500 text-[11px]">{category.total_productos || 0} producto{category.total_productos !== 1 ? 's' : ''} asociado{category.total_productos !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Total Productos</span>
              <div className="flex items-center gap-1 text-slate-900 font-bold text-sm">
                <span className="material-symbols-outlined text-sm text-blue-600">inventory_2</span>
                <span>{category.total_productos || 0}</span>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Fecha de Registro</span>
              <div className="flex items-center gap-1 text-slate-700 font-semibold">
                <span className="material-symbols-outlined text-xs text-slate-400">calendar_today</span>
                <span>{fechaReg}</span>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Descripción &amp; Alcance</span>
              <p className="text-slate-600 leading-relaxed">
                {category.descripcion || 'Sin descripción detallada registrada.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0 bg-slate-50 rounded-b-2xl">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { onClose(); onEdit(category); }}
              id="btn-edit-from-detail-cat"
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-xs">edit</span>
              Modificar
            </button>
            <button
              onClick={() => onToggle(category)}
              id="btn-toggle-from-detail-cat"
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

// ─── MODAL: Desactivar / Activar Categoría ────────────────────────────────────
const DeactivateCategoryModal = ({ category, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const isActive = (category.estado || 'ACTIVO').toUpperCase() === 'ACTIVO';
  const actionText = isActive ? 'Desactivar' : 'Activar';

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const newEstado = isActive ? 'INACTIVO' : 'ACTIVO';
      const updated = await api.toggleCategoryStatus(category.id_categoria, newEstado);
      onConfirm(updated);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none animate-fade-in" id="modal-deactivate-category">
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
              ¿{actionText} categoría?
            </h3>
            <p className="text-[11px] text-slate-400">
              #{category.id_categoria} - {category.nombre}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {isActive ? (
            <>
              La categoría <span className="font-semibold text-slate-800">{category.nombre}</span> pasará a estado <span className="font-semibold text-amber-700">INACTIVO</span>. Contiene <strong className="text-slate-800">{category.total_productos || 0} producto(s)</strong> vinculados.
            </>
          ) : (
            <>
              La categoría <span className="font-semibold text-slate-800">{category.nombre}</span> será reactivada a estado <span className="font-semibold text-emerald-700">ACTIVO</span> y podrá asignarse a nuevos productos tecnológicos.
            </>
          )}
        </p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            id="btn-cancel-toggle-cat"
            className="px-3.5 py-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg font-semibold text-xs transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            id="btn-confirm-toggle-cat"
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

// ─── VISTA PRINCIPAL: CategoriasView (Idéntica a Catálogo & Stock) ───────────
export const CategoriasView = () => {
  const { showToast, fetchCategories: reloadCategories } = useApp();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableSearch, setTableSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('TODOS');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Modals
  const [showNew, setShowNew] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const [toggleTarget, setToggleTarget] = useState(null);

  const fetchCats = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterEstado !== 'TODOS') params.estado = filterEstado;
      if (tableSearch.trim()) params.q = tableSearch.trim();
      const data = await api.getCategories(params);
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [filterEstado, tableSearch]);

  useEffect(() => {
    fetchCats();
  }, [fetchCats]);

  const handleNewSaved = (cat) => {
    setCategories((prev) => [cat, ...prev]);
    if (reloadCategories) reloadCategories();
    if (showToast) showToast(`Categoría "${cat.nombre}" creada con éxito`, 'check_circle');
  };

  const handleEditSaved = (updated) => {
    setCategories((prev) => prev.map((c) => (c.id_categoria === updated.id_categoria ? updated : c)));
    if (reloadCategories) reloadCategories();
    if (showToast) showToast(`Categoría "${updated.nombre}" actualizada`, 'check_circle');
  };

  const handleToggleDone = (updated) => {
    setCategories((prev) => prev.map((c) => (c.id_categoria === updated.id_categoria ? updated : c)));
    if (reloadCategories) reloadCategories();
    if (showToast) {
      const act = updated.estado === 'ACTIVO' ? 'activada' : 'desactivada';
      showToast(`Categoría ${act} correctamente`, 'info');
    }
  };

  const handleToggle = (cat) => {
    setDetailTarget(null);
    setToggleTarget(cat);
  };

  const countActive = categories.filter((c) => (c.estado || 'ACTIVO').toUpperCase() === 'ACTIVO').length;
  const countInactive = categories.filter((c) => (c.estado || 'ACTIVO').toUpperCase() === 'INACTIVO').length;
  const totalProductsInCats = categories.reduce((sum, c) => sum + (parseInt(c.total_productos) || 0), 0);

  return (
    <section className="flex flex-col gap-3 h-full overflow-hidden" id="view-categorias">
      {/* Top Header Card - Match Catálogo & Stock */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">category</span> Gestión de Categorías
          </h2>
          <p className="text-xs text-slate-500">
            Clasificar, consultar y gestionar las categorías de productos tecnológicos comercializados
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* View Mode Toggle: Tabla | Tarjetas */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('table')}
              id="btn-view-table-cat"
              className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'table' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista en tabla detallada"
            >
              <span className="material-symbols-outlined text-sm">table_rows</span> Tabla
            </button>
            <button
              onClick={() => setViewMode('grid')}
              id="btn-view-cards-cat"
              className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'grid' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista en tarjetas visuales"
            >
              <span className="material-symbols-outlined text-sm">grid_view</span> Tarjetas
            </button>
          </div>

          {/* New Category Button: Dark Slate Navy like Catálogo & Stock */}
          <button
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs shrink-0 cursor-pointer"
            onClick={() => setShowNew(true)}
            id="btn-new-category"
          >
            <span className="material-symbols-outlined text-sm font-bold">add</span> Nueva Categoría
          </button>
        </div>
      </div>

      {/* Search & Filter Pills: Exactly matching Catálogo & Stock */}
      <div className="flex items-center gap-2 flex-wrap text-xs shrink-0">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            search
          </span>
          <input
            type="text"
            id="category-search"
            placeholder="Buscar por nombre de categoría o descripción..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-slate-400 focus:outline-none transition-colors shadow-xs"
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
          />
        </div>

        {/* Filter Pills: Activo | Inactivo | Todos */}
        <div className="flex gap-0.5 bg-white border border-slate-200 rounded-lg p-0.5 shadow-xs" id="cat-estado-pills">
          {['ACTIVO', 'INACTIVO', 'TODOS'].map((est) => (
            <button
              key={est}
              id={`pill-cat-${est.toLowerCase()}`}
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
            <p className="text-xs">Cargando categorías...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">category</span>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-600">No se encontraron categorías</p>
              <p className="text-xs">Prueba con otro término de búsqueda o crea una nueva categoría.</p>
            </div>
            <button
              onClick={() => setShowNew(true)}
              className="px-3.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
            >
              + Nueva Categoría
            </button>
          </div>
        ) : viewMode === 'table' ? (
          /* TABLA CON SCROLL VERTICAL Y STICKY HEADER */
          <div className="flex-1 overflow-y-auto min-h-0 relative">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 z-10 shadow-xs">
                <tr>
                  <th className="py-2.5 px-3">Categoría</th>
                  <th className="py-2.5 px-3">Descripción &amp; Alcance</th>
                  <th className="py-2.5 px-3 text-center">Productos en Catálogo</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                  <th className="py-2.5 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {categories.map((cat) => {
                  const isActive = (cat.estado || 'ACTIVO').toUpperCase() === 'ACTIVO';
                  return (
                    <tr
                      key={cat.id_categoria}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      onClick={() => setDetailTarget(cat)}
                      id={`cat-row-${cat.id_categoria}`}
                    >
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold shrink-0">
                            <span className="material-symbols-outlined text-sm">folder_open</span>
                          </div>
                          <span className="group-hover:text-blue-600 transition-colors">{cat.nombre}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 max-w-[320px] truncate">{cat.descripcion || '—'}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[11px]">
                          {cat.total_productos || 0} producto{(cat.total_productos || 0) !== 1 ? 's' : ''}
                        </span>
                      </td>
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
                            onClick={() => setDetailTarget(cat)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors"
                            title="Consultar ficha"
                            id={`btn-view-cat-${cat.id_categoria}`}
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                          </button>
                          <button
                            onClick={() => setEditTarget(cat)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors"
                            title="Modificar categoría"
                            id={`btn-edit-cat-${cat.id_categoria}`}
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button
                            onClick={() => handleToggle(cat)}
                            className={`p-1 hover:bg-slate-100 rounded transition-colors ${
                              isActive ? 'text-slate-400 hover:text-amber-600' : 'text-slate-400 hover:text-emerald-600'
                            }`}
                            title={isActive ? 'Desactivar categoría' : 'Activar categoría'}
                            id={`btn-toggle-cat-${cat.id_categoria}`}
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
          /* TARJETAS CON SCROLL VERTICAL */
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map((cat) => {
                const isActive = (cat.estado || 'ACTIVO').toUpperCase() === 'ACTIVO';
                return (
                  <div
                    key={cat.id_categoria}
                    onClick={() => setDetailTarget(cat)}
                    className="border border-slate-200 rounded-xl p-3.5 hover:border-slate-300 hover:shadow-sm transition-all bg-white flex flex-col justify-between cursor-pointer group"
                    id={`cat-card-${cat.id_categoria}`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold shrink-0">
                            <span className="material-symbols-outlined text-base">folder_open</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                              {cat.nombre}
                            </h4>
                            <span className="text-[10px] font-mono text-slate-400">ID #{cat.id_categoria}</span>
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

                      <p className="text-[11px] text-slate-600 line-clamp-2 my-2 min-h-[32px]">
                        {cat.descripcion || 'Sin descripción detallada.'}
                      </p>

                      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold border-t border-slate-50 pt-2">
                        <span className="material-symbols-outlined text-sm text-blue-600">inventory_2</span>
                        <span>{cat.total_productos || 0} productos asociados</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setDetailTarget(cat)}
                        className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded text-xs font-semibold flex items-center gap-0.5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-xs">visibility</span> Ver
                      </button>
                      <button
                        onClick={() => setEditTarget(cat)}
                        className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded text-xs font-semibold flex items-center gap-0.5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-xs">edit</span> Modificar
                      </button>
                      <button
                        onClick={() => handleToggle(cat)}
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
              Total: <strong className="text-slate-800 font-bold">{categories.length}</strong> categorías
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Activas:{' '}
              <strong className="text-slate-800 font-bold">{countActive}</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> Inactivas:{' '}
              <strong className="text-slate-800 font-bold">{countInactive}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span>
              Total ítems en catálogo:{' '}
              <strong className="text-slate-800 font-bold">{totalProductsInCats}</strong>
            </span>
          </div>

          <div className="text-[11px] text-slate-400">Gestión de Categorías NexPOS</div>
        </div>
      </div>

      {/* Modales */}
      {showNew && <NewCategoryModal onClose={() => setShowNew(false)} onSaved={handleNewSaved} />}
      {editTarget && <EditCategoryModal category={editTarget} onClose={() => setEditTarget(null)} onSaved={handleEditSaved} />}
      {detailTarget && (
        <CategoryDetailModal
          category={detailTarget}
          onClose={() => setDetailTarget(null)}
          onEdit={(c) => setEditTarget(c)}
          onToggle={(c) => handleToggle(c)}
        />
      )}
      {toggleTarget && (
        <DeactivateCategoryModal
          category={toggleTarget}
          onClose={() => setToggleTarget(null)}
          onConfirm={handleToggleDone}
        />
      )}
    </section>
  );
};

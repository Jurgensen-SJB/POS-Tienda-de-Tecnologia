import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export const EditClientModal = () => {
  const { activeModal, closeModal, clientToEdit, saveEditedClient, showToast } = useApp();

  const [tipoDoc, setTipoDoc] = useState('DNI');
  const [numDoc, setNumDoc] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [direccion, setDireccion] = useState('');
  const [estado, setEstado] = useState('ACTIVO');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (clientToEdit) {
      setTipoDoc(clientToEdit.tipo_identificacion || 'DNI');
      setNumDoc(clientToEdit.numero_identificacion || '');
      setNombres(clientToEdit.nombres || '');
      setApellidos(clientToEdit.apellidos || '');
      setTelefono(clientToEdit.telefono || '');
      setCorreo(clientToEdit.correo || '');
      setDireccion(clientToEdit.direccion || '');
      setEstado(clientToEdit.estado || 'ACTIVO');
    }
  }, [clientToEdit]);

  if (activeModal !== 'edit-client' || !clientToEdit) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!numDoc.trim() || !nombres.trim()) {
      showToast('Número de documento y nombres son obligatorios', 'warning');
      return;
    }

    setLoading(true);
    try {
      await saveEditedClient(clientToEdit.id_cliente, {
        tipo_identificacion: tipoDoc,
        numero_identificacion: numDoc.trim(),
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        telefono: telefono.trim(),
        correo: correo.trim(),
        direccion: direccion.trim(),
        estado
      });
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
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <span className="material-symbols-outlined text-base">edit</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Modificar Cliente</h3>
              <p className="text-[11px] text-slate-400">Actualizar información de contacto y fiscal</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Form */}
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
                <option value="DNI">DNI</option>
                <option value="RUC">RUC</option>
                <option value="CE">C.E.</option>
                <option value="PASAPORTE">Pasaporte</option>
                <option value="GENERAL">General</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block font-semibold text-slate-700 text-[11px] mb-1">
                Número de documento <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
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
                Teléfono / Celular
              </label>
              <input
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 text-[11px] mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
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
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block font-semibold text-slate-700 text-[11px] mb-1">
              Estado de la cuenta
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className={inputCls}
            >
              <option value="ACTIVO">ACTIVO — Habilitado para emitir comprobantes</option>
              <option value="INACTIVO">INACTIVO — Bloqueado temporalmente</option>
            </select>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={closeModal}
              className="px-3.5 py-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg font-semibold text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

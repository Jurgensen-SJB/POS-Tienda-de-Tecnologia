import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const PaymentMethodsModal = () => {
  const { 
    activeModal, 
    closeModal, 
    paymentMethods, 
    addPaymentMethod, 
    editPaymentMethod, 
    togglePaymentMethodStatus,
    showToast 
  } = useApp();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formNombre, setFormNombre] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');

  if (activeModal !== 'payment-methods') return null;

  const handleStartCreate = () => {
    setEditingId(null);
    setFormNombre('');
    setFormDescripcion('');
    setIsCreating(true);
  };

  const handleStartEdit = (pm) => {
    setIsCreating(false);
    setEditingId(pm.id_forma_pago);
    setFormNombre(pm.nombre);
    setFormDescripcion(pm.descripcion || '');
  };

  const handleCancelForm = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormNombre('');
    setFormDescripcion('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formNombre.trim()) {
      showToast('Ingresa el nombre del método de pago', 'warning');
      return;
    }

    if (isCreating) {
      await addPaymentMethod({ nombre: formNombre.trim(), descripcion: formDescripcion.trim() });
    } else if (editingId) {
      await editPaymentMethod(editingId, { nombre: formNombre.trim(), descripcion: formDescripcion.trim() });
    }
    handleCancelForm();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 text-xl">credit_card_gear</span>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Administración de Formas de Pago</h3>
              <p className="text-[11px] text-slate-500">Gestión de métodos de cobro en POS y transacciones (Tabla formas_pago)</p>
            </div>
          </div>
          <button 
            onClick={closeModal} 
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
          {/* Top action */}
          {!isCreating && !editingId && (
            <div className="flex justify-between items-center bg-blue-50/60 border border-blue-200 rounded-xl p-3">
              <div>
                <span className="font-bold text-blue-900 text-xs block">Configurar Métodos Habilitados</span>
                <span className="text-[11px] text-blue-700">Define qué métodos están disponibles en el terminal para cobro</span>
              </div>
              <button
                type="button"
                onClick={handleStartCreate}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Nueva Forma de Pago
              </button>
            </div>
          )}

          {/* Create / Edit Form */}
          {(isCreating || editingId) && (
            <form onSubmit={handleSave} className="bg-slate-50 border border-blue-200 rounded-xl p-3.5 space-y-3">
              <div className="font-bold text-slate-800 text-xs flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-blue-600">
                  {isCreating ? 'add_circle' : 'edit'}
                </span>
                {isCreating ? 'Registrar Nueva Forma de Pago' : 'Editar Forma de Pago'}
              </div>
              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nombre del Método *</label>
                  <input
                    type="text"
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    placeholder="Ej. Billetera Digital Yape/Plin, Cheque, Vale"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Descripción / Instrucción</label>
                  <input
                    type="text"
                    value={formDescripcion}
                    onChange={(e) => setFormDescripcion(e.target.value)}
                    placeholder="Ej. Pago mediante QR o número celular"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-3 py-1 bg-white border border-slate-300 text-slate-600 rounded-lg font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
                >
                  {isCreating ? 'Crear Método' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          )}

          {/* List of payment methods */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="p-2.5">ID</th>
                  <th className="p-2.5">Método de Pago</th>
                  <th className="p-2.5">Descripción</th>
                  <th className="p-2.5 text-center">Estado</th>
                  <th className="p-2.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paymentMethods.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-400">
                      No hay formas de pago registradas.
                    </td>
                  </tr>
                ) : (
                  paymentMethods.map((pm) => {
                    const isActive = pm.estado === 'ACTIVO';
                    return (
                      <tr key={pm.id_forma_pago} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-mono text-slate-400 text-[11px]">#{pm.id_forma_pago}</td>
                        <td className="p-2.5 font-bold text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-slate-500">
                              {pm.nombre.toLowerCase().includes('efectivo') ? 'payments' : (pm.nombre.toLowerCase().includes('tarjeta') ? 'credit_card' : 'qr_code_2')}
                            </span>
                            {pm.nombre}
                          </div>
                        </td>
                        <td className="p-2.5 text-slate-500 text-[11px] max-w-xs truncate" title={pm.descripcion}>
                          {pm.descripcion || 'Sin descripción'}
                        </td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="p-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(pm)}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                              title="Editar nombre/descripción"
                            >
                              <span className="material-symbols-outlined text-sm">edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => togglePaymentMethodStatus(pm.id_forma_pago, isActive ? 'INACTIVO' : 'ACTIVO')}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                                isActive 
                                  ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' 
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                              title={isActive ? 'Desactivar forma de pago' : 'Activar forma de pago'}
                            >
                              {isActive ? 'Desactivar' : 'Activar'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold text-xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

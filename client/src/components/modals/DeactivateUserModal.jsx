import React from 'react';
import { useApp } from '../../context/AppContext';

export const DeactivateUserModal = () => {
  const { activeModal, closeModal, employeeToDeactivate, toggleEmployeeStatusConfirmed } = useApp();

  if (activeModal !== 'deactivate-user' || !employeeToDeactivate) return null;

  const isCurrentlyActive = (employeeToDeactivate.estado || 'ACTIVO').toUpperCase() === 'ACTIVO';
  const actionTitle = isCurrentlyActive ? '¿Desactivar colaborador?' : '¿Reactivar colaborador?';
  const actionDesc = isCurrentlyActive
    ? `El empleado ${employeeToDeactivate.nombres} ${employeeToDeactivate.apellidos} no podrá iniciar sesión en la terminal ni operar cajas registradoras.`
    : `El empleado ${employeeToDeactivate.nombres} ${employeeToDeactivate.apellidos} volverá a tener acceso activo en la terminal y sistema de ventas.`;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-3 text-center">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
          isCurrentlyActive ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
        }`}>
          <span className="material-symbols-outlined text-2xl">
            {isCurrentlyActive ? 'person_off' : 'how_to_reg'}
          </span>
        </div>

        <div>
          <h3 className="font-bold text-slate-900 text-sm">{actionTitle}</h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            {actionDesc}
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
            onClick={closeModal}
          >
            Cancelar
          </button>
          <button
            className={`flex-1 py-1.5 text-white font-bold rounded-lg text-xs transition-colors shadow-xs ${
              isCurrentlyActive
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
            onClick={toggleEmployeeStatusConfirmed}
          >
            {isCurrentlyActive ? 'Sí, Desactivar' : 'Sí, Activar'}
          </button>
        </div>
      </div>
    </div>
  );
};

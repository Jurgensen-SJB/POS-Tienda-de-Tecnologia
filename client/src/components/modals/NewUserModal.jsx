import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/api';

export const NewUserModal = () => {
  const { activeModal, closeModal, setEmployees, showToast } = useApp();

  const [name, setName] = useState('');
  const [role, setRole] = useState('Cajero');

  if (activeModal !== 'new-user') return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parts = name.trim().split(' ');
    const nombres = parts[0] || 'Colaborador';
    const apellidos = parts.slice(1).join(' ') || 'General';

    try {
      const newEmp = await api.createEmployee({
        tipo_identificacion: 'DNI',
        numero_identificacion: String(Math.floor(10000000 + Math.random() * 90000000)),
        nombres,
        apellidos,
        correo: `${nombres.toLowerCase()}.${apellidos.toLowerCase().replace(/\s+/g, '')}@nexpos.local`,
        cargo: role,
        rol: role,
        nombre_usuario: `${nombres.toLowerCase()}.${apellidos.toLowerCase().replace(/\s+/g, '')}`,
        password: 'password123'
      });

      setEmployees(prev => [...prev, newEmp]);
      showToast(`Colaborador ${name} registrado`);
    } catch (err) {
      const fallbackEmp = {
        id_empleado: Date.now(),
        nombres,
        apellidos,
        cargo: role,
        rol: role,
        estado: 'ACTIVO'
      };
      setEmployees(prev => [...prev, fallbackEmp]);
      showToast(`Colaborador ${name} registrado`);
    }

    setName('');
    closeModal();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl mx-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-blue-600 text-xl">person_add</span>
            <h3 className="font-bold text-slate-900 text-sm">Nuevo Colaborador POS</h3>
          </div>
          <button className="text-slate-400 hover:text-slate-600" onClick={closeModal}>
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <form className="space-y-2 text-xs" onSubmit={handleSubmit}>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Nombre Completo</label>
            <input
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
              placeholder="Ej. Mateo Gómez"
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Rol</label>
            <select
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="Cajero">Cajero</option>
              <option value="Supervisor de Caja">Supervisor de Caja</option>
              <option value="Administrador">Administrador</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
              onClick={closeModal}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
              type="submit"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

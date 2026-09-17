import React from 'react';
import { useApp } from '../../context/AppContext';

export const AuditoriaView = () => {
  const { invoices } = useApp();

  const auditEvents = [
    {
      id: 1,
      time: '08:00:15',
      user: 'elena.morales',
      role: 'Administradora',
      module: 'CAJA',
      action: 'Apertura de turno',
      details: 'Caja 01 iniciada con fondo de $150.00'
    },
    {
      id: 2,
      time: '08:05:22',
      user: 'elena.morales',
      role: 'Administradora',
      module: 'INVENTARIO',
      action: 'Verificación de existencias',
      details: 'Conteo inicial de 24 referencias SKU'
    },
    {
      id: 3,
      time: '10:05:40',
      user: 'camila.valenzuela',
      role: 'Cajera',
      module: 'VENTAS',
      action: 'Emisión FAC-002337',
      details: 'Cobro en efectivo $512.80 a Distribuidora del Sur'
    },
    {
      id: 4,
      time: '12:40:11',
      user: 'rodrigo.alarcon',
      role: 'Supervisor',
      module: 'VENTAS',
      action: 'Anulación de comprobante',
      details: 'FAC-002339 anulada ($58.50) con reversión de inventario'
    }
  ];

  return (
    <section className="flex flex-col gap-3 h-full overflow-y-auto pr-1" id="view-auditoria">
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">history_toggle_off</span> Auditoría y Bitácora del Sistema
          </h2>
          <p className="text-xs text-slate-500">Registro inmutable de actividades, permisos y movimientos fiscales</p>
        </div>
        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200">
          Auditoría Activa
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px]">
            <tr>
              <th className="p-3">Hora</th>
              <th className="p-3">Usuario</th>
              <th className="p-3">Módulo</th>
              <th className="p-3">Acción</th>
              <th className="p-3">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {auditEvents.map((ev) => (
              <tr key={ev.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-3 font-mono text-slate-500 font-semibold">{ev.time}</td>
                <td className="p-3">
                  <span className="font-bold text-slate-800 block">{ev.user}</span>
                  <span className="text-[10px] text-slate-400">{ev.role}</span>
                </td>
                <td className="p-3 font-semibold text-blue-600">{ev.module}</td>
                <td className="p-3 font-medium text-slate-700">{ev.action}</td>
                <td className="p-3 text-slate-500">{ev.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

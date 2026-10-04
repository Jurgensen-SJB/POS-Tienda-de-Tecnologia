import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export const CorteXModal = () => {
  const { activeModal, closeModal, caja, invoices, currentUser, showToast } = useApp();

  // ⚠️ Hooks DEBEN ir antes de cualquier return condicional
  const isAdmin = Boolean(currentUser?.rol?.toLowerCase().includes('admin'));
  const currentUserId = currentUser?.id_usuario || 3;
  const [selectedCajeroId, setSelectedCajeroId] = useState(
    isAdmin ? 'TODOS' : currentUserId
  );

  // Sincronizar cuando cambia el usuario o se abre el modal
  useEffect(() => {
    if (activeModal === 'corte-x') {
      const adminCheck = Boolean(currentUser?.rol?.toLowerCase().includes('admin'));
      setSelectedCajeroId(adminCheck ? 'TODOS' : (currentUser?.id_usuario || 3));
    }
  }, [activeModal, currentUser?.id_usuario]);

  if (activeModal !== 'corte-x') return null;

  const cajerosList = [
    { id: 'TODOS', nombre: 'Consolidado General (Toda la Tienda)', cargo: 'Auditoría General', doc: 'RUC-20489182391' },
    { id: 3, nombre: 'Camila Valenzuela', cargo: 'Cajera Turno Mañana', doc: 'DNI-74829103' },
    { id: 2, nombre: 'Rodrigo Alarcón', cargo: 'Supervisor de Caja', doc: 'DNI-45920193' },
    { id: 1, nombre: 'Elena Morales', cargo: 'Administradora General', doc: 'DNI-10293847' }
  ];

  if (currentUser && !cajerosList.some(c => c.id === currentUser.id_usuario)) {
    cajerosList.push({
      id: currentUser.id_usuario,
      nombre: currentUser.nombre_completo || currentUser.nombre || 'Cajero Activo',
      cargo: currentUser.cargo || currentUser.rol || 'Cajero',
      doc: currentUser.numero_identificacion || 'EMP-00' + currentUser.id_usuario
    });
  }

  const now = new Date();
  const fechaStr = now.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const horaStr = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const effectiveCajeroId = isAdmin ? selectedCajeroId : currentUserId;
  const isConsolidated = effectiveCajeroId === 'TODOS';

  const activeCajeroObj = isConsolidated
    ? cajerosList[0]
    : (cajerosList.find(c => String(c.id) === String(effectiveCajeroId)) || {
        id: currentUserId,
        nombre: currentUser?.nombre_completo || currentUser?.nombre || 'Camila Valenzuela',
        cargo: currentUser?.cargo || 'Cajera',
        doc: currentUser?.numero_identificacion || 'EMP-748291'
      });

  const relevantInvoices = invoices.filter(inv => {
    if (isConsolidated) return true;
    if (inv.id_usuario !== undefined && inv.id_usuario !== null) {
      return String(inv.id_usuario) === String(effectiveCajeroId);
    }
    if (inv.cajero) {
      return inv.cajero.toLowerCase().includes(activeCajeroObj.nombre.toLowerCase());
    }
    return false;
  }).filter(inv => inv.estado !== 'ANULADA');

  const ventasEfectivo = relevantInvoices
    .filter(inv => (inv.metodo || '').toLowerCase().includes('efectivo'))
    .reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);

  const ventasTarjeta = relevantInvoices
    .filter(inv => (inv.metodo || '').toLowerCase().includes('tarjeta'))
    .reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);

  const ventasTransf = relevantInvoices
    .filter(inv => {
      const m = (inv.metodo || '').toLowerCase();
      return m.includes('qr') || m.includes('transf') || m.includes('digital') || m.includes('billetera');
    })
    .reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);

  const totalVentasTurno = ventasEfectivo + ventasTarjeta + ventasTransf;

  const fondoInicial = isConsolidated 
    ? parseFloat(caja?.monto_inicial || 500.00) 
    : 150.00;

  const totalEsperadoGaveta = fondoInicial + ventasEfectivo;
  const ticketsCount = relevantInvoices.length;

  const handlePrint = () => {
    showToast('Enviando Corte X a impresora térmica de 80mm...', 'print');
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl flex flex-col max-h-[95vh] overflow-hidden border border-slate-200">
        
        {/* Modal Top Bar (no se imprime) */}
        <div className="p-3 bg-slate-900 text-white flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-400 text-base">receipt_long</span>
            <span className="font-bold text-xs">Arqueo Fiscal Parcial (Corte X)</span>
          </div>
          <button 
            onClick={closeModal} 
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Panel de Auditoría exclusivo para Administrador (no se imprime) */}
        {isAdmin && (
          <div className="px-3 py-2 bg-blue-50 border-b border-blue-200 flex items-center justify-between gap-1.5 no-print shrink-0">
            <span className="text-[11px] font-bold text-blue-900">Auditar:</span>
            <select
              value={selectedCajeroId}
              onChange={(e) => setSelectedCajeroId(e.target.value)}
              className="px-2 py-0.5 bg-white border border-blue-300 rounded text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="TODOS">👥 Consolidado General</option>
              {cajerosList.filter(c => c.id !== 'TODOS').map(c => (
                <option key={c.id} value={c.id}>
                  👤 {c.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Thermal Ticket Content - Clásico rollo 80mm */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100 flex justify-center">
          <div 
            className="printable-receipt bg-white p-4 shadow-sm border border-slate-200 rounded text-slate-800 text-xs font-mono w-full"
            style={{ maxWidth: '300px' }}
          >
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-400">
              <div className="font-bold text-sm tracking-tight">NEXPOS TECNOLOGÍA S.A.C.</div>
              <div className="text-[10px]">RUC: 20489182391</div>
              <div className="text-[10px]">Av. República de Panamá 3545, Lima</div>
              <div className="text-[10px] font-bold mt-2 uppercase border border-slate-700 py-0.5 px-2 inline-block">
                ★ {isConsolidated ? 'CORTE X CONSOLIDADO' : 'CORTE X PARCIAL CAJERO'} ★
              </div>
              <div className="text-[9px] text-slate-600 mt-1">NO VÁLIDO COMO FACTURA O COMPROBANTE DE PAGO</div>
            </div>

            <div className="py-2.5 space-y-1 text-[11px] border-b border-dashed border-slate-300">
              <div className="flex justify-between">
                <span>FECHA: {fechaStr}</span>
                <span>HORA: {horaStr}</span>
              </div>
              <div className="flex justify-between">
                <span>TERMINAL: Caja 01</span>
                <span>TURNO: Mañana</span>
              </div>
              <div className="flex justify-between">
                <span>CAJERO: {activeCajeroObj.nombre}</span>
              </div>
            </div>

            {/* Desglose de Operaciones */}
            <div className="py-2.5 space-y-1.5 text-[11px] border-b border-dashed border-slate-400">
              <div className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1">
                RESUMEN DE INGRESOS
              </div>
              
              <div className="flex justify-between">
                <span>(+) Fondo Inicial Apertura:</span>
                <span className="font-bold">${fondoInicial.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>(+) Ventas Efectivo:</span>
                <span className="font-bold">${ventasEfectivo.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>(+) Ventas Tarjeta POS:</span>
                <span className="font-bold">${ventasTarjeta.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>(+) Pagos Digitales / QR:</span>
                <span className="font-bold">${ventasTransf.toFixed(2)}</span>
              </div>

              <div className="pt-2 border-t border-slate-300 flex justify-between font-bold text-xs">
                <span>TOTAL VENTAS:</span>
                <span>${totalVentasTurno.toFixed(2)}</span>
              </div>
            </div>

            {/* Cuadre de Gaveta */}
            <div className="py-2.5 space-y-1.5 text-[11px] border-b border-dashed border-slate-400 bg-slate-50 p-2 my-2 rounded">
              <div className="font-bold text-slate-900 uppercase text-[10px]">
                ARQUEO FÍSICO ESPERADO
              </div>
              <div className="flex justify-between font-bold text-xs text-slate-900">
                <span>EFECTIVO EN GAVETA:</span>
                <span className="text-emerald-700">${totalEsperadoGaveta.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Total Comprobantes Emitidos:</span>
                <span>{ticketsCount} comprobantes</span>
              </div>
            </div>

            <div className="text-center pt-2 text-[9px] text-slate-500 space-y-0.5">
              <div>*** FIN DEL CORTE PARCIAL X ***</div>
              <div>SUPERVISIÓN Y CONTROL TRIBUTARIO INTERNO</div>
            </div>
          </div>
        </div>

        {/* Action Buttons (no se imprime) */}
        <div className="p-3 bg-white border-t border-slate-200 flex justify-end gap-2 no-print shrink-0">
          <button
            onClick={closeModal}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">print</span>
            Imprimir Ticket (80mm)
          </button>
        </div>

      </div>
    </div>
  );
};

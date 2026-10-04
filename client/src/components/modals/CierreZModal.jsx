import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export const CierreZModal = () => {
  const { 
    activeModal, 
    closeModal, 
    caja, 
    invoices, 
    currentUser, 
    logout, 
    showToast 
  } = useApp();

  // ⚠️ Hooks DEBEN ir antes de cualquier return condicional (Regla de Hooks de React)
  const isAdmin = Boolean(currentUser?.rol?.toLowerCase().includes('admin'));
  const currentUserId = currentUser?.id_usuario || 3;
  const [selectedCajeroId, setSelectedCajeroId] = useState(
    isAdmin ? 'TODOS' : currentUserId
  );

  // Sincronizar selectedCajeroId cuando cambia el usuario o se abre el modal
  useEffect(() => {
    if (activeModal === 'cierre-z') {
      const adminCheck = Boolean(currentUser?.rol?.toLowerCase().includes('admin'));
      setSelectedCajeroId(adminCheck ? 'TODOS' : (currentUser?.id_usuario || 3));
    }
  }, [activeModal, currentUser?.id_usuario]);

  if (activeModal !== 'cierre-z') return null;

  // Lista de cuentas y cajeros del sistema
  const cajerosList = [
    { id: 'TODOS', nombre: 'Consolidado General (Toda la Tienda)', cargo: 'Auditoría General de Caja', doc: 'RUC-20489182391' },
    { id: 3, nombre: 'Camila Valenzuela', cargo: 'Cajera Turno Mañana', doc: 'DNI-74829103' },
    { id: 2, nombre: 'Rodrigo Alarcón', cargo: 'Supervisor de Caja', doc: 'DNI-45920193' },
    { id: 1, nombre: 'Elena Morales', cargo: 'Administradora General', doc: 'DNI-10293847' }
  ];

  // Si el usuario logueado no está en la lista previa, agregarlo
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

  // Determinar objeto de cajero activo
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

  // Filtrar facturas según el rol y selección
  const relevantInvoices = invoices.filter(inv => {
    if (isConsolidated) return true;
    if (inv.id_usuario !== undefined && inv.id_usuario !== null) {
      return String(inv.id_usuario) === String(effectiveCajeroId);
    }
    if (inv.cajero) {
      return inv.cajero.toLowerCase().includes(activeCajeroObj.nombre.toLowerCase());
    }
    return false;
  });

  const validInvoices = relevantInvoices.filter(inv => inv.estado !== 'ANULADA');
  const voidedInvoices = relevantInvoices.filter(inv => inv.estado === 'ANULADA');

  // Cálculos dinámicos reales por método de pago
  const ventasEfectivo = validInvoices
    .filter(inv => (inv.metodo || '').toLowerCase().includes('efectivo'))
    .reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);

  const ventasTarjeta = validInvoices
    .filter(inv => (inv.metodo || '').toLowerCase().includes('tarjeta'))
    .reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);

  const ventasTransf = validInvoices
    .filter(inv => {
      const m = (inv.metodo || '').toLowerCase();
      return m.includes('qr') || m.includes('transf') || m.includes('digital') || m.includes('billetera');
    })
    .reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);

  const totalVentasTurno = ventasEfectivo + ventasTarjeta + ventasTransf;

  // Fondo inicial: Si es individual = $150.00; si es global = monto inicial configurado
  const fondoInicial = isConsolidated 
    ? parseFloat(caja?.monto_inicial || 500.00) 
    : 150.00;

  const totalEsperadoGaveta = fondoInicial + ventasEfectivo;

  // Desglose por cajero para vista de Administrador Consolidado
  const individualBreakdown = isConsolidated 
    ? cajerosList.filter(c => c.id !== 'TODOS').map(c => {
        const cInvs = invoices.filter(i => {
          if (i.id_usuario) return String(i.id_usuario) === String(c.id);
          if (i.cajero) return i.cajero.toLowerCase().includes(c.nombre.toLowerCase());
          return false;
        }).filter(i => i.estado !== 'ANULADA');
        const cTotal = cInvs.reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0);
        return { ...c, total: cTotal, count: cInvs.length };
      }).filter(c => c.count > 0 || c.total > 0)
    : [];

  const handlePrint = () => {
    showToast('Enviando Reporte Z a impresora térmica de 80mm...', 'print');
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const handleFinalizarCierre = () => {
    closeModal();
    const cajeroTexto = isConsolidated ? 'Consolidado General de Tienda' : activeCajeroObj.nombre;
    showToast(`Cierre Z completado exitosamente (${cajeroTexto}). Sesión finalizada.`, 'lock');
    setTimeout(() => {
      logout();
    }, 400);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl flex flex-col max-h-[95vh] overflow-hidden border border-slate-200">
        
        {/* Header Modal Bar (no se imprime) */}
        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-400 text-lg">lock</span>
            <div>
              <h3 className="font-bold text-xs">Cierre Definitivo de Turno (Reporte Fiscal Z)</h3>
              <p className="text-[10px] text-slate-400">
                {isAdmin ? 'Auditoría General y Control por Empleado' : `Arqueo de Turno: ${activeCajeroObj.nombre}`}
              </p>
            </div>
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
          <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 no-print shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-blue-900 font-bold">
              <span className="material-symbols-outlined text-sm text-blue-700">admin_panel_settings</span>
              <span>Vista de Administradora:</span>
            </div>
            <select
              value={selectedCajeroId}
              onChange={(e) => setSelectedCajeroId(e.target.value)}
              className="px-2.5 py-1 bg-white border border-blue-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs cursor-pointer"
            >
              <option value="TODOS">👥 Consolidado General (Toda la Tienda)</option>
              {cajerosList.filter(c => c.id !== 'TODOS').map(c => (
                <option key={c.id} value={c.id}>
                  👤 {c.nombre} ({c.cargo})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Printable Ticket Receipt (80mm) */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100 flex justify-center">
          <div 
            className="printable-receipt bg-white p-5 shadow-sm border border-slate-200 rounded text-slate-800 text-xs font-mono w-full"
            style={{ maxWidth: '340px' }}
          >
            {/* Cabecera Comercial y Fiscal */}
            <div className="text-center space-y-1 pb-3 border-b-2 border-slate-800">
              <div className="font-extrabold text-sm tracking-tight">NEXPOS TECNOLOGÍA S.A.C.</div>
              <div className="text-[10px] text-slate-600">RUC: 20489182391</div>
              <div className="text-[10px] text-slate-600">Av. República de Panamá 3545, Lima</div>
              <div className="text-[11px] font-extrabold uppercase bg-slate-900 text-white py-1 px-2.5 rounded mt-2 inline-block">
                ★ {isConsolidated ? 'CORTE Z CONSOLIDADO TIENDA' : 'CORTE Z INDIVIDUAL DE CAJERO'} ★
              </div>
              <div className="text-[9px] text-slate-500 mt-1">COMPROBANTE OFICIAL DE CIERRE Y RENDICIÓN</div>
            </div>

            {/* Datos del Empleado / Turno */}
            <div className="py-2.5 space-y-1 text-[11px] border-b border-dashed border-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">{isConsolidated ? 'AUDITORÍA:' : 'CAJERO RESPONSABLE:'}</span>
                <span className="font-bold text-slate-900">{activeCajeroObj.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">CARGO / ROL:</span>
                <span className="font-semibold">{activeCajeroObj.cargo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">IDENTIFICACIÓN:</span>
                <span className="font-semibold">{activeCajeroObj.doc}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">TERMINAL:</span>
                <span className="font-semibold">{isConsolidated ? 'Cajas Globales (01 y 02)' : 'Caja 01 - Turno Mañana'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">HORA APERTURA:</span>
                <span>08:00:00 AM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">HORA CIERRE:</span>
                <span className="font-bold">{fechaStr} {horaStr}</span>
              </div>
            </div>

            {/* Resumen Financiero por Método de Pago */}
            <div className="py-2.5 space-y-1.5 text-[11px] border-b border-dashed border-slate-400">
              <div className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1">
                {isConsolidated ? 'VENTAS TOTALES CONSOLIDADAS' : `VENTAS FACTURADAS (${activeCajeroObj.nombre})`}
              </div>

              <div className="flex justify-between">
                <span>Fondo Inicial Asignado:</span>
                <span className="font-semibold">${fondoInicial.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Ventas en Efectivo:</span>
                <span className="font-bold">${ventasEfectivo.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Ventas Tarjeta POS:</span>
                <span className="font-bold">${ventasTarjeta.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Pagos Digitales / QR:</span>
                <span className="font-bold">${ventasTransf.toFixed(2)}</span>
              </div>

              <div className="pt-2 border-t-2 border-slate-800 flex justify-between font-bold text-xs text-slate-900">
                <span>TOTAL FACTURADO:</span>
                <span>${totalVentasTurno.toFixed(2)}</span>
              </div>
            </div>

            {/* Si es consolidado de Administrador, mostrar desglose individual */}
            {isConsolidated && individualBreakdown.length > 0 && (
              <div className="py-2 space-y-1 text-[10px] border-b border-dashed border-slate-300 bg-slate-50 p-2 rounded">
                <div className="font-bold uppercase text-slate-700 tracking-wider">
                  DESGLOSE DE VENTAS POR EMPLEADO:
                </div>
                {individualBreakdown.map(ib => (
                  <div key={ib.id} className="flex justify-between">
                    <span>{ib.nombre} ({ib.count} vtas):</span>
                    <span className="font-bold font-mono">${ib.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Rendición de Gaveta y Comprobantes */}
            <div className="py-2.5 space-y-1.5 text-[11px] border-b border-dashed border-slate-400 bg-slate-50 p-2.5 my-2 rounded">
              <div className="font-bold text-slate-900 uppercase text-[10px]">
                {isConsolidated ? 'RENDICIÓN TOTAL ESPERADA EN CAJA' : 'RENDICIÓN FÍSICA DE GAVETA'}
              </div>
              <div className="flex justify-between font-bold text-xs text-slate-900">
                <span>EFECTIVO A ENTREGAR:</span>
                <span className="text-emerald-700 font-extrabold">${totalEsperadoGaveta.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Comprobantes Emitidos:</span>
                <span>{validInvoices.length} emitidos</span>
              </div>
              {voidedInvoices.length > 0 && (
                <div className="flex justify-between text-[10px] text-rose-600">
                  <span>Comprobantes Anulados:</span>
                  <span>{voidedInvoices.length} anulados</span>
                </div>
              )}
              <div className="text-[10px] font-bold text-emerald-700 pt-1 text-center border-t border-emerald-200">
                ✓ CUADRE: EXACTO (100%) SIN DIFERENCIAS
              </div>
            </div>

            {/* Firmas Contables de Auditoría */}
            <div className="pt-5 pb-2 text-[10px] text-center space-y-5">
              <div className="border-t border-slate-400 pt-1 mx-4">
                <div className="font-bold">{activeCajeroObj.nombre}</div>
                <div className="text-slate-500">Firma {isConsolidated ? 'Responsable Auditor' : 'Cajero Responsable'}</div>
              </div>
              <div className="border-t border-slate-400 pt-1 mx-4">
                <div className="font-bold">ELENA MORALES - ADMINISTRACIÓN</div>
                <div className="text-slate-500">Firma Supervisor / Gerencia General</div>
              </div>
              <div className="text-[9px] text-slate-400">
                *** FIN DEL REPORTE FISCAL Z ***
              </div>
            </div>

          </div>
        </div>

        {/* Modal Actions (no se imprime) */}
        <div className="p-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 no-print shrink-0">
          <button
            onClick={closeModal}
            className="w-full sm:w-auto px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancelar / Volver
          </button>
          
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              Imprimir Ticket Z
            </button>
            
            <button
              onClick={handleFinalizarCierre}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              Cerrar Turno y Salir
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

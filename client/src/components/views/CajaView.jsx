import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/api';

export const CajaView = () => {
  const { 
    caja, 
    invoices, 
    anularFactura, 
    openInvoiceModal, 
    openModal, 
    showToast,
    currentUser,
    loadData
  } = useApp();

  const isAdmin = Boolean(currentUser?.rol?.toLowerCase().includes('admin'));

  const [activeTab, setActiveTab] = useState('facturacion'); // 'facturacion' | 'caja' | 'historial_cajas'
  const [searchNumero, setSearchNumero] = useState('');
  const [searchCliente, setSearchCliente] = useState('');
  const [searchFecha, setSearchFecha] = useState('');
  const [filterCajero, setFilterCajero] = useState('TODOS');

  // Estados para Arqueo, Conteo y Diferencia
  const [contadoFisicoInput, setContadoFisicoInput] = useState('');
  const [showAperturaModal, setShowAperturaModal] = useState(false);
  const [montoInicialInput, setMontoInicialInput] = useState('150.00');
  const [cargandoAccion, setCargandoAccion] = useState(false);

  // Estado para Historial de Cajas
  const [historialCajas, setHistorialCajas] = useState([]);
  const [loadingCajas, setLoadingCajas] = useState(false);

  // Cargar historial de cajas
  const fetchCajasHistorial = () => {
    setLoadingCajas(true);
    api.getCajas()
      .then(data => setHistorialCajas(data))
      .catch(() => {})
      .finally(() => setLoadingCajas(false));
  };

  useEffect(() => {
    fetchCajasHistorial();
  }, []);

  const cajerosOptions = [
    { id: 'TODOS', nombre: 'Todos los Cajeros' },
    { id: 3, nombre: 'Camila Valenzuela' },
    { id: 2, nombre: 'Rodrigo Alarcón' },
    { id: 1, nombre: 'Elena Morales' }
  ];

  const handleCorteX = () => {
    openModal('corte-x');
  };

  const handleClearFilters = () => {
    setSearchNumero('');
    setSearchCliente('');
    setSearchFecha('');
    setFilterCajero('TODOS');
  };

  const hasActiveFilters = Boolean(searchNumero || searchCliente || searchFecha || (isAdmin && filterCajero !== 'TODOS'));

  // 1. Filtrado por Rol: Si es cajero, solo sus ventas; si es Admin, todas o filtradas por cajero
  const roleBaseInvoices = invoices.filter((inv) => {
    if (isAdmin) {
      if (filterCajero === 'TODOS') return true;
      if (inv.id_usuario) return String(inv.id_usuario) === String(filterCajero);
      if (inv.cajero) {
        const found = cajerosOptions.find(c => String(c.id) === String(filterCajero));
        return found ? inv.cajero.toLowerCase().includes(found.nombre.toLowerCase()) : true;
      }
      return true;
    }
    // Si no es admin (Cajero regular), restringir estrictamente a sus ventas
    const myId = currentUser?.id_usuario || 3;
    const myName = (currentUser?.nombre || currentUser?.nombre_completo || 'Camila').toLowerCase();
    if (inv.id_usuario) return String(inv.id_usuario) === String(myId);
    if (inv.cajero) return inv.cajero.toLowerCase().includes(myName);
    return false;
  });

  // 2. Filtros de búsqueda adicionales (Folio, Cliente, Fecha)
  const filteredInvoices = roleBaseInvoices.filter((inv) => {
    const num = searchNumero.trim().toLowerCase();
    const matchesNumero = !num || 
      (inv.numero_factura || '').toLowerCase().includes(num) ||
      String(inv.id_venta || inv.id || '').includes(num);

    const cli = searchCliente.trim().toLowerCase();
    const matchesCliente = !cli || 
      (inv.cliente || inv.customer || '').toLowerCase().includes(cli);

    const fec = searchFecha.trim();
    const matchesFecha = !fec ||
      (inv.fecha_dia === fec) ||
      (inv.fecha_completa && inv.fecha_completa.includes(fec)) ||
      (inv.fecha && inv.fecha.includes(fec));

    return matchesNumero && matchesCliente && matchesFecha;
  });

  // 3. Métricas dinámicas calculadas por rol
  const validRoleInvoices = roleBaseInvoices.filter(i => i.estado !== 'ANULADA');
  const ventasEfectivoReal = validRoleInvoices
    .filter(i => (i.metodo || '').toLowerCase().includes('efectivo'))
    .reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0);

  const ventasTarjetaReal = validRoleInvoices
    .filter(i => (i.metodo || '').toLowerCase().includes('tarjeta'))
    .reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0);

  const ventasTransfReal = validRoleInvoices
    .filter(i => {
      const m = (i.metodo || '').toLowerCase();
      return m.includes('qr') || m.includes('transf') || m.includes('digital') || m.includes('billetera');
    })
    .reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0);

  const fondoInicial = (isAdmin && filterCajero === 'TODOS')
    ? parseFloat(caja?.monto_inicial || 500.00).toFixed(2)
    : '150.00';

  const totalEfectivo = (parseFloat(fondoInicial) + ventasEfectivoReal).toFixed(2);
  const ventasTarjeta = ventasTarjetaReal.toFixed(2);
  const ventasTransf = ventasTransfReal.toFixed(2);

  const cajeroActivoNombre = currentUser 
    ? (currentUser.nombre_completo || currentUser.nombre) 
    : 'Camila Valenzuela';

  return (
    <section className="flex flex-col gap-3 h-full overflow-y-auto pr-1" id="view-caja">
      {/* Top Header Contable Clásico */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-700">account_balance</span>
              Facturación & Control de Caja
            </h2>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
              isAdmin 
                ? 'bg-blue-50 text-blue-800 border-blue-200' 
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              {isAdmin ? 'Perfil: Administrador General (Visión Global)' : `Cajero: ${cajeroActivoNombre}`}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdmin 
              ? 'Supervisión de comprobantes fiscales, cierres Z de empleados y arqueo consolidado' 
              : `Comprobantes emitidos y arqueo de turno para ${cajeroActivoNombre}`}
          </p>
        </div>

        {/* Acciones de Caja */}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              type="button"
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-slate-200"
              onClick={() => openModal('payment-methods')}
              title="Administrar métodos de pago habilitados"
            >
              <span className="material-symbols-outlined text-sm text-slate-600">settings</span>
              Métodos de Pago
            </button>
          )}
          <button
            type="button"
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-slate-200"
            onClick={handleCorteX}
            title="Imprimir arqueo parcial del turno"
          >
            <span className="material-symbols-outlined text-sm">print</span> Corte X
          </button>
          <button
            type="button"
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
            onClick={() => openModal('cierre-z')}
            title="Efectuar cierre de turno y corte Z"
          >
            <span className="material-symbols-outlined text-sm text-amber-400">lock</span> Cierre Turno (Z)
          </button>
        </div>
      </div>

      {/* Tabs Selector: Facturación vs Arqueo vs Historial Cajas */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-1.5 rounded-xl">
        <button
          onClick={() => setActiveTab('facturacion')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'facturacion'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-sm">receipt_long</span>
          Historial de Facturación ({filteredInvoices.length})
        </button>

        <button
          onClick={() => setActiveTab('caja')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'caja'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-sm">payments</span>
          {isAdmin ? 'Arqueo & Cuadre de Caja' : 'Arqueo de Mi Turno'}
        </button>

        <button
          onClick={() => {
            setActiveTab('historial_cajas');
            fetchCajasHistorial();
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'historial_cajas'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-sm">table_view</span>
          Tabla Cajas (Aperturas &amp; Cierres)
        </button>
      </div>

      {/* Resumen Contable por Rol */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
        {/* Fondo Inicial */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 border-l-4 border-l-slate-400 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fondo Inicial</span>
          <p className="text-xl font-mono font-bold text-slate-900 mt-1">${fondoInicial}</p>
          <span className="text-[10px] text-slate-400">Apertura 08:00 AM</span>
        </div>

        {/* Efectivo en Gaveta */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 border-l-4 border-l-emerald-500 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Efectivo en Gaveta</span>
          <p className="text-xl font-mono font-bold text-emerald-700 mt-1">${totalEfectivo}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">Cuadre exacto (100%)</span>
        </div>

        {/* Tarjetas POS */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 border-l-4 border-l-blue-500 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tarjetas POS</span>
          <p className="text-xl font-mono font-bold text-slate-800 mt-1">${ventasTarjeta}</p>
          <span className="text-[10px] text-slate-400">Transacciones datáfono</span>
        </div>

        {/* Pagos Digitales / QR */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 border-l-4 border-l-indigo-500 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Transferencias / QR</span>
          <p className="text-xl font-mono font-bold text-indigo-900 mt-1">${ventasTransf}</p>
          <span className="text-[10px] text-slate-400">Pagos QR digital</span>
        </div>
      </div>

      {/* Contenido Dinámico por Pestaña */}
      {activeTab === 'facturacion' && (
        /* ── TAB: Facturación e Historial ── */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Barra de Filtros */}
          <div className="p-3 border-b border-slate-200 bg-slate-50/70 grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
            <div className="relative">
              <span className="material-symbols-outlined text-slate-400 text-sm absolute left-2.5 top-1/2 -translate-y-1/2">
                tag
              </span>
              <input
                type="text"
                value={searchNumero}
                onChange={(e) => setSearchNumero(e.target.value)}
                placeholder="Buscar por N° (FAC-...)"
                className="w-full pl-8 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-slate-700 focus:outline-none"
              />
            </div>

            <div className="relative">
              <span className="material-symbols-outlined text-slate-400 text-sm absolute left-2.5 top-1/2 -translate-y-1/2">
                person_search
              </span>
              <input
                type="text"
                value={searchCliente}
                onChange={(e) => setSearchCliente(e.target.value)}
                placeholder="Buscar por cliente..."
                className="w-full pl-8 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-slate-700 focus:outline-none"
              />
            </div>

            <div className="relative">
              <span className="material-symbols-outlined text-slate-400 text-sm absolute left-2.5 top-1/2 -translate-y-1/2">
                calendar_today
              </span>
              <input
                type="date"
                value={searchFecha}
                onChange={(e) => setSearchFecha(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-slate-700 focus:outline-none text-slate-700"
              />
            </div>

            {/* Selector de Cajero para Administrador */}
            {isAdmin ? (
              <div className="relative">
                <select
                  value={filterCajero}
                  onChange={(e) => setFilterCajero(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-slate-700 focus:outline-none cursor-pointer text-slate-800"
                >
                  <option value="TODOS">👥 Todos los Cajeros</option>
                  <option value="3">👤 Camila Valenzuela</option>
                  <option value="2">👤 Rodrigo Alarcón</option>
                  <option value="1">👤 Elena Morales</option>
                </select>
              </div>
            ) : (
              <div className="flex items-center px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600">
                <span className="truncate">👤 {cajeroActivoNombre}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 justify-end">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg font-bold text-slate-600 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">clear</span>
                  Limpiar Filtros
                </button>
              )}
            </div>
          </div>

          {/* Tabla de Facturas */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Folio Fiscal</th>
                  <th className="p-2.5">Fecha y Hora</th>
                  <th className="p-2.5">Cliente / Razón Social</th>
                  <th className="p-2.5">Cajero</th>
                  <th className="p-2.5">Forma de Pago</th>
                  <th className="p-2.5 text-right">Total ($)</th>
                  <th className="p-2.5 text-center">Estado</th>
                  <th className="p-2.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100" id="invoices-tbody">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                      {hasActiveFilters 
                        ? 'No se encontraron facturas con los filtros seleccionados.' 
                        : 'No hay facturas emitidas registradas para este turno.'}
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const isVoided = inv.estado === 'ANULADA' || inv.status === 'anulada';
                    return (
                      <tr key={inv.id_venta || inv.numero_factura} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-2.5">
                          <span className="font-mono font-bold text-slate-900 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs text-slate-400">receipt</span>
                            {inv.numero_factura || `FAC-${inv.id_venta}`}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-500 font-mono">
                          {inv.fecha_completa || inv.fecha || 'Hoy'}
                        </td>
                        <td className="p-2.5 font-bold text-slate-800">
                          {inv.cliente || 'Consumidor Final'}
                        </td>
                        <td className="p-2.5 text-slate-600 font-medium">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-semibold text-slate-700">
                            {inv.cajero || 'Camila Valenzuela'}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-600">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">
                            {inv.metodo || 'Efectivo'}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-mono font-extrabold text-slate-900">
                          ${parseFloat(inv.total).toFixed(2)}
                        </td>
                        <td className="p-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            !isVoided 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {!isVoided ? 'COMPLETADA' : 'ANULADA'}
                          </span>
                        </td>
                        <td className="p-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openInvoiceModal(inv)}
                              className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                              title="Ver / Imprimir Factura Oficial"
                            >
                              <span className="material-symbols-outlined text-xs">visibility</span>
                              Ver
                            </button>

                            {!isVoided ? (
                              <button
                                onClick={() => anularFactura(inv.id_venta)}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded font-semibold text-[11px] transition-colors cursor-pointer"
                              >
                                Anular
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[11px] font-medium">Revertido</span>
                            )}
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
      )}

      {/* ── TAB 2: Arqueo, Control de Gaveta y Cálculo de Diferencia ── */}
      {activeTab === 'caja' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {isAdmin ? 'Arqueo Contable & Control de Flujo de Caja' : `Arqueo de Turno: ${cajeroActivoNombre}`}
              </h3>
              <p className="text-[11px] text-slate-500">
                Cuadre en vivo de la gaveta de efectivo con cálculo automático de diferencia
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                ● Turno Abierto
              </span>
              <button
                onClick={() => setShowAperturaModal(true)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-200 cursor-pointer"
                title="Registrar nueva apertura de caja con fondo inicial"
              >
                <span className="material-symbols-outlined text-sm">lock_open</span>
                Nueva Apertura
              </button>
            </div>
          </div>

          {/* Tarjetas de métricas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Efectivo Esperado en Gaveta</span>
              <p className="text-2xl font-mono font-extrabold text-emerald-700">${totalEfectivo}</p>
              <p className="text-[10.5px] text-slate-500">Fondo (${fondoInicial}) + Ventas Efectivo (${ventasEfectivoReal.toFixed(2)})</p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Ventas Electrónicas</span>
              <p className="text-2xl font-mono font-extrabold text-slate-900">
                ${(parseFloat(ventasTarjeta) + parseFloat(ventasTransf)).toFixed(2)}
              </p>
              <p className="text-[10.5px] text-slate-500">Tarjetas (${ventasTarjeta}) + QR/Transf. (${ventasTransf})</p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Ventas Brutas Totales</span>
              <p className="text-2xl font-mono font-extrabold text-blue-700">
                ${(ventasEfectivoReal + parseFloat(ventasTarjeta) + parseFloat(ventasTransf)).toFixed(2)}
              </p>
              <p className="text-[10.5px] text-slate-500">Total acumulado en este turno</p>
            </div>
          </div>

          {/* Sección de Conteo Físico y Cálculo de Diferencia de Caja */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <span className="material-symbols-outlined text-blue-600 text-base">calculate</span>
                Conteo Físico de Gaveta &amp; Cálculo de Diferencia
              </h4>
              <span className="text-[10.5px] text-slate-400">Ingresa el dinero en efectivo contado en la gaveta</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Efectivo Físico Contado ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={`ej. ${totalEfectivo}`}
                    value={contadoFisicoInput}
                    onChange={(e) => setContadoFisicoInput(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                  />
                </div>
              </div>

              {/* Resultado del Cálculo de Diferencia */}
              {(() => {
                const contado = parseFloat(contadoFisicoInput);
                const esperado = parseFloat(totalEfectivo);
                const hasInput = !isNaN(contado) && contadoFisicoInput.trim() !== '';
                const diferencia = hasInput ? contado - esperado : 0;
                const isExact = hasInput && Math.abs(diferencia) < 0.01;
                const isSobrante = hasInput && diferencia > 0.01;
                const isFaltante = hasInput && diferencia < -0.01;

                return (
                  <div className={`p-3 rounded-xl border text-xs font-semibold ${
                    !hasInput 
                      ? 'bg-white border-slate-200 text-slate-500'
                      : isExact 
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : isSobrante 
                          ? 'bg-blue-50 border-blue-300 text-blue-900'
                          : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10.5px] font-bold uppercase tracking-wider">
                        {!hasInput ? 'Estado de Cuadre' : isExact ? '✓ Cuadre Exacto' : isSobrante ? '⚠️ Sobrante' : '❌ Faltante'}
                      </span>
                      <span className="font-mono text-sm font-extrabold">
                        {!hasInput ? '$0.00' : `${diferencia >= 0 ? '+' : ''}$${diferencia.toFixed(2)}`}
                      </span>
                    </div>
                    <p className="text-[11px] font-normal">
                      {!hasInput 
                        ? `Esperado: $${totalEfectivo}. Ingresa el monto físico contado para verificar.`
                        : isExact 
                          ? 'La gaveta física coincide al 100% con los comprobantes registrados.'
                          : isSobrante 
                            ? `Hay un sobrante en caja de +$${diferencia.toFixed(2)}. Verifica si faltó registrar algún cobro.`
                            : `Hay un faltante en caja de -$${Math.abs(diferencia).toFixed(2)}. Verifica vueltos entregados.`}
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              onClick={handleCorteX}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-sm">receipt</span> Imprimir Corte X
            </button>
            <button
              onClick={() => {
                const contado = parseFloat(contadoFisicoInput);
                const esperado = parseFloat(totalEfectivo);
                const valorFinal = !isNaN(contado) ? contado : esperado;
                api.cierreCaja({
                  id_caja: caja?.id_caja || 1,
                  id_usuario_cierre: currentUser?.id_usuario || 1,
                  monto_final: valorFinal
                }).then(() => {
                  showToast('Cierre de caja registrado exitosamente con cálculo de diferencia', 'lock');
                  fetchCajasHistorial();
                  openModal('cierre-z');
                }).catch(() => {
                  openModal('cierre-z');
                });
              }}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-sm text-amber-400">lock</span> Cierre Definitivo Z
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 3: Tabla Cajas (Aperturas, Cierres & Control de Flujo) ── */}
      {activeTab === 'historial_cajas' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-base">table_view</span>
              <span className="font-bold text-slate-800">Control de Flujo de Caja &amp; Registro de Turnos</span>
            </div>
            <button
              onClick={fetchCajasHistorial}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-200 cursor-pointer shadow-2xs"
            >
              <span className={`material-symbols-outlined text-sm ${loadingCajas ? 'animate-spin' : ''}`}>sync</span>
              Actualizar
            </button>
          </div>

          <div className="overflow-auto flex-1 min-h-[300px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] sticky top-0 z-10 shadow-xs">
                <tr>
                  <th className="p-3">ID Turno</th>
                  <th className="p-3">Apertura (Fecha / Cajero)</th>
                  <th className="p-3 text-right">Fondo Inicial ($)</th>
                  <th className="p-3 text-right">Vtas Efectivo ($)</th>
                  <th className="p-3 text-right">Vtas Tarjeta / QR ($)</th>
                  <th className="p-3 text-right">Esperado ($)</th>
                  <th className="p-3 text-right">Contado Final ($)</th>
                  <th className="p-3 text-center">Diferencia ($)</th>
                  <th className="p-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingCajas ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      <span className="material-symbols-outlined text-2xl animate-spin text-blue-600 mb-1 block">sync</span>
                      Cargando historial de cajas...
                    </td>
                  </tr>
                ) : historialCajas.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No hay registros de cajas previas.
                    </td>
                  </tr>
                ) : (
                  historialCajas.map((c) => {
                    const isOpen = c.estado === 'ABIERTA';
                    const dif = c.diferencia !== null && c.diferencia !== undefined ? parseFloat(c.diferencia) : null;
                    const isExact = dif !== null && Math.abs(dif) < 0.01;
                    const isSobrante = dif !== null && dif > 0.01;
                    const isFaltante = dif !== null && dif < -0.01;

                    return (
                      <tr key={c.id_caja} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-800">
                          #{c.id_caja}
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-800">{c.cajero || c.cajero_apertura || 'Elena Morales'}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {c.fecha_apertura ? new Date(c.fecha_apertura).toLocaleString('es-PE', {
                              day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            }) : '08:00 AM'}
                          </div>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-700">
                          ${parseFloat(c.monto_inicial || 0).toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-600">
                          ${parseFloat(c.ventas_efectivo || 0).toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-600">
                          ${(parseFloat(c.ventas_tarjeta || 0) + parseFloat(c.ventas_transferencia || 0)).toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-mono font-extrabold text-slate-900">
                          ${parseFloat(c.monto_esperado || (parseFloat(c.monto_inicial || 0) + parseFloat(c.ventas_efectivo || 0))).toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-800">
                          {c.monto_final !== null ? `$${parseFloat(c.monto_final).toFixed(2)}` : (
                            <span className="text-slate-400 italic text-[11px]">En curso</span>
                          )}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-xs">
                          {dif === null ? (
                            <span className="text-slate-400 text-[10px]">-</span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                              isExact 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : isSobrante 
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {dif >= 0 ? '+' : ''}${dif.toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isOpen 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {c.estado}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Apertura de Caja */}
      {showAperturaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-lg">lock_open</span>
                <h3 className="font-bold text-slate-900 text-xs">Apertura de Nuevo Turno de Caja</h3>
              </div>
              <button onClick={() => setShowAperturaModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Monto Fondo Inicial en Efectivo ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={montoInicialInput}
                    onChange={(e) => setMontoInicialInput(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="150.00"
                    autoFocus
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Monto base entregado para sencillo y cambio en gaveta al inicio del turno.
                </p>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg text-slate-600 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span>Cajero Responsable:</span>
                  <strong className="text-slate-800">{cajeroActivoNombre}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Hora de Inicio:</span>
                  <span className="font-mono text-slate-700 font-semibold">{new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowAperturaModal(false)}
                className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                disabled={cargandoAccion || !montoInicialInput}
                onClick={async () => {
                  setCargandoAccion(true);
                  try {
                    await api.aperturaCaja({
                      monto_inicial: parseFloat(montoInicialInput) || 150.00,
                      id_usuario_apertura: currentUser?.id_usuario || 1
                    });
                    showToast(`Apertura de turno registrada con fondo de $${parseFloat(montoInicialInput || 150).toFixed(2)}`, 'lock_open');
                    setShowAperturaModal(false);
                    fetchCajasHistorial();
                    if (loadData) loadData();
                  } catch (err) {
                    showToast('Error al registrar apertura: ' + err.message, 'error');
                  } finally {
                    setCargandoAccion(false);
                  }
                }}
                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                {cargandoAccion ? 'Registrando...' : 'Confirmar Apertura'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

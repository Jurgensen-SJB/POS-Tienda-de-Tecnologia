import React, { useEffect, useState, useRef, useCallback } from "react";
import QRCode from "qrcode";
import { useApp } from "../../context/AppContext";
import { formatCOP } from "../../utils/format";

const SERVER = "http://localhost:5000";

// Map icon by method name keywords
const getMethodIcon = (nombre = "") => {
  const n = nombre.toLowerCase();
  if (n.includes("efectivo") || n.includes("cash")) return "payments";
  if (n.includes("tarjeta") || n.includes("card") || n.includes("pos")) return "credit_card";
  if (n.includes("qr") || n.includes("transfer") || n.includes("billetera") || n.includes("digital")) return "qr_code_2";
  if (n.includes("cheque")) return "edit_note";
  if (n.includes("vale") || n.includes("cupon")) return "confirmation_number";
  return "payments";
};

export const PaymentPanel = () => {
  const {
    subtotal,
    discountAmount,
    discountLabel,
    activeDiscountLabel,
    tax,
    grandTotal,
    cart,
    currentClient,
    payMethod,
    setPayMethod,
    cashReceived,
    setCashReceived,
    vuelto,
    resolvedPay,
    executeCheckout,
    showToast,
    paymentMethods,
    ticketCounter,
  } = useApp();

  const [cardRef, setCardRef] = useState("");
  const [cardType, setCardType] = useState("debito");
  const [posStatus, setPosStatus] = useState("idle"); // idle | waiting | approved

  // QR payment session state
  const [qrRef, setQrRef] = useState("");
  const [qrStatus, setQrStatus] = useState("idle"); // idle | waiting | paid
  const [serverLanUrl, setServerLanUrl] = useState(() => {
    if (typeof window !== "undefined" && window.location.hostname && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      return `http://${window.location.hostname}:5000`;
    }
    return "http://localhost:5000";
  });
  const [detectedIps, setDetectedIps] = useState([]);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [isEditingIp, setIsEditingIp] = useState(false);
  const [customIpInput, setCustomIpInput] = useState("");

  const pollRef = useRef(null);
  const isCheckingOutRef = useRef(false);

  // Keep executeCheckout ref fresh
  const executeCheckoutRef = useRef(executeCheckout);
  useEffect(() => {
    executeCheckoutRef.current = executeCheckout;
  }, [executeCheckout]);

  // Fetch server LAN IP so QR can be scanned by real phones on WiFi
  const refreshNetworkInfo = useCallback(() => {
    const apiHost = typeof window !== "undefined" && window.location.hostname && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
      ? `http://${window.location.hostname}:5000`
      : SERVER;

    fetch(`${apiHost}/api/qr-pay/info`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.baseUrl) {
          setServerLanUrl(d.baseUrl);
          setCustomIpInput(d.baseUrl.replace(/^http:\/\//, ""));
        }
        if (d?.allIps) setDetectedIps(d.allIps);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshNetworkInfo();
  }, [refreshNetworkInfo]);

  // Active payment methods from DB, fallback to 3 defaults
  const activeMethods = (paymentMethods || []).filter((pm) => pm.estado === "ACTIVO");
  const methodsToShow =
    activeMethods.length > 0
      ? activeMethods
      : [
          { id_forma_pago: 1, nombre: "Efectivo", descripcion: "Pago en efectivo" },
          { id_forma_pago: 2, nombre: "Tarjeta POS", descripcion: "Debito / Credito" },
          { id_forma_pago: 3, nombre: "QR / Transferencia", descripcion: "Pago digital" },
        ];

  // Determine selected method ID from resolved pay
  const selectedId = resolvedPay?.id;

  // Create QR session + start polling
  const startQrSession = useCallback(async (ref, amount, items) => {
    setQrRef(ref);
    setQrStatus("waiting");
    isCheckingOutRef.current = false;

    try {
      await fetch(`${SERVER}/api/qr-pay/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ref, 
          amount, 
          merchant: "NexPOS Tecnología S.A.C.", 
          items, 
          currency: "USD" 
        })
      });
    } catch { /* ignorar si el servidor no responde */ }

    // Iniciar polling inmediato cada 1.5s
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${SERVER}/api/qr-pay/status/${encodeURIComponent(ref)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "paid" && !isCheckingOutRef.current) {
          isCheckingOutRef.current = true;
          clearInterval(pollRef.current);
          pollRef.current = null;
          setQrStatus("paid");
          showToast("✓ ¡Pago recibido desde el celular! Generando factura...", "check_circle");

          // Ejecutar automáticamente el cobro y registro fiscal en el POS
          setTimeout(() => {
            if (executeCheckoutRef.current) {
              executeCheckoutRef.current();
            }
            setTimeout(() => {
              isCheckingOutRef.current = false;
            }, 1500);
          }, 400);
        }
      } catch { /* ignore network errors */ }
    }, 1500);
  }, [showToast]);

  // Reset POS state and auto-start QR polling when switching methods
  useEffect(() => {
    setPosStatus("idle");
    setCardRef("");

    const isQr = resolvedPay?.type === "qr" || 
      (resolvedPay?.nombre || "").toLowerCase().includes("qr") || 
      (resolvedPay?.nombre || "").toLowerCase().includes("transfer") || 
      (resolvedPay?.nombre || "").toLowerCase().includes("digital");

    if (isQr && grandTotal > 0) {
      const refNum = `NX-${String(Math.abs(Math.floor(grandTotal * 100) + 2342)).padStart(6, "0")}`;
      startQrSession(
        refNum, 
        grandTotal, 
        cart.map((i) => ({ name: i.name, qty: i.qty, price: i.price }))
      );
    } else {
      if (pollRef.current) { 
        clearInterval(pollRef.current); 
        pollRef.current = null; 
      }
      setQrStatus("idle");
      setQrRef("");
    }
  }, [resolvedPay?.type, resolvedPay?.nombre, grandTotal, startQrSession]);

  // Cleanup poll on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  // Auto-fill cash received when switching to cash method
  useEffect(() => {
    if (resolvedPay?.type === "cash" && (!cashReceived || parseFloat(cashReceived) < grandTotal)) {
      if (grandTotal > 0) {
        setCashReceived(String(Math.round(grandTotal)));
      }
    }
  }, [grandTotal, resolvedPay?.type]);

  const setMontoPreset = (val) => {
    const num = Math.round(val);
    setCashReceived(String(num));
    showToast(`Monto recibido: ${formatCOP(num)}`);
  };

  const setMontoExacto = () => {
    const exact = Math.round(grandTotal);
    setCashReceived(String(exact));
    showToast("Cobro de monto exacto");
  };

  const currentRefNum = qrRef || `NX-${String(Math.abs(Math.floor(grandTotal) + 2342)).padStart(6, "0")}`;
  const currentPayUrl = `${serverLanUrl}/pay?ref=${encodeURIComponent(currentRefNum)}&amount=${Math.round(grandTotal)}`;

  useEffect(() => {
    if (!currentPayUrl) return;
    QRCode.toDataURL(currentPayUrl, {
      width: 150,
      margin: 1,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("Error generating QR:", err));
  }, [currentPayUrl]);

  // Handle custom IP change
  const handleSaveCustomIp = (e) => {
    e?.preventDefault();
    let cleaned = customIpInput.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!cleaned) return;
    if (!cleaned.includes(":")) cleaned = `${cleaned}:5000`;
    setServerLanUrl(`http://${cleaned}`);
    setIsEditingIp(false);
    showToast(`IP actualizada a ${cleaned}`, "wifi");
  };

  const currentIsCash = resolvedPay?.type === "cash";
  const colClass = methodsToShow.length <= 2 ? "grid-cols-2" : "grid-cols-3";

  return (
    <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-1.5 shrink-0">
      {/* Financial breakdown + Total unificado compacto */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 space-y-1">
        <div className="flex justify-between items-center text-[10.5px] text-slate-500 font-medium">
          <span>Subtotal: <strong className="font-mono text-slate-700">{formatCOP(subtotal)}</strong></span>
          {discountAmount > 0 && (
            <span className="text-emerald-600 font-semibold">Desc: <strong className="font-mono">-{formatCOP(discountAmount)}</strong></span>
          )}
          <span>IVA 19%: <strong className="font-mono text-slate-700">{formatCOP(tax)}</strong></span>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-slate-200">
          <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">TOTAL A COBRAR:</span>
          <span className="text-lg font-extrabold text-blue-700 font-mono" id="total-val">
            {formatCOP(grandTotal)} <span className="text-[10px] font-bold text-blue-500">COP</span>
          </span>
        </div>
      </div>

      {/* Selector de métodos de pago - Tabs horizontales compactas */}
      <div className={`grid ${colClass} gap-1`}>
        {methodsToShow.map((pm) => {
          const isSelected = pm.id_forma_pago === selectedId;
          return (
            <button
              key={pm.id_forma_pago}
              id={`btn-pay-${pm.id_forma_pago}`}
              className={`tender-tab py-1 px-1.5 rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 transition-all ${
                isSelected
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60"
              }`}
              onClick={() => setPayMethod(pm)}
              title={pm.descripcion || pm.nombre}
            >
              <span className="material-symbols-outlined text-sm">{getMethodIcon(pm.nombre)}</span>
              <span className="truncate">{pm.nombre}</span>
            </button>
          );
        })}
      </div>

      {/* Detalle interactivo según método seleccionado */}
      {currentIsCash ? (
        /* ── EFECTIVO: Calculadora de cambio compacta ── */
        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 space-y-1.5 text-xs" id="box-cash-calc">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-700">Monto Recibido:</span>
            <div className="relative w-32">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
              <input
                className="w-full pl-5 pr-1.5 py-0.5 text-right font-mono font-bold text-xs bg-white rounded border border-slate-300 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                id="input-monto-recibido"
                step="any"
                min="0"
                type="number"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-1 text-[10px] flex-wrap">
            {(() => {
              const tot = Math.round(grandTotal || 0);
              const b50 = Math.ceil(tot / 50000) * 50000;
              const b100 = Math.ceil(tot / 100000) * 100000;
              const extra = (b100 > tot ? b100 : b50) + 50000;
              const list = Array.from(new Set([b50, b100, extra])).filter(x => x >= tot);
              if (list.length === 0) list.push(tot > 0 ? tot : 50000);
              return list.slice(0, 3).map(p => (
                <button
                  key={p}
                  className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={() => setMontoPreset(p)}
                >
                  ${(p >= 1000000 ? (p / 1000000).toFixed(1) + 'M' : Math.round(p / 1000) + 'k')}
                </button>
              ));
            })()}
            <button className="px-2 py-0.5 bg-blue-100 text-blue-700 font-bold rounded hover:bg-blue-200 transition-colors cursor-pointer" onClick={setMontoExacto}>Exacto</button>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-200">
            <span className="font-bold text-slate-700 text-[11px]">Cambio / Vuelto:</span>
            <span className="text-sm font-bold text-emerald-600 font-mono" id="vuelto-val">{formatCOP(vuelto)}</span>
          </div>
        </div>

      ) : resolvedPay?.type === "card" ? (
        /* ── TARJETA: Datáfono POS compacto (sin monto duplicado) ── */
        <div className="border border-slate-200 rounded-lg overflow-hidden text-xs bg-slate-50" id="box-card-pos">
          <div className="bg-slate-800 px-2.5 py-1.5 flex items-center justify-between text-white">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-blue-400 text-sm">credit_card</span>
              <span className="font-bold text-[11px]">Datáfono POS</span>
            </div>
            <div className={`flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.2 rounded-full ${
              posStatus === "approved" ? "bg-emerald-500 text-white" :
              posStatus === "waiting"  ? "bg-amber-400 text-slate-900 animate-pulse" :
              "bg-slate-700 text-slate-200"
            }`}>
              <span className="material-symbols-outlined text-[10px]">
                {posStatus === "approved" ? "check_circle" : posStatus === "waiting" ? "hourglass_top" : "radio_button_checked"}
              </span>
              {posStatus === "approved" ? "Aprobado" : posStatus === "waiting" ? "Procesando..." : "Listo"}
            </div>
          </div>

          <div className="p-2 space-y-1.5 bg-white">
            <div className="flex items-center gap-2">
              <div className="flex gap-1 shrink-0">
                {["debito", "credito"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setCardType(t)}
                    className={`py-0.5 px-2 rounded text-[10px] font-bold border transition-colors capitalize ${
                      cardType === t
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                    }`}
                  >
                    {t === "debito" ? "Débito" : "Crédito"}
                  </button>
                ))}
              </div>
              <input
                type="text"
                id="input-card-ref"
                maxLength={8}
                placeholder="Ref: 48291073"
                value={cardRef}
                onChange={(e) => setCardRef(e.target.value.replace(/\D/g, "").slice(0, 8))}
                className="flex-1 px-2 py-0.5 border border-slate-200 rounded font-mono text-[11px] focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <button
              id="btn-pos-terminal"
              onClick={() => {
                if (posStatus === "idle" || posStatus === "approved") {
                  setPosStatus("waiting");
                  const autoRef = Math.floor(10000000 + Math.random() * 89999999).toString();
                  setTimeout(() => {
                    setCardRef(autoRef);
                    setPosStatus("approved");
                    showToast(`Tarjeta ${cardType} aprobada ✓ Ref: ${autoRef}`, "check_circle");
                  }, 1800);
                }
              }}
              disabled={posStatus === "waiting"}
              className={`w-full py-1 rounded-md font-bold text-[10.5px] flex items-center justify-center gap-1 transition-all ${
                posStatus === "approved"
                  ? "bg-emerald-500 text-white cursor-default"
                  : posStatus === "waiting"
                  ? "bg-amber-100 text-amber-800 cursor-not-allowed"
                  : "bg-slate-800 hover:bg-slate-900 text-white cursor-pointer"
              }`}
            >
              <span className="material-symbols-outlined text-xs">
                {posStatus === "approved" ? "check_circle" : posStatus === "waiting" ? "hourglass_top" : "contactless"}
              </span>
              {posStatus === "approved" ? `Aprobado · Ref ${cardRef}` : posStatus === "waiting" ? "Procesando pago..." : "Simular Terminal POS"}
            </button>
          </div>
        </div>
      ) : (
        /* ── QR / TRANSFERENCIA: Layout horizontal hiper-compacto ── */
        <div className="border border-slate-200 rounded-lg overflow-hidden text-xs bg-white shadow-xs" id="box-qr-pay">
          {/* Header compacto */}
          <div className="bg-slate-800 px-2.5 py-1 flex items-center justify-between text-white">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-blue-400 text-xs">qr_code_2</span>
              <span className="font-bold text-[10px] tracking-wide">PAGO MÓVIL / QR</span>
            </div>
            <div className={`flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.2 rounded-full ${
              qrStatus === "paid"    ? "bg-emerald-500 text-white" :
              qrStatus === "waiting" ? "bg-amber-400 text-slate-900 animate-pulse" :
              "bg-slate-700 text-slate-300"
            }`}>
              <span className="material-symbols-outlined text-[10px]">
                {qrStatus === "paid" ? "check_circle" : qrStatus === "waiting" ? "hourglass_top" : "qr_code_scanner"}
              </span>
              {qrStatus === "paid" ? "Confirmado ✓" : qrStatus === "waiting" ? "Esperando Pago..." : "Listo"}
            </div>
          </div>

          {/* Selector / Edición rápida de IP */}
          {isEditingIp ? (
            <form onSubmit={handleSaveCustomIp} className="p-2 bg-blue-50/70 border-b border-blue-200 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-blue-900">
                <span>Configurar IP de Red para el Celular:</span>
                <button type="button" onClick={() => setIsEditingIp(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={customIpInput}
                  onChange={(e) => setCustomIpInput(e.target.value)}
                  placeholder="ej. 192.168.1.5:5000"
                  className="flex-1 px-1.5 py-0.5 bg-white border border-blue-300 rounded text-[10.5px] font-mono focus:outline-none"
                  autoFocus
                />
                <button type="submit" className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-[10px]">
                  Guardar
                </button>
              </div>
              {detectedIps.length > 0 && (
                <div className="flex flex-wrap gap-1 items-center">
                  <span className="text-[9.5px] text-slate-500 font-semibold">Detectadas:</span>
                  {detectedIps.map((iface) => (
                    <button
                      key={iface.address}
                      type="button"
                      onClick={() => {
                        setServerLanUrl(`http://${iface.address}:5000`);
                        setCustomIpInput(`${iface.address}:5000`);
                        setIsEditingIp(false);
                        showToast(`Cambiado a ${iface.name}: ${iface.address}`, "wifi");
                      }}
                      className="px-1.5 py-0.2 bg-white hover:bg-blue-100 border border-slate-200 text-slate-700 rounded text-[9px] font-mono"
                    >
                      {iface.name}: {iface.address}
                    </button>
                  ))}
                </div>
              )}
            </form>
          ) : null}

          {/* Contenido horizontal: QR a la izquierda, acciones a la derecha */}
          {qrStatus === "paid" ? (
            <div className="bg-emerald-50 p-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-lg">verified</span>
              </div>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="font-bold text-emerald-900 text-xs">¡Factura Cancelada por el Cliente!</p>
                <p className="font-mono text-emerald-700 text-[10px]">{currentRefNum} • Listo para Cobrar</p>
              </div>
            </div>
          ) : (
            <div className="p-1.5 flex items-center gap-2.5">
              {/* QR Image nítido generado localmente con Canvas */}
              <div className="border border-slate-200 rounded-md p-1 bg-white shrink-0 shadow-xs flex items-center justify-center min-w-[100px] min-h-[100px]">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Código QR Factura"
                    width={98}
                    height={98}
                    className="block"
                  />
                ) : (
                  <div className="w-[98px] h-[98px] flex items-center justify-center text-slate-400">
                    <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                  </div>
                )}
              </div>

              {/* Info y botones */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 gap-1.5">
                <div>
                  <p className="font-extrabold text-slate-900 font-mono text-sm leading-none">
                    {formatCOP(grandTotal)} COP
                  </p>
                  <p className="text-[9.5px] text-slate-500 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    {qrStatus === "waiting" ? "Escuchando pago..." : "Escanea con la cámara"}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <p className="text-[8.5px] text-slate-500 font-mono truncate max-w-[125px]" title={currentPayUrl}>
                      {serverLanUrl.replace(/^http:\/\//, "")}/pay
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsEditingIp(true)}
                      className="text-slate-400 hover:text-blue-600 p-0.5 rounded cursor-pointer"
                      title="Cambiar IP de red local"
                    >
                      <span className="material-symbols-outlined text-[11px]">settings</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        refreshNetworkInfo();
                        showToast("IP de red sincronizada", "sync");
                      }}
                      className="text-slate-400 hover:text-blue-600 p-0.5 rounded cursor-pointer"
                      title="Sincronizar IP de red"
                    >
                      <span className="material-symbols-outlined text-[11px]">sync</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    id="btn-open-pay-page"
                    onClick={() => {
                      window.open(currentPayUrl, "_blank", "width=430,height=820,left=850,top=40");
                    }}
                    className="px-2 py-0.8 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Abrir factura en formato móvil en el navegador"
                  >
                    <span className="material-symbols-outlined text-xs">smartphone</span> Probar
                  </button>

                  <button
                    id="btn-copy-qr-ref"
                    onClick={() => {
                      navigator.clipboard?.writeText(currentPayUrl);
                      showToast(`Enlace copiado: ${currentPayUrl}`, "link");
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 cursor-pointer"
                    title="Copiar enlace"
                  >
                    <span className="material-symbols-outlined text-xs">content_copy</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Botón principal de cobro */}
      <button
        className="w-full py-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-lg font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        id="btn-cobrar"
        onClick={executeCheckout}
      >
        <span className="material-symbols-outlined text-base">receipt_long</span>
        <span>Cobrar e Imprimir (F12)</span>
      </button>
    </div>
  );
};

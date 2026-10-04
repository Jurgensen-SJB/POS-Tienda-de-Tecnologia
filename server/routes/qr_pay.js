const express = require('express');
const router = express.Router();
const os = require('os');

// Detect local machine LAN IPv4 address (e.g., 192.168.1.4)
function getLocalNetworkIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('169.254')) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// In-memory store for QR payment sessions { ref -> { status, amount, merchant, items, createdAt } }
const qrSessions = new Map();

// ── API: Network info for QR generation (gives LAN IP so mobile phones can connect) ──
router.get('/info', (req, res) => {
  const ip = getLocalNetworkIp();
  const port = process.env.PORT || 5000;
  res.json({
    ip,
    port,
    baseUrl: `http://${ip}:${port}`
  });
});

// ── API: Create or update a QR session ──────────────────────────────────────
router.post('/session', (req, res) => {
  const { ref, amount, merchant, items = [], currency = 'USD' } = req.body;
  if (!ref || !amount) return res.status(400).json({ error: 'ref y amount son requeridos' });

  const ip = getLocalNetworkIp();
  const port = process.env.PORT || 5000;

  qrSessions.set(ref, {
    ref,
    amount: parseFloat(amount),
    merchant: merchant || 'NexPOS Tecnología S.A.C.',
    items,
    currency,
    status: 'pending',   // pending | paid
    createdAt: new Date().toISOString(),
    paidAt: null
  });

  const payUrl = `http://${ip}:${port}/pay?ref=${encodeURIComponent(ref)}&amount=${parseFloat(amount).toFixed(2)}`;

  res.status(201).json({ 
    ok: true, 
    ref, 
    status: 'pending',
    payUrl,
    lanIp: ip
  });
});

// ── API: Get status of a QR session ─────────────────────────────────────────
router.get('/status/:ref', (req, res) => {
  let session = qrSessions.get(req.params.ref);
  if (!session) {
    session = { 
      ref: req.params.ref, 
      status: 'pending', 
      createdAt: new Date().toISOString() 
    };
    qrSessions.set(req.params.ref, session);
  }
  res.json(session);
});

// ── API: Confirm payment (called from payment page) ──────────────────────────
router.post('/confirm/:ref', (req, res) => {
  let session = qrSessions.get(req.params.ref);
  if (!session) {
    session = { 
      ref: req.params.ref, 
      status: 'pending', 
      createdAt: new Date().toISOString() 
    };
  }

  session.status = 'paid';
  session.paidAt = new Date().toISOString();
  qrSessions.set(req.params.ref, session);

  console.log(`[QR-PAY] Pago confirmado exitosamente para ref: ${req.params.ref}`);
  res.json({ ok: true, status: 'paid', paidAt: session.paidAt });
});

// ── PAYMENT PAGE: Served at GET /pay?ref=...&amount=...&merchant=...&items=.. ──
router.get('/', (req, res) => {
  const { 
    ref = 'NX-000000', 
    amount = '0.00', 
    merchant = 'NexPOS Tecnología S.A.C.', 
    items = '',
    client = 'Consumidor Final',
    doc = '00000000'
  } = req.query;

  // Auto-registrar en memoria al abrir la página desde el celular
  if (!qrSessions.has(ref)) {
    qrSessions.set(ref, {
      ref,
      amount: parseFloat(amount) || 0,
      merchant,
      status: 'pending',
      createdAt: new Date().toISOString(),
      paidAt: null
    });
  }

  const totalNum = parseFloat(amount) || 0;
  const subtotalNum = totalNum > 0 ? (totalNum / 1.18) : 0;
  const igvNum = totalNum - subtotalNum;

  const existingSession = qrSessions.get(ref);
  const sessionItems = existingSession?.items || [];

  let parsedItems = [];
  if (items) {
    parsedItems = items.split('|').map(i => {
      const parts = i.split(':');
      return { 
        name: parts[0] || 'Producto Tecnológico', 
        qty: parseInt(parts[1]) || 1, 
        price: parseFloat(parts[2]) || 0 
      };
    });
  } else if (sessionItems.length > 0) {
    parsedItems = sessionItems.map(i => ({
      name: i.name || i.nombre || 'Producto Tecnológico',
      qty: parseInt(i.qty || i.cantidad) || 1,
      price: parseFloat(i.price || i.precio) || 0
    }));
  } else {
    parsedItems = [
      { name: 'Venta de Productos y Accesorios de Tecnología', qty: 1, price: totalNum }
    ];
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  const statusApiUrl = `/api/qr-pay/confirm/${encodeURIComponent(ref)}`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <title>Factura Electrónica — ${ref}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      font-family: 'Public Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f1f5f9;
      color: #1e293b;
      padding: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      -webkit-font-smoothing: antialiased;
    }

    .container {
      width: 100%;
      max-width: 520px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    /* ── Factura Clásica en Papel Blanco ── */
    .invoice-sheet {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
      padding: 20px 18px;
      position: relative;
      overflow: hidden;
    }

    /* Sello clásico de CANCELADO / PAGADO */
    .stamp-seal {
      position: absolute;
      top: 40%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-15deg);
      border: 3.5px dashed #15803d;
      color: #15803d;
      padding: 10px 24px;
      border-radius: 8px;
      text-align: center;
      font-weight: 900;
      letter-spacing: 2px;
      text-transform: uppercase;
      font-size: 26px;
      line-height: 1.1;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      z-index: 20;
      background: rgba(255, 255, 255, 0.92);
      box-shadow: 0 4px 12px rgba(21, 128, 61, 0.15);
    }
    .stamp-seal.visible {
      opacity: 0.95;
      transform: translate(-50%, -50%) rotate(-12deg) scale(1);
    }
    .stamp-sub {
      font-size: 11px;
      letter-spacing: 1px;
      font-weight: 700;
      margin-top: 4px;
      color: #166534;
    }

    /* Header de la factura */
    .inv-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      padding-bottom: 14px;
      border-bottom: 2px solid #0f172a;
    }
    .brand-col {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .company-logo {
      width: 48px;
      height: 48px;
      object-fit: contain;
      border-radius: 6px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 2px;
    }
    .company-name {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
      text-transform: uppercase;
    }
    .company-info {
      font-size: 10.5px;
      color: #64748b;
      line-height: 1.35;
      margin-top: 2px;
    }

    /* Recuadro fiscal oficial clásico */
    .fiscal-box {
      border: 2px solid #0f172a;
      border-radius: 6px;
      padding: 8px 12px;
      text-align: center;
      min-width: 140px;
      background: #f8fafc;
      flex-shrink: 0;
    }
    .fiscal-ruc {
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: 0.5px;
    }
    .fiscal-type {
      font-size: 11px;
      font-weight: 800;
      color: #1e3a8a;
      background: #e0e7ff;
      padding: 3px 6px;
      border-radius: 4px;
      margin: 4px 0;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .fiscal-num {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
    }

    /* Datos del cliente y emisión */
    .client-section {
      padding: 12px 0;
      border-bottom: 1px dashed #cbd5e1;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 14px;
      font-size: 11px;
    }
    .client-field {
      display: flex;
      flex-direction: column;
    }
    .field-lbl {
      color: #64748b;
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .field-val {
      font-weight: 600;
      color: #1e293b;
      margin-top: 1px;
    }

    /* Tabla de productos clásica */
    .table-container {
      margin-top: 12px;
      overflow-x: auto;
    }
    .invoice-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      text-align: left;
    }
    .invoice-table th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      padding: 7px 8px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
    }
    .invoice-table td {
      padding: 8px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
      vertical-align: middle;
    }
    .invoice-table tr:last-child td {
      border-bottom: 1px solid #cbd5e1;
    }
    .col-qty { text-align: center; width: 40px; font-weight: 600; }
    .col-price { text-align: right; width: 75px; font-family: 'JetBrains Mono', monospace; }
    .col-total { text-align: right; width: 85px; font-weight: 700; font-family: 'JetBrains Mono', monospace; }

    /* Totales de Factura */
    .totals-wrap {
      display: flex;
      justify-content: flex-end;
      margin-top: 12px;
      padding-top: 6px;
    }
    .totals-box {
      width: 220px;
      font-size: 11px;
    }
    .tot-row {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
      color: #475569;
    }
    .tot-row.grand-total {
      border-top: 2px solid #0f172a;
      margin-top: 4px;
      padding-top: 6px;
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
    }
    .grand-amount {
      font-family: 'JetBrains Mono', monospace;
      color: #1e3a8a;
    }

    /* Pie fiscal */
    .invoice-footer-notes {
      margin-top: 16px;
      padding-top: 10px;
      border-top: 1px dashed #cbd5e1;
      font-size: 9.5px;
      color: #64748b;
      line-height: 1.4;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* ── Bloque de Pago Móvil ── */
    .pay-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
      padding: 16px 18px;
    }
    .pay-card-title {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 12px;
    }
    
    .payment-methods-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 14px;
    }
    .method-pill {
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 6px;
      text-align: center;
      font-size: 11px;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
      transition: all 0.15s ease;
      user-select: none;
    }
    .method-pill:hover {
      border-color: #94a3b8;
      background: #f1f5f9;
    }
    .method-pill.active {
      border-color: #2563eb;
      background: #eff6ff;
      color: #1d4ed8;
      box-shadow: 0 0 0 1px #2563eb;
    }

    .btn-submit-payment {
      width: 100%;
      background: #15803d;
      color: #ffffff;
      border: none;
      border-radius: 6px;
      padding: 14px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: background 0.15s ease, transform 0.05s;
      box-shadow: 0 2px 6px rgba(21, 128, 61, 0.25);
    }
    .btn-submit-payment:hover {
      background: #166534;
    }
    .btn-submit-payment:active {
      transform: scale(0.99);
    }
    .btn-submit-payment:disabled {
      background: #94a3b8;
      cursor: not-allowed;
      box-shadow: none;
    }

    /* Estado de Pago Exitoso */
    .success-alert {
      display: none;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      padding: 12px 14px;
      color: #166534;
      font-size: 12px;
      margin-top: 10px;
      text-align: center;
      line-height: 1.4;
    }
    .success-alert.show {
      display: block;
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Adaptación perfecta a teléfonos pequeños */
    @media (max-width: 420px) {
      body { padding: 6px; }
      .invoice-sheet { padding: 14px 12px; }
      .inv-header { flex-direction: column; }
      .fiscal-box { width: 100%; }
      .client-section { grid-template-columns: 1fr; }
      .totals-wrap { justify-content: stretch; }
      .totals-box { width: 100%; }
      .payment-methods-grid { grid-template-columns: 1fr 1fr; }
    }
  </style>
</head>
<body>

  <div class="container">

    <!-- ── Hoja de Factura Clásica ── -->
    <div class="invoice-sheet" id="invoiceArea">
      
      <!-- Sello físico clásico de cancelado -->
      <div class="stamp-seal" id="stampSeal">
        ★ CANCELADO ★
        <div class="stamp-sub">PAGO CONFIRMADO • NEXPOS</div>
      </div>

      <!-- Cabecera Oficial -->
      <div class="inv-header">
        <div class="brand-col">
          <img src="/public/img/logo.png" alt="NexPOS Logo" class="company-logo" onerror="this.style.display='none'"/>
          <div>
            <div class="company-name">${merchant}</div>
            <div class="company-info">
              RUC: 20489182391<br/>
              Av. República de Panamá 3545, Lima<br/>
              Central: (01) 710-4400 • contacto@nexpostech.com
            </div>
          </div>
        </div>

        <div class="fiscal-box">
          <div class="fiscal-ruc">R.U.C. 20489182391</div>
          <div class="fiscal-type">FACTURA ELECTRÓNICA</div>
          <div class="fiscal-num">${ref}</div>
        </div>
      </div>

      <!-- Datos del Cliente y Operación -->
      <div class="client-section">
        <div class="client-field">
          <span class="field-lbl">Fecha y Hora</span>
          <span class="field-val">${dateStr} — ${timeStr}</span>
        </div>
        <div class="client-field">
          <span class="field-lbl">Moneda de Pago</span>
          <span class="field-val">Dólares Americanos (USD)</span>
        </div>
        <div class="client-field">
          <span class="field-lbl">Cliente / Razón Social</span>
          <span class="field-val">${client}</span>
        </div>
        <div class="client-field">
          <span class="field-lbl">Documento / RUC</span>
          <span class="field-val">${doc}</span>
        </div>
      </div>

      <!-- Detalle de Productos -->
      <div class="table-container">
        <table class="invoice-table">
          <thead>
            <tr>
              <th class="col-qty">Cant</th>
              <th>Descripción</th>
              <th class="col-price">P. Unit</th>
              <th class="col-total">Importe</th>
            </tr>
          </thead>
          <tbody>
            ${parsedItems.map(item => `
              <tr>
                <td class="col-qty">${item.qty}</td>
                <td><strong>${item.name}</strong></td>
                <td class="col-price">$ ${item.price.toFixed(2)}</td>
                <td class="col-total">$ ${(item.qty * item.price).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Resumen de Totales Fiscales -->
      <div class="totals-wrap">
        <div class="totals-box">
          <div class="tot-row">
            <span>Op. Gravada (Subtotal):</span>
            <span style="font-family: 'JetBrains Mono', monospace;">$ ${subtotalNum.toFixed(2)}</span>
          </div>
          <div class="tot-row">
            <span>I.G.V. (18%):</span>
            <span style="font-family: 'JetBrains Mono', monospace;">$ ${igvNum.toFixed(2)}</span>
          </div>
          <div class="tot-row grand-total">
            <span>TOTAL FACTURADO:</span>
            <span class="grand-amount">$ ${totalNum.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <!-- Pie de página de factura clásica -->
      <div class="invoice-footer-notes">
        <div>
          Comprobante electrónico emitido según normativa vigente.<br/>
          Consulte la validez fiscal con el N° de Referencia: <strong>${ref}</strong>
        </div>
        <div style="text-align: right; font-weight: 700; color: #1e3a8a;">
          Terminal POS Caja 01
        </div>
      </div>

    </div>

    <!-- ── Panel de Cobro Móvil ── -->
    <div class="pay-card" id="payControlCard">
      <div class="pay-card-title">
        <span>💳</span> Seleccionar Canal de Pago Móvil
      </div>

      <div class="payment-methods-grid">
        <div class="method-pill active" onclick="setMethod(this, 'Banca Móvil / Transferencia')">
          📱 Transferencia
        </div>
        <div class="method-pill" onclick="setMethod(this, 'Billetera Digital')">
          ⚡ Billetera / QR
        </div>
        <div class="method-pill" onclick="setMethod(this, 'Tarjeta Débito')">
          💳 Débito Directo
        </div>
      </div>

      <button class="btn-submit-payment" id="payButton" onclick="processPayment()">
        <span>✓</span> Confirmar Pago de $ ${totalNum.toFixed(2)} USD
      </button>

      <div class="success-alert" id="successMsg" style="display:none; background:#ecfdf5; border:2px solid #10b981; border-radius:10px; padding:18px 14px; text-align:center; margin-top:12px;">
        <div style="font-size:36px; line-height:1; color:#059669; margin-bottom:6px;">✓</div>
        <div style="font-size:18px; font-weight:900; color:#065f46; letter-spacing:-0.5px;">¡PAGO EXITOSO!</div>
        <div style="font-size:13px; font-weight:600; color:#047857; margin-top:4px;">Factura cancelada y confirmada en el terminal de caja.</div>
        <div style="font-size:11px; color:#64748b; font-family:monospace; margin-top:6px;">Comprobante Ref: ${ref}</div>
      </div>
    </div>

  </div>

  <script>
    let selectedMethodName = 'Banca Móvil / Transferencia';

    function setMethod(el, name) {
      document.querySelectorAll('.method-pill').forEach(p => p.classList.remove('active'));
      el.classList.add('active');
      selectedMethodName = name;
    }

    async function processPayment() {
      const btn = document.getElementById('payButton');
      btn.disabled = true;
      btn.innerHTML = '<span>⏳</span> Procesando pago con el banco...';

      try {
        const res = await fetch('${statusApiUrl}', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ method: selectedMethodName })
        });
        await res.json();
      } catch (err) {
        console.warn('Confirmación offline:', err);
      }

      setTimeout(() => {
        document.getElementById('stampSeal').classList.add('visible');
        const sMsg = document.getElementById('successMsg');
        sMsg.style.display = 'block';
        btn.innerHTML = '✓ ¡PAGO EXITOSO Y FACTURA CANCELADA!';
        btn.style.background = '#059669';
        sMsg.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

module.exports = router;

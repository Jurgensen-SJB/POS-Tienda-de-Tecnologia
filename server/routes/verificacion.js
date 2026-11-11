const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { clients, employees } = require('../db/fallbackData');
const { registrarOperacion } = require('./auditoria');
const {
  generateOtpCode,
  generateVerificationToken,
  buildVerificationUrl,
  sendVerificationEmail,
  getSmtpConfigStatus,
  configureRealSmtp,
} = require('../utils/mailer');

function renderVerificationHtml({ success, title, message, entityName, entityEmail, tipoLabel }) {
  const badgeColor = success ? '#10b981' : '#ef4444';
  const badgeBg = success ? '#ecfdf5' : '#fef2f2';
  const badgeBorder = success ? '#a7f3d0' : '#fecaca';
  const icon = success ? '✓' : '✕';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — NexPOS Suite</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      font-family: 'Public Sans', system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      color: #0f172a;
    }
    .card {
      width: 100%;
      max-width: 460px;
      background: #ffffff;
      border-radius: 18px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
      overflow: hidden;
      text-align: center;
    }
    .header {
      padding: 24px 24px 18px;
      border-bottom: 1px solid #f1f5f9;
      background: #f8fafc;
    }
    .brand {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #0f172a;
    }
    .brand span { color: #2563eb; }
    .sub {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #64748b;
      margin-top: 3px;
    }
    .body {
      padding: 28px 26px;
    }
    .icon-circle {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: ${badgeBg};
      border: 2px solid ${badgeBorder};
      color: ${badgeColor};
      font-size: 30px;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }
    h1 {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 8px;
    }
    p.msg {
      font-size: 13px;
      color: #475569;
      line-height: 1.5;
      margin-bottom: 18px;
    }
    .info-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px;
      text-align: left;
      font-size: 12px;
      margin-bottom: 20px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
    }
    .info-label { color: #64748b; font-weight: 600; }
    .info-val { color: #0f172a; font-weight: 700; font-family: 'JetBrains Mono', monospace; }
    .btn {
      display: inline-block;
      width: 100%;
      padding: 12px 18px;
      background: #2563eb;
      color: #ffffff;
      font-weight: 700;
      font-size: 13px;
      border-radius: 10px;
      text-decoration: none;
      border: none;
      cursor: pointer;
    }
    .btn:hover { background: #1d4ed8; }
    .footer {
      padding: 12px 20px;
      background: #f8fafc;
      border-top: 1px solid #f1f5f9;
      font-size: 11px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="brand">Nex<span>POS</span> Suite</div>
      <div class="sub">Sistema de Verificación de Identidad</div>
    </div>
    <div class="body">
      <div class="icon-circle">${icon}</div>
      <h1>${title}</h1>
      <p class="msg">${message}</p>
      ${entityName ? `
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Tipo de Registro:</span>
          <span class="info-val">${tipoLabel}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Titular:</span>
          <span class="info-val">${entityName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Correo Verificado:</span>
          <span class="info-val">${entityEmail || '—'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Estado:</span>
          <span class="info-val" style="color: #059669;">VERIFICADO ✓</span>
        </div>
      </div>
      ` : ''}
      <button class="btn" onclick="window.close(); setTimeout(() => { window.location.href = 'http://localhost:5174'; }, 200);">
        Volver a NexPOS Suite
      </button>
    </div>
    <div class="footer">
      Comprobante de activación electrónica • NexPOS Tecnología S.A.S. (Colombia)
    </div>
  </div>
</body>
</html>`;
}

// GET /verificar-correo?tipo=cliente|empleado&token=...
router.get('/', async (req, res) => {
  const { tipo = 'cliente', token, id } = req.query;

  if (!token && !id) {
    return res.status(400).send(
      renderVerificationHtml({
        success: false,
        title: 'Enlace de verificación inválido',
        message: 'No se encontró un token de confirmación válido en el enlace.',
      })
    );
  }

  const isEmpleado = String(tipo).toLowerCase() === 'empleado' || String(tipo).toLowerCase() === 'usuario';
  const tipoLabel = isEmpleado ? 'Colaborador / Usuario' : 'Cliente Comercial';

  try {
    if (isEmpleado) {
      let updatedEmp = null;
      try {
        const q = token
          ? `UPDATE empleados
             SET correo_verificado = TRUE,
                 fecha_verificacion = CURRENT_TIMESTAMP,
                 token_verificacion = NULL
             WHERE token_verificacion = $1 OR id_empleado = $2
             RETURNING *`
          : `UPDATE empleados
             SET correo_verificado = TRUE,
                 fecha_verificacion = CURRENT_TIMESTAMP,
                 token_verificacion = NULL
             WHERE id_empleado = $1
             RETURNING *`;
        const params = token ? [token, parseInt(id, 10) || -1] : [parseInt(id, 10) || -1];
        const dbRes = await pool.query(q, params);
        if (dbRes.rows.length > 0) updatedEmp = dbRes.rows[0];
      } catch {
        // Fallback memory
      }

      const memEmp = employees.find(
        e => (token && e.token_verificacion === token) || (id && e.id_empleado === parseInt(id, 10))
      );
      if (memEmp) {
        memEmp.correo_verificado = true;
        memEmp.fecha_verificacion = new Date().toISOString();
        memEmp.token_verificacion = null;
        if (!updatedEmp) updatedEmp = memEmp;
      }

      if (!updatedEmp) {
        return res.status(404).send(
          renderVerificationHtml({
            success: false,
            title: 'Enlace expirado o ya utilizado',
            message: 'Este enlace de verificación ya fue confirmado anteriormente o no corresponde a un registro pendiente.',
          })
        );
      }

      await registrarOperacion({
        id_usuario: 1,
        operacion: 'MODIFICAR',
        tabla_afectada: 'empleados',
        id_registro_afectado: updatedEmp.id_empleado,
        descripcion: `Correo electrónico verificado mediante enlace para colaborador ${updatedEmp.nombres} ${updatedEmp.apellidos || ''} (${updatedEmp.correo})`,
        datos_nuevos: { correo_verificado: true, correo: updatedEmp.correo }
      });

      return res.send(
        renderVerificationHtml({
          success: true,
          title: '¡Correo Electrónico Verificado!',
          message: 'La cuenta de colaborador ha sido confirmada exitosamente. Ya puede iniciar sesión y operar en el sistema.',
          entityName: `${updatedEmp.nombres} ${updatedEmp.apellidos || ''}`.trim(),
          entityEmail: updatedEmp.correo,
          tipoLabel,
        })
      );
    } else {
      let updatedClient = null;
      try {
        const q = token
          ? `UPDATE clientes
             SET correo_verificado = TRUE,
                 fecha_verificacion = CURRENT_TIMESTAMP,
                 token_verificacion = NULL,
                 fecha_actualizacion = CURRENT_TIMESTAMP
             WHERE token_verificacion = $1 OR id_cliente = $2
             RETURNING *`
          : `UPDATE clientes
             SET correo_verificado = TRUE,
                 fecha_verificacion = CURRENT_TIMESTAMP,
                 token_verificacion = NULL,
                 fecha_actualizacion = CURRENT_TIMESTAMP
             WHERE id_cliente = $1
             RETURNING *`;
        const params = token ? [token, parseInt(id, 10) || -1] : [parseInt(id, 10) || -1];
        const dbRes = await pool.query(q, params);
        if (dbRes.rows.length > 0) updatedClient = dbRes.rows[0];
      } catch {
        // Fallback memory
      }

      const memCli = clients.find(
        c => (token && c.token_verificacion === token) || (id && c.id_cliente === parseInt(id, 10))
      );
      if (memCli) {
        memCli.correo_verificado = true;
        memCli.fecha_verificacion = new Date().toISOString();
        memCli.token_verificacion = null;
        if (!updatedClient) updatedClient = memCli;
      }

      if (!updatedClient) {
        return res.status(404).send(
          renderVerificationHtml({
            success: false,
            title: 'Enlace expirado o ya utilizado',
            message: 'Este enlace de verificación ya fue confirmado anteriormente o no corresponde a un cliente pendiente.',
          })
        );
      }

      await registrarOperacion({
        id_usuario: 1,
        operacion: 'MODIFICAR',
        tabla_afectada: 'clientes',
        id_registro_afectado: updatedClient.id_cliente,
        descripcion: `Correo electrónico verificado mediante enlace para cliente ${updatedClient.nombres} ${updatedClient.apellidos || ''} (${updatedClient.correo})`,
        datos_nuevos: { correo_verificado: true, correo: updatedClient.correo }
      });

      return res.send(
        renderVerificationHtml({
          success: true,
          title: '¡Correo de Cliente Verificado!',
          message: 'El correo del cliente ha sido confirmado exitosamente. Ahora está habilitado para facturación y compras en el Terminal POS.',
          entityName: `${updatedClient.nombres} ${updatedClient.apellidos || ''}`.trim(),
          entityEmail: updatedClient.correo,
          tipoLabel,
        })
      );
    }
  } catch (err) {
    return res.status(500).send(
      renderVerificationHtml({
        success: false,
        title: 'Error al procesar verificación',
        message: err.message || 'Ocurrió un error inesperado al verificar el correo.',
      })
    );
  }
});

// POST /api/verificacion/reenviar
router.post('/reenviar', async (req, res) => {
  const { tipo = 'cliente', id } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'El ID del registro es obligatorio' });
  }

  const isEmpleado = String(tipo).toLowerCase() === 'empleado' || String(tipo).toLowerCase() === 'usuario';
  const token = generateVerificationToken(isEmpleado ? 'emp' : 'cli');

  try {
    if (isEmpleado) {
      let emp = null;
      try {
        const dbRes = await pool.query(
          `UPDATE empleados SET token_verificacion = $1 WHERE id_empleado = $2 RETURNING *`,
          [token, id]
        );
        if (dbRes.rows.length > 0) emp = dbRes.rows[0];
      } catch {}

      const memEmp = employees.find(e => e.id_empleado === parseInt(id, 10));
      if (memEmp) {
        memEmp.token_verificacion = token;
        if (!emp) emp = memEmp;
      }

      if (!emp) return res.status(404).json({ error: 'Colaborador no encontrado' });
      if (!emp.correo || !emp.correo.includes('@')) {
        return res.status(400).json({ error: 'El colaborador no tiene un correo electrónico válido registrado' });
      }

      const mailRes = await sendVerificationEmail({
        to: emp.correo,
        nombre: `${emp.nombres} ${emp.apellidos || ''}`.trim(),
        tipo: 'empleado',
        token,
        codigo_otp: emp.codigo_otp || otp,
      });

      return res.json({
        success: true,
        message: `Enlace y código OTP enviados a ${emp.correo}`,
        correo: emp.correo,
        codigo_otp: emp.codigo_otp || otp,
        verificationUrl: mailRes.verificationUrl,
        previewUrl: mailRes.previewUrl,
      });
    } else {
      let cli = null;
      const otp = generateOtpCode();
      try {
        const dbRes = await pool.query(
          `UPDATE clientes SET token_verificacion = $1, codigo_otp = $2, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_cliente = $3 RETURNING *`,
          [token, otp, id]
        );
        if (dbRes.rows.length > 0) cli = dbRes.rows[0];
      } catch {}

      const memCli = clients.find(c => c.id_cliente === parseInt(id, 10));
      if (memCli) {
        memCli.token_verificacion = token;
        memCli.codigo_otp = otp;
        if (!cli) cli = memCli;
      }

      if (!cli) return res.status(404).json({ error: 'Cliente no encontrado' });
      if (!cli.correo || !cli.correo.includes('@')) {
        return res.status(400).json({ error: 'El cliente no tiene un correo electrónico válido registrado' });
      }

      const mailRes = await sendVerificationEmail({
        to: cli.correo,
        nombre: `${cli.nombres} ${cli.apellidos || ''}`.trim(),
        tipo: 'cliente',
        token,
        codigo_otp: cli.codigo_otp || otp,
      });

      return res.json({
        success: true,
        message: `Enlace y código OTP enviados a ${cli.correo}`,
        correo: cli.correo,
        codigo_otp: cli.codigo_otp || otp,
        verificationUrl: mailRes.verificationUrl,
        previewUrl: mailRes.previewUrl,
      });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Error al enviar correo de verificación: ' + err.message });
  }
});

// POST /api/verificacion/validar-otp
// Permite que el cliente dicte el código de 6 dígitos al cajero
router.post('/validar-otp', async (req, res) => {
  const { tipo = 'cliente', id, codigo, id_usuario = 1 } = req.body;
  if (!codigo || !codigo.trim()) {
    return res.status(400).json({ error: 'Debes ingresar el código de 6 dígitos dictado por el cliente' });
  }

  const cleanCode = codigo.trim().replace(/\s+/g, '');
  const isEmpleado = String(tipo).toLowerCase() === 'empleado' || String(tipo).toLowerCase() === 'usuario';

  try {
    if (isEmpleado) {
      let emp = null;
      try {
        const check = await pool.query('SELECT * FROM empleados WHERE id_empleado = $1', [id]);
        if (check.rows.length > 0) emp = check.rows[0];
      } catch {}

      const memEmp = employees.find(e => e.id_empleado === parseInt(id, 10));
      if (!emp && memEmp) emp = memEmp;

      if (!emp) return res.status(404).json({ error: 'Colaborador no encontrado' });

      const expectedOtp = (emp.codigo_otp || '').trim();
      if (!expectedOtp || expectedOtp !== cleanCode) {
        return res.status(400).json({ error: 'Código incorrecto. Verifica los 6 dígitos dictados por el colaborador.' });
      }

      // Validar y activar
      try {
        await pool.query(
          `UPDATE empleados SET correo_verificado = TRUE, fecha_verificacion = CURRENT_TIMESTAMP, codigo_otp = NULL, token_verificacion = NULL WHERE id_empleado = $1`,
          [id]
        );
      } catch {}

      if (memEmp) {
        memEmp.correo_verificado = true;
        memEmp.fecha_verificacion = new Date().toISOString();
        memEmp.codigo_otp = null;
        memEmp.token_verificacion = null;
      }

      await registrarOperacion({
        id_usuario,
        operacion: 'MODIFICAR',
        tabla_afectada: 'empleados',
        id_registro_afectado: parseInt(id, 10),
        descripcion: `Colaborador ${emp.nombres} ${emp.apellidos || ''} verificado exitosamente mediante código OTP dictado (${cleanCode})`,
        datos_nuevos: { correo_verificado: true }
      });

      return res.json({
        success: true,
        message: '¡Colaborador verificado correctamente con el código OTP!',
        correo_verificado: true,
      });
    } else {
      let cli = null;
      try {
        const check = await pool.query('SELECT * FROM clientes WHERE id_cliente = $1', [id]);
        if (check.rows.length > 0) cli = check.rows[0];
      } catch {}

      const memCli = clients.find(c => c.id_cliente === parseInt(id, 10));
      if (!cli && memCli) cli = memCli;

      if (!cli) return res.status(404).json({ error: 'Cliente no encontrado' });

      const expectedOtp = (cli.codigo_otp || '').trim();
      if (!expectedOtp || expectedOtp !== cleanCode) {
        return res.status(400).json({ error: 'Código incorrecto. Verifica los 6 dígitos dictados por el cliente.' });
      }

      // Validar y activar
      try {
        await pool.query(
          `UPDATE clientes SET correo_verificado = TRUE, fecha_verificacion = CURRENT_TIMESTAMP, codigo_otp = NULL, token_verificacion = NULL, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_cliente = $1`,
          [id]
        );
      } catch {}

      if (memCli) {
        memCli.correo_verificado = true;
        memCli.fecha_verificacion = new Date().toISOString();
        memCli.codigo_otp = null;
        memCli.token_verificacion = null;
      }

      await registrarOperacion({
        id_usuario,
        operacion: 'MODIFICAR',
        tabla_afectada: 'clientes',
        id_registro_afectado: parseInt(id, 10),
        descripcion: `Cliente ${cli.nombres} ${cli.apellidos || ''} verificado exitosamente mediante código OTP dictado (${cleanCode})`,
        datos_nuevos: { correo_verificado: true }
      });

      return res.json({
        success: true,
        message: '¡Cliente verificado y habilitado para facturar en caja!',
        correo_verificado: true,
      });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Error al validar código OTP: ' + err.message });
  }
});

// GET /api/verificacion/estado/:tipo/:id
router.get('/estado/:tipo/:id', async (req, res) => {
  const { tipo, id } = req.params;
  const isEmpleado = String(tipo).toLowerCase() === 'empleado' || String(tipo).toLowerCase() === 'usuario';

  if (isEmpleado) {
    try {
      const dbRes = await pool.query(
        'SELECT id_empleado, nombres, apellidos, correo, correo_verificado, fecha_verificacion, token_verificacion FROM empleados WHERE id_empleado = $1',
        [id]
      );
      if (dbRes.rows.length > 0) {
        const row = dbRes.rows[0];
        return res.json({
          ...row,
          verificationUrl: row.token_verificacion ? buildVerificationUrl('empleado', row.token_verificacion) : null,
        });
      }
    } catch {}
    const memEmp = employees.find(e => e.id_empleado === parseInt(id, 10));
    if (!memEmp) return res.status(404).json({ error: 'No encontrado' });
    return res.json({
      ...memEmp,
      verificationUrl: memEmp.token_verificacion ? buildVerificationUrl('empleado', memEmp.token_verificacion) : null,
    });
  } else {
    try {
      const dbRes = await pool.query(
        'SELECT id_cliente, nombres, apellidos, correo, correo_verificado, fecha_verificacion, token_verificacion FROM clientes WHERE id_cliente = $1',
        [id]
      );
      if (dbRes.rows.length > 0) {
        const row = dbRes.rows[0];
        return res.json({
          ...row,
          verificationUrl: row.token_verificacion ? buildVerificationUrl('cliente', row.token_verificacion) : null,
        });
      }
    } catch {}
    const memCli = clients.find(c => c.id_cliente === parseInt(id, 10));
    if (!memCli) return res.status(404).json({ error: 'No encontrado' });
    return res.json({
      ...memCli,
      verificationUrl: memCli.token_verificacion ? buildVerificationUrl('cliente', memCli.token_verificacion) : null,
    });
  }
});

// GET /api/verificacion/smtp-config
router.get('/smtp-config', (req, res) => {
  res.json(getSmtpConfigStatus());
});

// POST /api/verificacion/smtp-config
router.post('/smtp-config', async (req, res) => {
  const { host = 'smtp.gmail.com', port = 587, secure = false, user, pass, from } = req.body;
  if (!user || !pass) {
    return res.status(400).json({ error: 'Debes ingresar el correo remitente (user) y la contraseña de aplicación (pass).' });
  }
  try {
    const status = await configureRealSmtp({ host, port, secure, user, pass, from });
    return res.json({
      success: true,
      message: `Servidor SMTP verificado y conectado con ${status.user}`,
      ...status,
    });
  } catch (err) {
    return res.status(400).json({
      error: `No se pudo autenticar con el servidor SMTP (${err.message}). Si usas Gmail, asegúrate de usar una Contraseña de Aplicación de 16 letras de tu cuenta de Google.`,
    });
  }
});

module.exports = router;


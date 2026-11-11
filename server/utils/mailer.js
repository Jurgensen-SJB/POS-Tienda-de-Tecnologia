const nodemailer = require('nodemailer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

let cachedTransporter = null;
let cachedMode = null; // 'real' | 'ethereal'

// Genera un código OTP de 6 dígitos numéricos
function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateVerificationToken(prefix = 'ver') {
  return `${prefix}-${crypto.randomBytes(16).toString('hex')}`;
}

function getBaseServerUrl() {
  const port = process.env.PORT || 5000;
  return process.env.PUBLIC_URL || `http://localhost:${port}`;
}

function buildVerificationUrl(tipo, token) {
  const base = getBaseServerUrl();
  return `${base}/verificar-correo?tipo=${encodeURIComponent(tipo)}&token=${encodeURIComponent(token)}`;
}

function getSmtpConfigStatus() {
  const hasRealSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  return {
    configured: hasRealSmtp,
    mode: hasRealSmtp ? 'real' : 'ethereal',
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    from: process.env.SMTP_FROM || (process.env.SMTP_USER ? `"NexPOS Suite" <${process.env.SMTP_USER}>` : '"NexPOS Suite" <no-reply@nexpos.co>'),
  };
}

function persistSmtpToEnvFile({ host, port, secure, user, pass, from }) {
  const envPath = path.join(__dirname, '..', '.env');
  let content = '';
  try {
    content = fs.readFileSync(envPath, 'utf8');
  } catch {
    content = 'PORT=5000\n';
  }

  const updates = {
    SMTP_HOST: host,
    SMTP_PORT: String(port),
    SMTP_SECURE: String(Boolean(secure)),
    SMTP_USER: user,
    SMTP_PASS: pass,
    SMTP_FROM: from || `"NexPOS Suite" <${user}>`,
  };

  let lines = content.split(/\r?\n/);
  const seenKeys = new Set();

  lines = lines.map((line) => {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && Object.prototype.hasOwnProperty.call(updates, match[1])) {
      seenKeys.add(match[1]);
      return `${match[1]}=${updates[match[1]]}`;
    }
    return line;
  });

  Object.entries(updates).forEach(([k, v]) => {
    if (!seenKeys.has(k)) {
      lines.push(`${k}=${v}`);
    }
  });

  fs.writeFileSync(envPath, lines.filter((l, i, arr) => i < arr.length - 1 || l !== '').join('\n') + '\n', 'utf8');
}

async function configureRealSmtp({ host = 'smtp.gmail.com', port = 587, secure = false, user, pass, from }) {
  const cleanUser = (user || '').trim();
  const cleanPass = (pass || '').replace(/\s+/g, ''); // Quitar espacios de contraseñas de app
  const cleanHost = (host || 'smtp.gmail.com').trim();
  const cleanPort = parseInt(port || '587', 10);
  const isSecure = Boolean(secure) || cleanPort === 465;

  const testTransporter = nodemailer.createTransport({
    host: cleanHost,
    port: cleanPort,
    secure: isSecure,
    auth: {
      user: cleanUser,
      pass: cleanPass,
    },
  });

  await testTransporter.verify();

  process.env.SMTP_HOST = cleanHost;
  process.env.SMTP_PORT = String(cleanPort);
  process.env.SMTP_SECURE = String(isSecure);
  process.env.SMTP_USER = cleanUser;
  process.env.SMTP_PASS = cleanPass;
  process.env.SMTP_FROM = from || `"NexPOS Suite Colombia" <${cleanUser}>`;

  cachedTransporter = testTransporter;
  cachedMode = 'real';

  persistSmtpToEnvFile({
    host: cleanHost,
    port: cleanPort,
    secure: isSecure,
    user: cleanUser,
    pass: cleanPass,
    from: process.env.SMTP_FROM,
  });

  return getSmtpConfigStatus();
}

async function getTransporter() {
  const hasRealSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

  if (hasRealSmtp) {
    if (cachedTransporter && cachedMode === 'real') return cachedTransporter;
    const portNum = parseInt(process.env.SMTP_PORT || '587', 10);
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: portNum,
      secure: process.env.SMTP_SECURE === 'true' || portNum === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS.replace(/\s+/g, ''),
      },
    });
    cachedMode = 'real';
    return cachedTransporter;
  }

  if (cachedTransporter && cachedMode === 'ethereal') return cachedTransporter;

  try {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    cachedMode = 'ethereal';
    return cachedTransporter;
  } catch {
    return null;
  }
}

async function sendVerificationEmail({ to, nombre, tipo = 'cliente', token, codigo_otp }) {
  const verificationUrl = buildVerificationUrl(tipo, token);
  const roleLabel = tipo === 'empleado' ? 'Colaborador / Usuario del Sistema' : 'Cliente Registrado';
  const otpCode = codigo_otp || '123456';

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; padding: 24px; color: #0f172a;">
      <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 12px rgba(15,23,42,0.06);">
        <div style="background: #0f172a; padding: 20px 24px; color: #ffffff;">
          <h2 style="margin: 0; font-size: 18px; font-weight: 800;">Nex<span style="color: #3b82f6;">POS</span> Suite Colombia</h2>
          <p style="margin: 4px 0 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">
            Código de Confirmación de Identidad
          </p>
        </div>
        <div style="padding: 24px;">
          <p style="margin: 0 0 12px; font-size: 14px;">Hola <strong>${nombre}</strong>,</p>
          <p style="margin: 0 0 16px; font-size: 13px; color: #475569; line-height: 1.5;">
            Dicta este código de 6 dígitos en la caja o al encargado para activar tu registro como <strong>${roleLabel}</strong>:
          </p>
          
          <div style="text-align: center; margin: 20px 0; background: #f0fdf4; border: 2px dashed #16a34a; border-radius: 12px; padding: 16px;">
            <span style="font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px;">Código de Verificación (OTP)</span>
            <span style="font-family: 'JetBrains Mono', Consolas, monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #15803d;">
              ${otpCode}
            </span>
          </div>

          <div style="text-align: center; margin: 20px 0;">
            <p style="font-size: 12px; color: #64748b; margin-bottom: 10px;">O si lo prefieres, haz clic en el siguiente botón:</p>
            <a href="${verificationUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 10px 20px; border-radius: 8px;">
              ✓ Activar mediante enlace
            </a>
          </div>

          <p style="margin: 0 0 8px; font-size: 11px; color: #94a3b8; text-align: center;">
            Este código vence en 15 minutos. Si no solicitaste este registro, por favor ignora este mensaje.
          </p>
        </div>
        <div style="background: #f8fafc; padding: 14px 24px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center;">
          NexPOS Tecnología S.A.S. • NIT 901.489.182-3 • Bogotá D.C., Colombia
        </div>
      </div>
    </div>
  `;

  console.log(`\n======================================================`);
  console.log(`🔑 [CÓDIGO OTP DE VERIFICACIÓN]: ${otpCode}  (${roleLabel} -> ${to})`);
  console.log(`🔗 Enlace directo de activación: ${verificationUrl}`);
  console.log(`======================================================\n`);

  let previewUrl = null;
  let sent = false;
  let mode = getSmtpConfigStatus().mode;

  try {
    const transporter = await getTransporter();
    if (transporter && to && to.includes('@')) {
      const fromAddress =
        process.env.SMTP_FROM ||
        (process.env.SMTP_USER ? `"NexPOS Suite Colombia" <${process.env.SMTP_USER}>` : '"NexPOS Suite Colombia" <no-reply@nexpos.co>');
      const info = await transporter.sendMail({
        from: fromAddress,
        to,
        subject: `Tu código de verificación NexPOS es: ${otpCode}`,
        html,
      });
      sent = true;
      mode = cachedMode || mode;
      const testUrl = nodemailer.getTestMessageUrl(info);
      if (testUrl) {
        previewUrl = testUrl;
        console.log(`📨 Vista previa de correo (Ethereal): ${previewUrl}`);
      } else {
        console.log(`✅ Correo real entregado por SMTP a: ${to}`);
      }
    }
  } catch (err) {
    console.warn('⚠️ Aviso al enviar correo SMTP:', err.message);
  }

  return {
    sent,
    mode,
    codigo_otp: otpCode,
    verificationUrl,
    previewUrl,
  };
}

module.exports = {
  generateOtpCode,
  generateVerificationToken,
  buildVerificationUrl,
  sendVerificationEmail,
  getSmtpConfigStatus,
  configureRealSmtp,
};

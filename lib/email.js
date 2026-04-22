import net from 'net';
import tls from 'tls';
import Setting from '@/models/Setting';

const CRLF = '\r\n';

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const encodeHeader = (value = '') => String(value).replace(/[\r\n]+/g, ' ').trim();

const formatAddress = ({ name, email }) => {
  const cleanEmail = encodeHeader(email);
  const cleanName = encodeHeader(name);
  return cleanName ? `"${cleanName.replace(/"/g, '\\"')}" <${cleanEmail}>` : cleanEmail;
};

const parseEmailList = (value = '') => String(value)
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const readLine = (socket) => new Promise((resolve, reject) => {
  let buffer = '';
  const cleanup = () => {
    socket.off('data', onData);
    socket.off('error', onError);
  };
  const onError = (error) => {
    cleanup();
    reject(error);
  };
  const onData = (chunk) => {
    buffer += chunk.toString('utf8');
    const lines = buffer.split(/\r?\n/).filter(Boolean);
    const lastLine = lines[lines.length - 1] || '';
    if (/^\d{3}\s/.test(lastLine)) {
      cleanup();
      resolve(buffer);
    }
  };
  socket.on('data', onData);
  socket.on('error', onError);
});

const sendCommand = async (socket, command, expectedCodes = []) => {
  socket.write(`${command}${CRLF}`);
  const response = await readLine(socket);
  const code = Number(response.slice(0, 3));
  if (expectedCodes.length && !expectedCodes.includes(code)) {
    throw new Error(`SMTP command failed (${command}): ${response.trim()}`);
  }
  return response;
};

async function createSmtpConnection(config) {
  const port = Number(config.port || 587);
  const host = String(config.host || '').trim();

  if (!host) throw new Error('SMTP host is required');

  let socket = config.secure
    ? tls.connect({ host, port, servername: host, rejectUnauthorized: false })
    : net.connect({ host, port });

  await new Promise((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('secureConnect', resolve);
    socket.once('error', reject);
  });
  await readLine(socket);
  await sendCommand(socket, `EHLO ${host}`, [250]);

  if (!config.secure) {
    await sendCommand(socket, 'STARTTLS', [220]);
    socket = tls.connect({ socket, servername: host, rejectUnauthorized: false });
    await new Promise((resolve, reject) => {
      socket.once('secureConnect', resolve);
      socket.once('error', reject);
    });
    await sendCommand(socket, `EHLO ${host}`, [250]);
  }

  if (config.username && config.password) {
    await sendCommand(socket, 'AUTH LOGIN', [334]);
    await sendCommand(socket, Buffer.from(config.username).toString('base64'), [334]);
    await sendCommand(socket, Buffer.from(config.password).toString('base64'), [235]);
  }

  return socket;
}

async function sendSmtpMail(config, { to = [], subject = '', html = '', text = '' }) {
  const recipients = Array.isArray(to) ? to.filter(Boolean) : parseEmailList(to);
  if (!recipients.length) return;

  const fromEmail = config.fromEmail || config.username;
  if (!fromEmail) throw new Error('SMTP from email is required');

  const socket = await createSmtpConnection(config);
  const from = formatAddress({ name: config.fromName || 'Unikriti', email: fromEmail });
  const boundary = `unikriti-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  try {
    await sendCommand(socket, `MAIL FROM:<${fromEmail}>`, [250]);
    for (const recipient of recipients) {
      await sendCommand(socket, `RCPT TO:<${recipient}>`, [250, 251]);
    }
    await sendCommand(socket, 'DATA', [354]);

    const headers = [
      `From: ${from}`,
      `To: ${recipients.join(', ')}`,
      config.replyTo ? `Reply-To: ${encodeHeader(config.replyTo)}` : '',
      `Subject: ${encodeHeader(subject)}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ].filter(Boolean).join(CRLF);

    const message = [
      headers,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: 7bit',
      '',
      text || html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: 7bit',
      '',
      html,
      `--${boundary}--`,
      '.',
      '',
    ].join(CRLF);

    socket.write(message);
    const response = await readLine(socket);
    const code = Number(response.slice(0, 3));
    if (code !== 250) {
      throw new Error(`SMTP data failed: ${response.trim()}`);
    }
    await sendCommand(socket, 'QUIT', [221]);
  } finally {
    socket.end();
  }
}

export async function getEmailSettings() {
  const setting = await Setting.findOne({ key: 'email_smtp' }).lean();
  return setting?.value || {};
}

export async function sendConfiguredEmail(message) {
  const config = await getEmailSettings();
  if (!config.enabled) return { skipped: true, reason: 'Email SMTP disabled' };
  await sendSmtpMail(config, message);
  return { success: true };
}

export function buildEnrollmentEmailHtml({
  title,
  subtitle,
  studentName,
  courseTitle,
  packageName,
  amount,
  paymentStatus,
  gateway,
  transactionId,
  preferredDays = [],
  preferredTimes = [],
  customCss = '',
  website,
}) {
  const rows = [
    ['Student', studentName],
    ['Course', courseTitle],
    ['Package', packageName],
    ['Amount', amount],
    ['Payment Status', paymentStatus],
    ['Gateway', gateway],
    ['Transaction ID', transactionId],
    ['Preferred Days', preferredDays.join(', ')],
    ['Preferred Time Slots', preferredTimes.join(', ')],
  ].filter(([, value]) => value !== undefined && value !== null && String(value).trim());

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { margin:0; padding:0; background:#f3f4f6; font-family:Arial, sans-serif; color:#111827; }
    .wrap { padding:28px 14px; }
    .email-card { max-width:680px; margin:0 auto; background:#ffffff; border-radius:22px; overflow:hidden; box-shadow:0 18px 50px rgba(15,23,42,.12); }
    .email-hero { background:linear-gradient(135deg,#111827,#dc2626); color:#fff; padding:34px 32px; }
    .eyebrow { text-transform:uppercase; letter-spacing:.12em; font-size:12px; opacity:.78; font-weight:700; }
    h1 { margin:10px 0 8px; font-size:28px; line-height:1.2; }
    .sub { margin:0; color:rgba(255,255,255,.82); font-size:15px; line-height:1.6; }
    .content { padding:28px 32px 34px; }
    .summary { width:100%; border-collapse:collapse; margin:18px 0 24px; }
    .summary td { padding:13px 0; border-bottom:1px solid #eef2f7; vertical-align:top; }
    .summary td:first-child { color:#6b7280; font-size:13px; width:180px; }
    .summary td:last-child { font-weight:700; color:#111827; }
    .pill { display:inline-block; padding:8px 13px; border-radius:999px; background:#fee2e2; color:#991b1b; font-weight:700; font-size:12px; }
    .foot { color:#6b7280; font-size:13px; line-height:1.6; }
    ${customCss || ''}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="email-card">
      <div class="email-hero">
        <div class="eyebrow">Unikriti Enrollment</div>
        <h1>${escapeHtml(title)}</h1>
        <p class="sub">${escapeHtml(subtitle)}</p>
      </div>
      <div class="content">
        <span class="pill">${escapeHtml(paymentStatus || 'Enrollment update')}</span>
        <table class="summary">
          ${rows.map(([label, value]) => `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`).join('')}
        </table>
        <p class="foot">Thank you for choosing Unikriti. Our team will contact you if any schedule or payment follow-up is needed.</p>
      </div>
          <div style="text-align:center; margin:25px 0;">
  <a href="${website}" target="_blank"
     style="
       display:inline-block;
       padding:12px 22px;
       background:linear-gradient(135deg,#111827,#dc2626);
       color:#ffffff;
       text-decoration:none;
       border-radius:10px;
       font-weight:600;
       font-size:14px;
       box-shadow:0 10px 25px rgba(0,0,0,0.15);
     ">
    Go to dashbaord
  </a>

    </div>

</div>
  </div>
</body>
</html>`;
}

export async function sendEnrollmentConfirmation({ payment, user, course, packageDoc, admin = false }) {
  try {
    const config = await getEmailSettings();
    if (!config.enabled) return;

    const adminEmails = parseEmailList(config.adminEmails);
    const to = admin ? adminEmails : [user?.email].filter(Boolean);
    if (!to.length) return;

    const paymentStatus = payment.status === 'completed' ? 'Payment successful' : 'Enrollment request received';
    const subjectPrefix = config.subjectPrefix ? `${config.subjectPrefix} ` : '';
    const subject = `${subjectPrefix}${admin ? 'New enrollment' : 'Enrollment confirmation'} - ${course?.title || 'Course'}`;
    const amount = Number(payment.amount || 0) > 0 ? `Rs.${Number(payment.amount || 0).toLocaleString('en-IN')}` : 'Free';
    const html = buildEnrollmentEmailHtml({
      title: admin ? 'New Course Enrollment' : 'Your enrollment is confirmed',
      subtitle: admin ? 'A student has completed or requested enrollment.' : 'Here are your course and payment details.',
      studentName: user?.name || 'Student',
      courseTitle: course?.title || 'Course',
      packageName: packageDoc?.name || 'Selected package',
      amount,
      paymentStatus,
      gateway: payment.gateway,
      transactionId: payment.transactionId,
      preferredDays: payment.preferredDays || [],
      preferredTimes: payment.preferredTimes || [],
      customCss: config.customCss || '',
      website: 'https://unikriti.in/student/dashboard',
    });
  
    await sendSmtpMail(config, { to, subject, html });
  } catch (error) {
    console.error('Enrollment email failed:', error.message);
  }
}

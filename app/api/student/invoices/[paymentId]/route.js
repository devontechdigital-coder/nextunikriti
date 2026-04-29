import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Payment from '@/models/Payment';
import Setting from '@/models/Setting';
import '@/models/Course';
import '@/models/Package';
import { getUserFromCookie } from '@/utils/auth';

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const formatDate = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatCurrency = (value) => new Intl.NumberFormat('en-IN', {
  style: 'decimal',
  maximumFractionDigits: 0,
}).format(Number(value || 0));

const escapePdfText = (value = '') => String(value)
  .replaceAll('\\', '\\\\')
  .replaceAll('(', '\\(')
  .replaceAll(')', '\\)');

const drawText = ({ text, x, y, size = 10, bold = false }) =>
  `BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x} ${y} Td (${escapePdfText(text)}) Tj ET\n`;

const buildInvoicePdf = ({ invoiceNo, theme, contact, payment }) => {
  const lines = [];
  lines.push('0.94 0.95 0.97 rg 0 0 595 842 re f\n');
  lines.push('0.07 0.09 0.15 rg 0 730 595 112 re f\n');
  lines.push('1 1 1 rg\n');
  lines.push(drawText({ text: theme.siteName || 'Unikriti', x: 48, y: 794, size: 24, bold: true }));
  lines.push(drawText({ text: contact.email || '', x: 48, y: 772, size: 10 }));
  lines.push(drawText({ text: contact.phone || '', x: 48, y: 756, size: 10 }));
  lines.push(drawText({ text: 'INVOICE', x: 430, y: 794, size: 24, bold: true }));
  lines.push(drawText({ text: `#${invoiceNo}`, x: 432, y: 772, size: 11 }));

  lines.push('1 1 1 rg 36 52 523 642 re f\n');
  lines.push('0 0 0 rg\n');
  lines.push(drawText({ text: 'Invoice Details', x: 56, y: 660, size: 16, bold: true }));
  lines.push(drawText({ text: 'Invoice Date', x: 56, y: 628, size: 9 }));
  lines.push(drawText({ text: formatDate(payment.createdAt), x: 56, y: 610, size: 12, bold: true }));
  lines.push(drawText({ text: 'Payment Status', x: 310, y: 628, size: 9 }));
  lines.push(drawText({ text: payment.status || 'N/A', x: 310, y: 610, size: 12, bold: true }));
  lines.push(drawText({ text: 'Gateway', x: 56, y: 574, size: 9 }));
  lines.push(drawText({ text: payment.gateway || 'N/A', x: 56, y: 556, size: 12, bold: true }));
  lines.push(drawText({ text: 'Transaction ID', x: 310, y: 574, size: 9 }));
  lines.push(drawText({ text: payment.transactionId || 'N/A', x: 310, y: 556, size: 10, bold: true }));

  lines.push('0.96 0.97 0.98 rg 56 494 483 32 re f\n');
  lines.push('0 0 0 rg\n');
  lines.push(drawText({ text: 'Description', x: 68, y: 506, size: 9, bold: true }));
  lines.push(drawText({ text: 'Package', x: 310, y: 506, size: 9, bold: true }));
  lines.push(drawText({ text: 'Amount', x: 454, y: 506, size: 9, bold: true }));
  lines.push(drawText({ text: payment.courseId?.title || 'Course', x: 68, y: 466, size: 11 }));
  lines.push(drawText({ text: payment.packageId?.name || 'Standard', x: 310, y: 466, size: 11 }));
  lines.push(drawText({ text: `INR ${formatCurrency(payment.amount)}`, x: 454, y: 466, size: 11, bold: true }));
  lines.push('0.88 0.89 0.91 RG 56 448 483 0 l S\n');
  lines.push(drawText({ text: `Total: INR ${formatCurrency(payment.amount)}`, x: 360, y: 406, size: 18, bold: true }));
  lines.push(drawText({ text: 'This is a system-generated invoice.', x: 56, y: 92, size: 9 }));

  const stream = lines.join('');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}endstream`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'latin1');
};

export async function GET(req, { params }) {
  try {
    const authUser = getUserFromCookie();
    if (!authUser || authUser.role !== 'student') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { paymentId } = await params;
    await connectDB();

    const payment = await Payment.findOne({ _id: paymentId, userId: authUser.id })
      .populate('courseId', 'title')
      .populate('packageId', 'name gradeName')
      .lean();

    if (!payment) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    const settings = await Setting.find({ key: { $in: ['hp_theme', 'hp_contact'] } }).lean();
    const getSetting = (key, fallback = {}) => settings.find((setting) => setting.key === key)?.value || fallback;
    const theme = getSetting('hp_theme', {});
    const contact = getSetting('hp_contact', {});
    const invoiceNo = String(payment._id).slice(-8).toUpperCase();

    const pdf = buildInvoicePdf({ invoiceNo, theme, contact, payment });

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoiceNo}.pdf"`,
        'Cache-Control': 'no-store, private',
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Payment from '@/models/Payment';
import Enrollment from '@/models/Enrollment';
import Package from '@/models/Package';
import { buildEnrollmentIdentityFilter, buildEnrollmentLifecycleFields } from '@/lib/enrollmentLifecycle';
import { normalizeGradeName } from '@/lib/gradeUtils';
import { upsertStudentProfile } from '@/lib/studentProfile';

const pickFirst = (obj, keys) => {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && String(obj[key]).length > 0) {
      return obj[key];
    }
  }
  return '';
};

const normalizeStatus = (payload) => {
  const raw = String(
    pickFirst(payload, ['txnStatus', 'paymentStatus', 'status', 'responseCode', 'responseMessage']) || ''
  )
    .trim()
    .toLowerCase();

  if (!raw) return 'pending';
  if (['success', 'successful', 'paid', 's', 'y', 'r0000', 'r1000', '00'].includes(raw)) return 'success';
  if (raw.includes('success')) return 'success';
  if (raw.includes('fail') || raw.includes('cancel') || raw.includes('declin') || raw.includes('error')) return 'failed';
  return 'pending';
};

const parseBody = async (req) => {
  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return await req.json();
  }
  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    return Object.fromEntries(form.entries());
  }
  return {};
};

const handleCallback = async (req, payload) => {
  const paymentId = String(pickFirst(payload, ['addlParam1', 'paymentId', 'payment_id']) || '');
  const merchantTxnNo = String(
    pickFirst(payload, ['merchantTxnNo', 'merchantTxnID', 'merchant_transaction_id', 'orderId']) || ''
  );
  const status = normalizeStatus(payload);

  if (paymentId) {
    await dbConnect();
    const payment = await Payment.findById(paymentId);

    if (payment) {
      if (status === 'success') {
        payment.status = 'completed';
        payment.transactionId = merchantTxnNo || payment.transactionId;
        await payment.save();

        let packageDoc = null;
        if (payment.packageId) {
          packageDoc = await Package.findById(payment.packageId);
        }

        await Enrollment.findOneAndUpdate(
          buildEnrollmentIdentityFilter({
            userId: payment.userId,
            courseId: payment.courseId,
            packageId: payment.packageId || null,
          }),
          {
            userId: payment.userId,
            courseId: payment.courseId,
            batchId: payment.batchId || null,
            packageId: payment.packageId || null,
            gradeName: normalizeGradeName(payment.gradeName || packageDoc?.gradeName),
            preferredDays: payment.preferredDays || [],
            preferredTimes: payment.preferredTimes || [],
            paymentId: payment._id,
            ...buildEnrollmentLifecycleFields({
              paymentStatus: 'paid',
              status: 'active',
              packageDoc,
              packagePriceKey: payment.packagePriceKey || '',
              pricingOptionId: payment.pricingOptionId || null,
            }),
          },
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );

        await upsertStudentProfile({
          userId: payment.userId,
          studentFields: {
            time: Array.isArray(payment.preferredTimes) ? payment.preferredTimes.join(', ') : '',
            status: 'active',
          },
        });
      } else if (status === 'failed') {
        payment.status = 'failed';
        payment.transactionId = merchantTxnNo || payment.transactionId;
        await payment.save();
      }
    }
  }

  const redirectUrl = new URL('/student/my-courses', req.nextUrl.origin);
  redirectUrl.searchParams.set('gateway', 'icici');
  redirectUrl.searchParams.set('payment_status', status);
  if (paymentId) redirectUrl.searchParams.set('payment_id', paymentId);
  if (merchantTxnNo) redirectUrl.searchParams.set('merchant_txn_no', merchantTxnNo);

  return NextResponse.redirect(redirectUrl, { status: 302 });
};

export async function GET(req) {
  const payload = Object.fromEntries(req.nextUrl.searchParams.entries());
  return handleCallback(req, payload);
}

export async function POST(req) {
  const body = await parseBody(req);
  return handleCallback(req, body);
}

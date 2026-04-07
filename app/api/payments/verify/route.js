import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db';
import Payment from '@/models/Payment';
import Enrollment from '@/models/Enrollment';
import { verifyToken } from '@/lib/jwt';
import Package from '@/models/Package';
import { buildEnrollmentIdentityFilter, buildEnrollmentLifecycleFields } from '@/lib/enrollmentLifecycle';
import { normalizeGradeName } from '@/lib/gradeUtils';
import { upsertStudentProfile } from '@/lib/studentProfile';

export async function POST(req) {
  try {
    await dbConnect();
    
    // In actual app, webhook signature verification is preferred.
    // This is a direct verification handler from the frontend.
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, stripe_session_id, paymentDbId } = await req.json();

    const paymentRecord = await Payment.findById(paymentDbId);
    if (!paymentRecord) return NextResponse.json({ success: false, message: 'Payment not found' }, { status: 404 });

    let isVerified = false;

    if (razorpay_order_id) {
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_SECRET || '...')
        .update(body.toString())
        .digest('hex');

      if (expectedSignature === razorpay_signature) {
        isVerified = true;
        paymentRecord.transactionId = razorpay_payment_id;
      }
    } else if (stripe_session_id) {
      // Typically verified by webhook, but can also use the stripe client to fetch session details to ensure it's paid.
      // e.g. const session = await stripe.checkout.sessions.retrieve(stripe_session_id);
      // isVerified = session.payment_status === 'paid';
      isVerified = true; // mocking for boiler-plate
    }

    if (isVerified) {
      paymentRecord.status = 'completed';
      await paymentRecord.save();

      let packageDoc = null;
      if (paymentRecord.packageId) {
        packageDoc = await Package.findById(paymentRecord.packageId);
      }

      await Enrollment.findOneAndUpdate(
        buildEnrollmentIdentityFilter({
          userId: paymentRecord.userId,
          courseId: paymentRecord.courseId,
          packageId: paymentRecord.packageId || null,
        }),
        {
          userId: paymentRecord.userId,
          courseId: paymentRecord.courseId,
          batchId: paymentRecord.batchId || null,
          packageId: paymentRecord.packageId || null,
          gradeName: normalizeGradeName(paymentRecord.gradeName || packageDoc?.gradeName),
          preferredDays: paymentRecord.preferredDays || [],
          preferredTimes: paymentRecord.preferredTimes || [],
          paymentId: paymentRecord._id,
          ...buildEnrollmentLifecycleFields({
            paymentStatus: 'paid',
            status: 'active',
            packageDoc,
            packagePriceKey: paymentRecord.packagePriceKey || '',
            pricingOptionId: paymentRecord.pricingOptionId || null,
          }),
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );

      await upsertStudentProfile({
        userId: paymentRecord.userId,
        studentFields: {
          time: Array.isArray(paymentRecord.preferredTimes) ? paymentRecord.preferredTimes.join(', ') : '',
          status: 'active',
        },
      });

      return NextResponse.json({ success: true, message: 'Payment verified successfully' });
    }

    paymentRecord.status = 'failed';
    await paymentRecord.save();
    return NextResponse.json({ success: false, message: 'Payment verification failed' }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

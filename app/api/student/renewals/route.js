import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { razorpay } from '@/lib/razorpay';
import {
  buildIciciRedirectUrl,
  generateIciciMerchantTxnNo,
  getIciciResponseMessage,
  initiateIciciSaleWithFallback,
} from '@/lib/icici';
import connectDB from '@/lib/db';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';
import Payment from '@/models/Payment';
import Package from '@/models/Package';
import Setting from '@/models/Setting';
import User from '@/models/User';
import { getUserFromCookie } from '@/utils/auth';
import { resolvePackagePriceOptionById } from '@/lib/packagePricing';

export async function POST(req) {
  try {
    const authUser = getUserFromCookie();
    if (!authUser || authUser.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { enrollmentId } = await req.json();
    if (!enrollmentId) {
      return NextResponse.json({ success: false, message: 'Enrollment is required' }, { status: 400 });
    }

    await connectDB();

    const enrollment = await Enrollment.findOne({ _id: enrollmentId, userId: authUser.id }).lean();
    if (!enrollment) {
      return NextResponse.json({ success: false, message: 'Enrollment not found' }, { status: 404 });
    }

    if (!enrollment.packageId) {
      return NextResponse.json({ success: false, message: 'Only package enrollments can be renewed' }, { status: 400 });
    }

    const packageDoc = await Package.findById(enrollment.packageId).populate('course_id');
    if (!packageDoc) {
      return NextResponse.json({ success: false, message: 'Package not found' }, { status: 404 });
    }

    const selectedOption = resolvePackagePriceOptionById(packageDoc, enrollment.pricingOptionId);
    if (selectedOption?.paymentType !== 'quarterly') {
      return NextResponse.json({ success: false, message: 'Only quarterly packages can be renewed here' }, { status: 400 });
    }

    const courseId = enrollment.courseId || packageDoc.course_id?._id;
    const course = await Course.findById(courseId).select('title slug');
    if (!course) {
      return NextResponse.json({ success: false, message: 'Course not found' }, { status: 404 });
    }

    const gatewaySetting = await Setting.findOne({ key: 'payment_gateway' });
    const activeGateway = String(gatewaySetting?.value || 'stripe').toLowerCase();
    const amount = selectedOption.price;

    const paymentRecord = await Payment.create({
      userId: authUser.id,
      courseId,
      batchId: enrollment.batchId || null,
      packageId: packageDoc._id,
      schoolId: enrollment.schoolId || null,
      gradeName: enrollment.gradeName || packageDoc.gradeName || '',
      pricingOptionId: selectedOption?._id || enrollment.pricingOptionId || null,
      packagePriceKey: selectedOption?.key || '',
      preferredDays: enrollment.preferredDays || [],
      preferredTimes: enrollment.preferredTimes || [],
      amount,
      gateway: activeGateway,
      status: 'pending',
      transactionId: `renewal_${Date.now()}`,
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
    const productName = `${course.title} - ${packageDoc.name} Renewal`;

    if (activeGateway === 'stripe') {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'inr',
            product_data: { name: productName },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${baseUrl}/student/billing?payment_success=true&payment_id=${paymentRecord._id}`,
        cancel_url: `${baseUrl}/student/billing?payment_cancelled=true`,
        metadata: {
          paymentId: paymentRecord._id.toString(),
          renewalForEnrollmentId: enrollment._id.toString(),
        },
      });
      return NextResponse.json({ success: true, gateway: 'stripe', url: session.url });
    }

    if (activeGateway === 'razorpay') {
      const order = await razorpay.orders.create({
        amount: Math.round(amount * 100),
        currency: 'INR',
        receipt: paymentRecord._id.toString(),
        notes: {
          paymentId: paymentRecord._id.toString(),
          renewalForEnrollmentId: enrollment._id.toString(),
        },
      });

      paymentRecord.transactionId = order.id;
      await paymentRecord.save();

      return NextResponse.json({
        success: true,
        gateway: 'razorpay',
        order,
        key: process.env.RAZORPAY_KEY_ID,
        paymentDbId: paymentRecord._id,
      });
    }

    if (activeGateway === 'icici') {
      const currentUser = await User.findById(authUser.id).select('name email phone');
      const merchantTxnNo = generateIciciMerchantTxnNo('RN');
      const iciciPayloadInput = {
        merchantTxnNo,
        amount,
        customerName: currentUser?.name || 'Student',
        customerEmailID: currentUser?.email || process.env.ICICI_FALLBACK_EMAIL || 'no-reply@unikriti.local',
        customerMobileNo: currentUser?.phone || process.env.ICICI_FALLBACK_MOBILE || '9999999999',
        addlParam1: paymentRecord._id.toString(),
        addlParam2: authUser.id.toString(),
        returnURL: process.env.ICICI_RETURN_URL,
      };

      const { response: iciciResponse, hashMode } = await initiateIciciSaleWithFallback(iciciPayloadInput);
      const redirectUrl = buildIciciRedirectUrl(iciciResponse);

      if (!redirectUrl) {
        const responseMessage = getIciciResponseMessage(iciciResponse);
        throw new Error(responseMessage || 'ICICI response missing redirect URL');
      }

      paymentRecord.transactionId = merchantTxnNo;
      await paymentRecord.save();

      return NextResponse.json({
        success: true,
        gateway: 'icici',
        redirectUrl,
        merchantTxnNo,
        hashMode,
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid payment gateway' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

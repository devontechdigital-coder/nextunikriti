import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { razorpay } from '@/lib/razorpay';
import {
  buildIciciRedirectUrl,
  generateIciciMerchantTxnNo,
  getIciciResponseMessage,
  initiateIciciSaleWithFallback,
} from '@/lib/icici';
import dbConnect from '@/lib/db';
import Course from '@/models/Course';
import Setting from '@/models/Setting';
import Payment from '@/models/Payment';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';

export async function POST(req) {
  try {
    await dbConnect();

    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });

    const { courseId, couponCode } = await req.json();

    const course = await Course.findById(courseId);
    if (!course) return NextResponse.json({ success: false, message: 'Course not found' }, { status: 404 });

    // Handle price calculation (mock coupon logic for brevity)
    let finalPrice = course.price;
    if (couponCode) {
      // Validate coupon, reduce finalPrice. (Ignored for brevity)
    }

    // Determine gateway
    let activeGateway = 'stripe'; // Default
    const gatewaySetting = await Setting.findOne({ key: 'payment_gateway' });
    if (gatewaySetting) {
      activeGateway = String(gatewaySetting.value || '').toLowerCase();
    }

    const paymentRecord = await Payment.create({
      userId: decoded.id,
      courseId,
      amount: finalPrice,
      gateway: activeGateway,
      transactionId: `pending_${Math.random()}`
    });

    if (activeGateway === 'stripe') {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'inr',
            product_data: { name: course.title },
            unit_amount: finalPrice * 100, // in paise
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&payment_id=${paymentRecord._id}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/cancel`,
        metadata: { paymentId: paymentRecord._id.toString() }
      });
      return NextResponse.json({ success: true, gateway: 'stripe', id: session.id, url: session.url });
    }

    if (activeGateway === 'razorpay') {
      const options = {
        amount: finalPrice * 100, // paise
        currency: 'INR',
        receipt: paymentRecord._id.toString()
      };
      const order = await razorpay.orders.create(options);
      
      // Update Payment Record with Razorpay order id
      paymentRecord.transactionId = order.id;
      await paymentRecord.save();

      return NextResponse.json({ success: true, gateway: 'razorpay', order });
    }

    if (activeGateway === 'icici') {
      const currentUser = await User.findById(decoded.id).select('name email phone');

      const merchantTxnNo = generateIciciMerchantTxnNo('CHK');
      const iciciPayloadInput = {
        merchantTxnNo,
        amount: finalPrice,
        customerName: currentUser?.name || 'Student',
        customerEmailID: currentUser?.email || process.env.ICICI_FALLBACK_EMAIL || 'no-reply@unikriti.local',
        customerMobileNo: currentUser?.phone || process.env.ICICI_FALLBACK_MOBILE || '9999999999',
        addlParam1: paymentRecord._id.toString(),
        addlParam2: decoded.id.toString(),
      };

      const { response: iciciResponse, hashMode } = await initiateIciciSaleWithFallback(iciciPayloadInput);
      const redirectUrl = buildIciciRedirectUrl(iciciResponse);

      if (!redirectUrl) {
        const responseMessage = getIciciResponseMessage(iciciResponse);
        console.error('ICICI initiateSale response could not be converted to redirect URL:', {
          hashMode,
          iciciResponse,
        });
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
        iciciResponse,
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid Gateway' }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

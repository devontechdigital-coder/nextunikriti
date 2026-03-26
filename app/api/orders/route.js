import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { razorpay } from '@/lib/razorpay';
import dbConnect from '@/lib/db';
import Batch from '@/models/Batch';
import Payment from '@/models/Payment';
import Setting from '@/models/Setting';
import Enrollment from '@/models/Enrollment';
import { getUserFromCookie } from '@/utils/auth';

export async function POST(req) {
  try {
    await dbConnect();

    const user = getUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Please login first.' }, { status: 401 });
    }

    const { batch_id, package_id, payment_mode } = await req.json();
    
    let finalPrice = 0;
    let courseId = null;
    let name = '';
    let description = '';
    let courseSlugOrId = '';

    if (package_id) {
      const Package = (await import('@/models/Package')).default;
      const pkg = await Package.findById(package_id).populate('course_id');
      if (!pkg) {
        return NextResponse.json({ success: false, message: 'Package not found' }, { status: 404 });
      }
      finalPrice = pkg.price;
      courseId = pkg.course_id._id;
      courseSlugOrId = pkg.course_id.slug || pkg.course_id._id;
      name = `${pkg.course_id.title} - ${pkg.name}`;
      description = pkg.description || `Enrollment in ${pkg.name} package`;
    } else if (batch_id) {
      const batch = await Batch.findById(batch_id).populate('course_id');
      if (!batch) {
        return NextResponse.json({ success: false, message: 'Batch not found' }, { status: 404 });
      }
      if (batch.status !== 'active') {
        return NextResponse.json({ success: false, message: 'This batch is no longer active' }, { status: 400 });
      }
      finalPrice = batch.price || batch.course_id?.price || 0;
      courseId = batch.course_id._id;
      courseSlugOrId = batch.course_id.slug || batch.course_id._id;
      name = `${batch.course_id.title} - ${batch.batchName}`;
      description = `Batch starting ${batch.startDate ? new Date(batch.startDate).toLocaleDateString() : 'soon'}`;
    } else {
      return NextResponse.json({ success: false, message: 'Package ID or Batch ID is required' }, { status: 400 });
    }

    // --- Pay Later Flow ---
    if (payment_mode === 'pay_later') {
      const paymentRecord = await Payment.create({
        userId: user.id,
        courseId,
        batchId: batch_id || null,
        packageId: package_id || null,
        amount: finalPrice,
        gateway: 'pay_later',
        status: 'pending',
        transactionId: `pay_later_${Date.now()}`
      });

      // Create enrollment with pending status
      await Enrollment.findOneAndUpdate(
        { userId: user.id, courseId },
        {
          userId: user.id,
          courseId,
          packageId: package_id || null,
          batchId: batch_id || null,
          paymentId: paymentRecord._id,
          paymentStatus: 'pending',
          status: 'pending_payment'
        },
        { upsert: true, new: true }
      );

      return NextResponse.json({ success: true, gateway: 'pay_later' });
    }

    // --- Online Payment Flow ---
    // Determine gateway
    let activeGateway = 'stripe'; // Default
    const gatewaySetting = await Setting.findOne({ key: 'payment_gateway' });
    if (gatewaySetting) {
      activeGateway = gatewaySetting.value;
    }

    const paymentRecord = await Payment.create({
      userId: user.id,
      courseId,
      batchId: batch_id || null,
      packageId: package_id || null,
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
            product_data: { 
                name,
                description
            },
            unit_amount: Math.round(finalPrice * 100), // in paise
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/student/my-courses?payment_success=true&payment_id=${paymentRecord._id}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/courses/${courseSlugOrId}`,
        metadata: { 
            paymentId: paymentRecord._id.toString(),
            courseId: courseId.toString(),
            batchId: (batch_id || '').toString(),
            packageId: (package_id || '').toString(),
            userId: user.id.toString()
        }
      });
      return NextResponse.json({ success: true, gateway: 'stripe', id: session.id, url: session.url });
    }

    if (activeGateway === 'razorpay') {
      const options = {
        amount: Math.round(finalPrice * 100), // paise
        currency: 'INR',
        receipt: paymentRecord._id.toString(),
        notes: {
            batchId: (batch_id || '').toString(),
            packageId: (package_id || '').toString(),
            courseId: courseId.toString()
        }
      };
      const order = await razorpay.orders.create(options);
      
      // Update Payment Record with Razorpay order id
      paymentRecord.transactionId = order.id;
      await paymentRecord.save();

      return NextResponse.json({ success: true, gateway: 'razorpay', order, key: process.env.RAZORPAY_KEY_ID });
    }

    return NextResponse.json({ success: false, message: 'Invalid Gateway' }, { status: 400 });

  } catch (error) {
    console.error('Order Creation Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

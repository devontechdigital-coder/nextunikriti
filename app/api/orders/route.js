import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { stripe } from '@/lib/stripe';
import { razorpay } from '@/lib/razorpay';
import {
  buildIciciRedirectUrl,
  generateIciciMerchantTxnNo,
  getIciciResponseMessage,
  initiateIciciSaleWithFallback,
} from '@/lib/icici';
import dbConnect from '@/lib/db';
import '@/models/Course';
import Batch from '@/models/Batch';
import Payment from '@/models/Payment';
import Setting from '@/models/Setting';
import Enrollment from '@/models/Enrollment';
import School from '@/models/School';
import User from '@/models/User';
import Coupon from '@/models/Coupon';
import { getUserFromCookie } from '@/utils/auth';
import { resolvePackagePriceOption } from '@/lib/packagePricing';
import { buildEnrollmentIdentityFilter, buildEnrollmentLifecycleFields } from '@/lib/enrollmentLifecycle';
import { normalizeGradeName } from '@/lib/gradeUtils';
import { upsertStudentProfile } from '@/lib/studentProfile';
import { normalizeCouponCode, validateCouponForCheckout } from '@/lib/coupons';
import { sendEnrollmentConfirmation } from '@/lib/email';

const normalizeStringList = (value) => (
  Array.isArray(value)
    ? [...new Set(
        value
          .map((item) => String(item || '').trim())
          .filter(Boolean)
      )]
    : []
);

const normalizeModeLabel = (mode) => String(mode || 'Online').trim();

const buildSchoolSlotValue = (slot = {}) => `${String(slot.startTime || '').trim()} - ${String(slot.endTime || '').trim()}`;

export async function POST(req) {
  try {
    await dbConnect();

    const user = getUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Please login first.' }, { status: 401 });
    }

    const {
      batch_id,
      package_id,
      package_price_key,
      payment_mode,
      selected_grade_name,
      school_id,
      coupon_code,
      preferred_days,
      preferred_times,
      student_profile,
    } = await req.json();
    
    let finalPrice = 0;
    let courseId = null;
    let name = '';
    let description = '';
    let courseSlugOrId = '';
    let selectedPricingOption = null;
    let selectedPackageDoc = null;
    let enrollmentMode = '';
    let appliedCoupon = null;
    let selectedGradeName = normalizeGradeName(selected_grade_name);
    const selectedSchoolId = String(school_id || '').trim();
    const normalizedCouponCode = normalizeCouponCode(coupon_code);
    const preferredDays = normalizeStringList(preferred_days);
    const preferredTimes = normalizeStringList(preferred_times);

    if (package_id) {
      const Package = (await import('@/models/Package')).default;
      const pkg = await Package.findById(package_id).populate('course_id');
      if (!pkg) {
        return NextResponse.json({ success: false, message: 'Package not found' }, { status: 404 });
      }
      const selectedPackagePrice = resolvePackagePriceOption(pkg, package_price_key);
      selectedPricingOption = selectedPackagePrice;
      selectedPackageDoc = pkg;
      selectedGradeName = normalizeGradeName(selected_grade_name || pkg.gradeName);
      finalPrice = selectedPackagePrice.price;
      courseId = pkg.course_id._id;
      courseSlugOrId = pkg.course_id.slug || pkg.course_id._id;
      enrollmentMode = normalizeModeLabel(pkg.mode);
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
      enrollmentMode = normalizeModeLabel(batch.course_id?.mode);
      name = `${batch.course_id.title} - ${batch.batchName}`;
      description = `Batch starting ${batch.startDate ? new Date(batch.startDate).toLocaleDateString() : 'soon'}`;
    } else {
      return NextResponse.json({ success: false, message: 'Package ID or Batch ID is required' }, { status: 400 });
    }

    const requiresSchoolSelection = enrollmentMode.toLowerCase() !== 'online';
    let selectedSchool = null;

    if (selectedSchoolId) {
      if (!mongoose.Types.ObjectId.isValid(selectedSchoolId)) {
        return NextResponse.json({ success: false, message: 'Invalid school selected' }, { status: 400 });
      }

      selectedSchool = await School.findOne({ _id: selectedSchoolId, status: 'active' })
        .select('schoolName weeklySchedule');

      if (!selectedSchool) {
        return NextResponse.json({ success: false, message: 'Selected school is not available' }, { status: 404 });
      }
    }

    if (requiresSchoolSelection && !selectedSchool) {
      return NextResponse.json({ success: false, message: 'Please choose a school for this package' }, { status: 400 });
    }

    if (!preferredDays.length) {
      return NextResponse.json({ success: false, message: 'Please select at least one preferred day' }, { status: 400 });
    }

    if (!preferredTimes.length) {
      return NextResponse.json({ success: false, message: 'Please add at least one preferred time' }, { status: 400 });
    }

    if (normalizedCouponCode) {
      appliedCoupon = await Coupon.findOne({ code: normalizedCouponCode });
      const couponValidation = validateCouponForCheckout({
        coupon: appliedCoupon,
        courseId,
        packageId: package_id || null,
        amount: finalPrice,
      });

      if (!couponValidation.valid) {
        return NextResponse.json({ success: false, message: couponValidation.message }, { status: 400 });
      }

      finalPrice = couponValidation.finalAmount;
    }

    if (selectedSchool) {
      const scheduleByDay = new Map(
        (selectedSchool.weeklySchedule || [])
          .filter((entry) => entry?.dayOfWeek && entry?.isOpen)
          .map((entry) => [entry.dayOfWeek, entry])
      );

      const hasInvalidDay = preferredDays.some((day) => !scheduleByDay.has(day));
      if (hasInvalidDay) {
        return NextResponse.json({ success: false, message: 'One or more selected days are not available for this school' }, { status: 400 });
      }

      const validSlotValues = new Set();
      preferredDays.forEach((day) => {
        const daySchedule = scheduleByDay.get(day);
        const normalizedDaySlots = Array.isArray(daySchedule?.slots) && daySchedule.slots.length
          ? daySchedule.slots
          : ((daySchedule?.startTime || daySchedule?.endTime)
              ? [{ startTime: daySchedule.startTime || '', endTime: daySchedule.endTime || '' }]
              : []);

        normalizedDaySlots
          .map((slot) => buildSchoolSlotValue(slot))
          .filter((slotValue) => slotValue && slotValue !== '-')
          .forEach((slotValue) => validSlotValues.add(slotValue));
      });

      const hasInvalidTime = preferredTimes.some((slotValue) => !validSlotValues.has(slotValue));
      if (hasInvalidTime) {
        return NextResponse.json({ success: false, message: 'One or more selected times are not available for this school' }, { status: 400 });
      }
    }

    await upsertStudentProfile({
      userId: user.id,
      studentFields: {
        ...(student_profile || {}),
        enrolledFor: student_profile?.enrolledFor || name,
        time: student_profile?.time || preferredTimes.join(', '),
        location: student_profile?.location || selectedSchool?.schoolName || enrollmentMode || undefined,
      },
      schoolId: selectedSchool?._id,
    });

    // --- Pay Later Flow ---
    if (payment_mode === 'pay_later') {
      const paymentRecord = await Payment.create({
        userId: user.id,
        courseId,
        batchId: batch_id || null,
        packageId: package_id || null,
        schoolId: selectedSchool?._id || null,
        gradeName: selectedGradeName,
        pricingOptionId: selectedPricingOption?._id || null,
        packagePriceKey: selectedPricingOption?.key || package_price_key || '',
        couponApplied: appliedCoupon?._id || null,
        preferredDays,
        preferredTimes,
        amount: finalPrice,
        gateway: 'pay_later',
        status: 'pending',
        transactionId: `pay_later_${Date.now()}`
      });

      await Enrollment.findOneAndUpdate(
        buildEnrollmentIdentityFilter({ userId: user.id, courseId, packageId: package_id || null }),
        {
          userId: user.id,
          courseId,
          packageId: package_id || null,
          batchId: batch_id || null,
          schoolId: selectedSchool?._id || null,
          gradeName: selectedGradeName,
          preferredDays,
          preferredTimes,
          paymentId: paymentRecord._id,
          ...buildEnrollmentLifecycleFields({
            paymentStatus: 'pending',
            status: 'pending_payment',
            packageDoc: selectedPackageDoc,
            packagePriceKey: selectedPricingOption?.key || package_price_key || '',
            pricingOptionId: selectedPricingOption?._id || null,
          }),
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );

      const currentUser = await User.findById(user.id).select('name email phone');
      await Promise.all([
        sendEnrollmentConfirmation({
          payment: paymentRecord,
          user: currentUser,
          course: { title: name.replace(` - ${selectedPackageDoc?.name || ''}`, '') },
          packageDoc: selectedPackageDoc,
        }),
        sendEnrollmentConfirmation({
          payment: paymentRecord,
          user: currentUser,
          course: { title: name.replace(` - ${selectedPackageDoc?.name || ''}`, '') },
          packageDoc: selectedPackageDoc,
          admin: true,
        }),
      ]);

      return NextResponse.json({ success: true, gateway: 'pay_later' });
    }

    // --- Online Payment Flow ---
    // Determine gateway
    let activeGateway = 'stripe'; // Default
    const gatewaySetting = await Setting.findOne({ key: 'payment_gateway' });
    if (gatewaySetting) {
      activeGateway = String(gatewaySetting.value || '').toLowerCase();
    }

    const paymentRecord = await Payment.create({
      userId: user.id,
      courseId,
      batchId: batch_id || null,
      packageId: package_id || null,
      schoolId: selectedSchool?._id || null,
      gradeName: selectedGradeName,
      pricingOptionId: selectedPricingOption?._id || null,
      packagePriceKey: selectedPricingOption?.key || package_price_key || '',
      couponApplied: appliedCoupon?._id || null,
      preferredDays,
      preferredTimes,
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
            userId: user.id.toString(),
            schoolId: (selectedSchool?._id || '').toString(),
            couponCode: normalizedCouponCode,
            gradeName: selectedGradeName,
            preferredDays: preferredDays.join(', '),
            preferredTimes: preferredTimes.join(', ')
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
            courseId: courseId.toString(),
            schoolId: (selectedSchool?._id || '').toString(),
            couponCode: normalizedCouponCode,
        }
      };
      const order = await razorpay.orders.create(options);
      
      // Update Payment Record with Razorpay order id
      paymentRecord.transactionId = order.id;
      await paymentRecord.save();

      return NextResponse.json({ success: true, gateway: 'razorpay', order, key: process.env.RAZORPAY_KEY_ID });
    }

    if (activeGateway === 'icici') {
      const currentUser = await User.findById(user.id).select('name email phone');

      const merchantTxnNo = generateIciciMerchantTxnNo('UN');
      const iciciPayloadInput = {
        merchantTxnNo,
        amount: finalPrice,
        customerName: currentUser?.name || 'Student',
        customerEmailID: currentUser?.email || process.env.ICICI_FALLBACK_EMAIL || 'no-reply@unikriti.local',
        customerMobileNo: currentUser?.phone || process.env.ICICI_FALLBACK_MOBILE || '9999999999',
        addlParam1: paymentRecord._id.toString(),
        addlParam2: user.id.toString(),
        returnURL: process.env.ICICI_RETURN_URL,
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


      console.log('ICICI Payment Initiation Success:', {
         merchantTxnNo,
         hashMode,
         iciciResponse,
      });
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
    console.error('Order Creation Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

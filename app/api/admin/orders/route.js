import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Enrollment from '@/models/Enrollment';
import User from '@/models/User';
import Course from '@/models/Course';
import Package from '@/models/Package';
import Payment from '@/models/Payment';
import { getUserFromCookie } from '@/utils/auth';
import { getPackageDisplayPrice, resolvePackagePriceOption, resolvePackagePriceOptionById } from '@/lib/packagePricing';
import { buildEnrollmentIdentityFilter, buildEnrollmentLifecycleFields, findPreferredEnrollmentForCourse } from '@/lib/enrollmentLifecycle';
import { normalizeGradeName } from '@/lib/gradeUtils';

// GET /api/admin/orders — fetch all payment/order records
export async function GET(req) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const payments = await Payment.find({})
      .populate('userId', 'name email phone')
      .populate('courseId', 'title thumbnail')
      .populate('packageId', 'name pricingOptions gradeName')
      .populate('schoolId', 'schoolName city state')
      .sort({ createdAt: -1 });

    const data = await Promise.all(payments.map(async (payment) => {
      const enrollment = await Enrollment.findOne({ paymentId: payment._id }).lean()
        || await Enrollment.findOne(findPreferredEnrollmentForCourse({ userId: payment.userId?._id || payment.userId, courseId: payment.courseId?._id || payment.courseId }))
          .sort({ updatedAt: -1 })
          .lean();

      const plainPayment = payment.toObject();
      if (plainPayment.packageId) {
        const selectedOption = resolvePackagePriceOptionById(plainPayment.packageId, plainPayment.pricingOptionId || enrollment?.pricingOptionId);
        plainPayment.packageId.displayPrice = selectedOption.price;
        plainPayment.packageId.selectedOptionLabel = selectedOption.label;
      }

      return {
        ...plainPayment,
        enrollmentId: enrollment?._id || null,
        schoolId: plainPayment.schoolId || enrollment?.schoolId || null,
        gradeName: normalizeGradeName(enrollment?.gradeName || plainPayment.gradeName || plainPayment.packageId?.gradeName),
        paymentStatus: plainPayment.status === 'completed' ? 'paid' : plainPayment.status,
        status: enrollment?.status || (plainPayment.status === 'completed' ? 'active' : 'pending_payment'),
          startDate: enrollment?.startDate || null,
        endDate: enrollment?.endDate || null
      };
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin/orders — create custom enrollment/payment from admin
export async function POST(req) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { userId, courseId, packageId, packagePriceKey, paymentMode = 'pay_later' } = await req.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Student is required' }, { status: 400 });
    }

    if (!packageId && !courseId) {
      return NextResponse.json({ success: false, error: 'Course or package is required' }, { status: 400 });
    }

    const targetUser = await User.findById(userId).select('name email phone role');
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'Student user not found' }, { status: 404 });
    }

    let resolvedCourseId = courseId || null;
    let resolvedPackageId = packageId || null;
    let amount = 0;
    let packageDoc = null;
    let selectedOption = null;
    let gradeName = '';

    if (packageId) {
      const pkg = await Package.findById(packageId).populate('course_id', 'title price');
      if (!pkg) {
        return NextResponse.json({ success: false, error: 'Package not found' }, { status: 404 });
      }

      packageDoc = pkg;
      selectedOption = resolvePackagePriceOption(pkg, packagePriceKey);
      resolvedCourseId = pkg.course_id?._id?.toString();
      resolvedPackageId = pkg._id.toString();
      amount = selectedOption.price;
      gradeName = normalizeGradeName(pkg.gradeName);
    } else {
      const course = await Course.findById(courseId).select('title price');
      if (!course) {
        return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
      }

      resolvedCourseId = course._id.toString();
      amount = Number(course.price || 0);
    }

    const isManualPaid = paymentMode === 'manual_paid';
    const paymentRecord = await Payment.create({
      userId,
      courseId: resolvedCourseId,
      packageId: resolvedPackageId,
      gradeName,
      pricingOptionId: selectedOption?._id || null,
      packagePriceKey: selectedOption?.key || packagePriceKey || '',
      amount,
      gateway: isManualPaid ? 'admin_manual' : 'pay_later',
      status: isManualPaid ? 'completed' : 'pending',
      transactionId: isManualPaid
        ? `admin_manual_${Date.now()}`
        : `admin_pay_later_${Date.now()}`
    });

    const enrollment = await Enrollment.findOneAndUpdate(
      buildEnrollmentIdentityFilter({ userId, courseId: resolvedCourseId, packageId: resolvedPackageId || null }),
      {
        userId,
        courseId: resolvedCourseId,
        packageId: resolvedPackageId,
        gradeName,
        paymentId: paymentRecord._id,
        ...buildEnrollmentLifecycleFields({
          paymentStatus: isManualPaid ? 'paid' : 'pending',
          status: isManualPaid ? 'active' : 'pending_payment',
          packageDoc,
          packagePriceKey: selectedOption?.key || packagePriceKey || '',
          pricingOptionId: selectedOption?._id || null,
        }),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
      .populate('userId', 'name email phone')
      .populate('courseId', 'title thumbnail')
      .populate('packageId', 'name pricingOptions gradeName')
      .populate('paymentId');

    const plainEnrollment = enrollment.toObject();
    if (plainEnrollment.packageId) {
      const resolvedOption = resolvePackagePriceOptionById(plainEnrollment.packageId, plainEnrollment.pricingOptionId);
      plainEnrollment.packageId.displayPrice = resolvedOption.price;
      plainEnrollment.packageId.selectedOptionLabel = resolvedOption.label;
    }
    plainEnrollment.gradeName = normalizeGradeName(plainEnrollment.gradeName || plainEnrollment.packageId?.gradeName);

    return NextResponse.json({
      success: true,
      message: 'Custom order created successfully',
      data: plainEnrollment
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH /api/admin/orders — update enrollment/payment status
export async function PATCH(req) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, action } = await req.json();
    if (!orderId || !action) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    await connectDB();
    const payment = await Payment.findById(orderId);
    if (!payment) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });

    let enrollment = await Enrollment.findOne({ paymentId: payment._id });
    if (!enrollment) {
      enrollment = await Enrollment.findOne(findPreferredEnrollmentForCourse({ userId: payment.userId, courseId: payment.courseId }))
        .sort({ updatedAt: -1 });
    }

    if (action === 'approve') {
       payment.status = 'completed';
    } else if (action === 'mark_paid') {
       payment.status = 'completed';
    } else if (action === 'reject') {
       payment.status = 'failed';
    }

    await payment.save();

    if (!enrollment) {
      let packageDoc = null;
      if (payment.packageId) {
        packageDoc = await Package.findById(payment.packageId);
      }

      enrollment = await Enrollment.create({
        userId: payment.userId,
        courseId: payment.courseId,
        batchId: payment.batchId || null,
        packageId: payment.packageId || null,
        gradeName: normalizeGradeName(payment.gradeName || packageDoc?.gradeName),
        paymentId: payment._id,
        ...buildEnrollmentLifecycleFields({
          paymentStatus: payment.status === 'completed' ? 'paid' : 'pending',
          status: payment.status === 'completed' ? 'active' : action === 'reject' ? 'suspended' : 'pending_payment',
          packageDoc,
          packagePriceKey: payment.packagePriceKey || '',
          pricingOptionId: payment.pricingOptionId || null,
        }),
      });
    } else {
      enrollment.paymentId = payment._id;
      enrollment.gradeName = normalizeGradeName(enrollment.gradeName || payment.gradeName);
      enrollment.paymentStatus = payment.status === 'completed' ? 'paid' : 'pending';
      enrollment.status = action === 'reject' ? 'suspended' : (payment.status === 'completed' ? 'active' : 'pending_payment');
    }

    if (enrollment.status === 'active' && !enrollment.startDate) {
      let packageDoc = null;
      if (enrollment.packageId) {
        packageDoc = await Package.findById(enrollment.packageId);
      }
      Object.assign(
        enrollment,
        buildEnrollmentLifecycleFields({
          paymentStatus: enrollment.paymentStatus,
          status: enrollment.status,
          packageDoc,
          pricingOptionId: enrollment.pricingOptionId || null,
        })
      );
      enrollment.renewalCount = enrollment.renewalCount || 0;
    }

    await enrollment.save();
    return NextResponse.json({ success: true, data: { payment, enrollment } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

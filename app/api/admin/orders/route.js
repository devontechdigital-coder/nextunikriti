import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Enrollment from '@/models/Enrollment';
import User from '@/models/User';
import Course from '@/models/Course';
import Package from '@/models/Package';
import Payment from '@/models/Payment';
import { getUserFromCookie } from '@/utils/auth';

// GET /api/admin/orders — fetch all enrollments with populated details
export async function GET(req) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // We fetch all Enrollments as they represent the primary purchase intent
    const enrollments = await Enrollment.find({})
      .populate('userId', 'name email phone')
      .populate('courseId', 'title thumbnail')
      .populate('packageId', 'name price')
      .populate('paymentId')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: enrollments });
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

    const { userId, courseId, packageId, paymentMode = 'pay_later' } = await req.json();

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

    if (packageId) {
      const pkg = await Package.findById(packageId).populate('course_id', 'title price');
      if (!pkg) {
        return NextResponse.json({ success: false, error: 'Package not found' }, { status: 404 });
      }

      resolvedCourseId = pkg.course_id?._id?.toString();
      resolvedPackageId = pkg._id.toString();
      amount = Number(pkg.price || 0);
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
      amount,
      gateway: isManualPaid ? 'admin_manual' : 'pay_later',
      status: isManualPaid ? 'completed' : 'pending',
      transactionId: isManualPaid
        ? `admin_manual_${Date.now()}`
        : `admin_pay_later_${Date.now()}`
    });

    const enrollment = await Enrollment.findOneAndUpdate(
      { userId, courseId: resolvedCourseId },
      {
        userId,
        courseId: resolvedCourseId,
        packageId: resolvedPackageId,
        paymentId: paymentRecord._id,
        paymentStatus: isManualPaid ? 'paid' : 'pending',
        status: isManualPaid ? 'active' : 'pending_payment'
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
      .populate('userId', 'name email phone')
      .populate('courseId', 'title thumbnail')
      .populate('packageId', 'name price')
      .populate('paymentId');

    return NextResponse.json({
      success: true,
      message: 'Custom order created successfully',
      data: enrollment
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

    const { enrollmentId, action } = await req.json();
    if (!enrollmentId || !action) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    await connectDB();
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) return NextResponse.json({ success: false, error: 'Enrollment not found' }, { status: 404 });

    if (action === 'approve') {
       // Mark as active and paid
       enrollment.status = 'active';
       enrollment.paymentStatus = 'paid';
       if (enrollment.paymentId) {
         await Payment.findByIdAndUpdate(enrollment.paymentId, { status: 'completed' });
       }
    } else if (action === 'mark_paid') {
       enrollment.paymentStatus = 'paid';
       if (enrollment.paymentId) {
         await Payment.findByIdAndUpdate(enrollment.paymentId, { status: 'completed' });
       }
    } else if (action === 'reject') {
       enrollment.status = 'suspended';
       if (enrollment.paymentId) {
         await Payment.findByIdAndUpdate(enrollment.paymentId, { status: 'failed' });
       }
    }

    await enrollment.save();
    return NextResponse.json({ success: true, data: enrollment });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

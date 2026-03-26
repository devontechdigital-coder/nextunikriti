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

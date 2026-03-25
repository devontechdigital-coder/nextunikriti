import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Course from '@/models/Course';
import Payment from '@/models/Payment';
import { getUserFromCookie } from '@/utils/auth';

export async function GET(req, { params }) {
  try {
    const userArr = getUserFromCookie();
    if (!userArr || userArr.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    await connectDB();

    // 1. Get instructor's courses
    const courses = await Course.find({ course_creator: id });
    const courseIds = courses.map(c => c._id);

    // 2. Sum earnings from payments for these courses
    const payments = await Payment.find({ 
      courseId: { $in: courseIds }, 
      status: 'completed' 
    });

    const totalEarnings = payments.reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({
      success: true,
      data: {
        courseCount: courses.length,
        totalEarnings,
        payoutEnabled: true // Placeholder logic
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

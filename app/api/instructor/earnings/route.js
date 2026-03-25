import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Payment from '@/models/Payment';
import Payout from '@/models/Payout';
import Course from '@/models/Course';
import { getUserFromCookie } from '@/utils/auth';

export async function GET(req) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'instructor') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const courses = await Course.find({ course_creator: user.id });
    const courseIds = courses.map(c => c._id);

    // Get all successful payments for instructor's courses
    const sales = await Payment.find({ courseId: { $in: courseIds }, status: 'completed' })
      .populate('userId', 'name email')
      .populate('courseId', 'title')
      .sort({ createdAt: -1 });

    const totalRevenue = sales.reduce((acc, curr) => acc + curr.amount, 0);

    // Get completed payouts
    const payouts = await Payout.find({ instructorId: user.id }).sort({ createdAt: -1 });
    const totalWithdrawn = payouts.filter(p => p.status === 'completed')
                                 .reduce((acc, curr) => acc + curr.amount, 0);

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        totalWithdrawn,
        balance: totalRevenue - totalWithdrawn,
        sales,
        payoutHistory: payouts
      }
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Payout from '@/models/Payout';
import Payment from '@/models/Payment';
import Course from '@/models/Course';
import { getUserFromCookie } from '@/utils/auth';

export async function POST(req) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'instructor') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, paymentMethod } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 });
    }

    await connectDB();

    // Verify balance
    const courses = await Course.find({ course_creator: user.id });
    const courseIds = courses.map(c => c._id);
    const sales = await Payment.find({ courseId: { $in: courseIds }, status: 'completed' });
    const totalRevenue = sales.reduce((acc, curr) => acc + curr.amount, 0);
    
    const payouts = await Payout.find({ instructorId: user.id, status: { $in: ['pending', 'processing', 'completed'] } });
    const alreadyRequested = payouts.reduce((acc, curr) => acc + curr.amount, 0);

    const balance = totalRevenue - alreadyRequested;

    if (amount > balance) {
      return NextResponse.json({ success: false, error: 'Insufficient balance' }, { status: 400 });
    }

    const payout = await Payout.create({
      instructorId: user.id,
      amount,
      paymentMethod,
      status: 'pending'
    });

    return NextResponse.json({ success: true, data: payout }, { status: 201 });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

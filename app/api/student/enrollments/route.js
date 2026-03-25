import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Enrollment from '@/models/Enrollment';
import { getUserFromCookie } from '@/utils/auth';

export async function GET(req) {
  try {
    const user = getUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const enrollments = await Enrollment.find({ userId: user.id })
      .populate('courseId', 'title thumbnail category instructor')
      .populate('packageId', 'name')
      .sort({ updatedAt: -1 });

    return NextResponse.json({ success: true, data: enrollments }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

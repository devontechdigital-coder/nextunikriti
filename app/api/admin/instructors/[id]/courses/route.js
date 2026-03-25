import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Course from '@/models/Course';
import { getUserFromCookie } from '@/utils/auth';

export async function GET(req, { params }) {
  try {
    const userArr = getUserFromCookie();
    if (!userArr || userArr.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    await connectDB();

    const courses = await Course.find({ course_creator: id }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: courses
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

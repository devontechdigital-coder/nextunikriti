import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Section from '@/models/Section';
import Course from '@/models/Course';
import { getUserFromCookie } from '@/utils/auth';

export async function GET(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'instructor') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = params;

    await connectDB();
    
    // Verify course belongs to instructor
    const course = await Course.findOne({ _id: courseId, instructor: user.id });
    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found or unauthorized' }, { status: 404 });
    }

    const sections = await Section.find({ courseId }).sort({ order: 1 });
    return NextResponse.json({ success: true, data: sections });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'instructor') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = params;
    const { title, order } = await req.json();

    await connectDB();

    // Verify course belongs to instructor
    const course = await Course.findOne({ _id: courseId, instructor: user.id });
    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found or unauthorized' }, { status: 404 });
    }

    const section = await Section.create({
      courseId,
      title,
      order: order ?? 0
    });

    return NextResponse.json({ success: true, data: section });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

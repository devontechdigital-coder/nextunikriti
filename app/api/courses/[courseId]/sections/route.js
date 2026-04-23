import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Course from '@/models/Course';
import Section from '@/models/Section';
import { getUserFromCookie } from '@/utils/auth';

// Create a section under a specific course
export async function POST(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role === 'student') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });

    await connectDB();
    const course = await Course.findById(params.courseId);
    
    if (!course) return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });

    // Validate ownership
    const ownerId = (course.course_creator || course.instructor)?.toString();
    if (ownerId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Cannot add sections to this course' }, { status: 403 });
    }

    const { title } = await req.json();
    if(!title) return NextResponse.json({ success: false, error: 'Title required' }, { status: 400 });

    // Find highest order to append to the bottom
    const existingSections = await Section.find({ courseId: course._id }).sort({ order: -1 }).limit(1);
    const nextOrder = existingSections.length > 0 ? existingSections[0].order + 1 : 0;

    const section = await Section.create({
      courseId: course._id,
      title,
      order: nextOrder
    });

    return NextResponse.json({ success: true, data: section }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Get all sections for a course
export async function GET(req, { params }) {
  try {
    await connectDB();
    const sections = await Section.find({ courseId: params.courseId }).sort({ order: 1 });
    return NextResponse.json({ success: true, data: sections }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

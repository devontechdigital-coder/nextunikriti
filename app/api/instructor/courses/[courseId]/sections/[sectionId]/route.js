import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Section from '@/models/Section';
import Course from '@/models/Course';
import { getUserFromCookie } from '@/utils/auth';

export async function PUT(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'instructor') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId, sectionId } = params;
    const { title } = await req.json();

    await connectDB();
    
    // Verify course belongs to instructor
    const course = await Course.findOne({
      _id: courseId,
      $or: [{ course_creator: user.id }, { instructor: user.id }]
    });
    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found or unauthorized' }, { status: 404 });
    }

    const section = await Section.findOneAndUpdate(
      { _id: sectionId, courseId },
      { title },
      { new: true, runValidators: true }
    );

    if (!section) {
      return NextResponse.json({ success: false, error: 'Section not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: section });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'instructor') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId, sectionId } = params;

    await connectDB();
    
    // Verify course belongs to instructor
    const course = await Course.findOne({
      _id: courseId,
      $or: [{ course_creator: user.id }, { instructor: user.id }]
    });
    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found or unauthorized' }, { status: 404 });
    }

    const section = await Section.findOneAndDelete({ _id: sectionId, courseId });

    if (!section) {
      return NextResponse.json({ success: false, error: 'Section not found' }, { status: 404 });
    }

    // Optional: Delete lessons under this section too, but keeping it simple for now or maybe it's done via mongoose hooks

    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

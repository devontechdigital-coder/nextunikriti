import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Section from '@/models/Section';
import Course from '@/models/Course';
import { getUserFromCookie } from '@/utils/auth';
import mongoose from 'mongoose';

export async function PUT(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'instructor') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { title, order } = await req.json();

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid Section ID' }, { status: 400 });
    }

    await connectDB();
    
    const section = await Section.findById(id);
    if (!section) {
      return NextResponse.json({ success: false, error: 'Section not found' }, { status: 404 });
    }

    // Verify course belongs to instructor
    const course = await Course.findOne({
      _id: section.courseId,
      $or: [{ course_creator: user.id }, { instructor: user.id }]
    });
    if (!course) {
      return NextResponse.json({ success: false, error: 'Unauthorized to edit this section' }, { status: 403 });
    }

    if (title !== undefined) section.title = title;
    if (order !== undefined) section.order = order;

    await section.save();

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

    const { id } = params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid Section ID' }, { status: 400 });
    }

    await connectDB();
    
    const section = await Section.findById(id);
    if (!section) {
      return NextResponse.json({ success: false, error: 'Section not found' }, { status: 404 });
    }

    // Verify course belongs to instructor
    const course = await Course.findOne({
      _id: section.courseId,
      $or: [{ course_creator: user.id }, { instructor: user.id }]
    });
    if (!course) {
      return NextResponse.json({ success: false, error: 'Unauthorized to delete this section' }, { status: 403 });
    }

    await Section.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Section deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

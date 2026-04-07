import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Course from '@/models/Course';
import Section from '@/models/Section';
import Lesson from '@/models/Lesson';
import { getUserFromCookie } from '@/utils/auth';

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { courseId } = params;
    
    let course;
    if (mongoose.Types.ObjectId.isValid(courseId)) {
      course = await Course.findById(courseId);
    }

    if (!course) {
      course = await Course.findOne({ slug: courseId });
    }

    if (course) {
      course = await course.populate('course_creator', 'name avatar')
      course = await course.populate('instrument_id', 'name')
      course = await course.populate('level_id', 'levelName grades');
    }
    
    if (!course) return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });

    // Fetch hierarchical sections and their corresponding lessons
    const sections = await Section.find({ courseId: course._id }).sort({ order: 1 }).lean();
    for (const section of sections) {
        section.lessons = await Lesson.find({ sectionId: section._id }).sort({ order: 1 }).lean();
    }

    return NextResponse.json({ success: true, data: { ...course.toObject(), sections } }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role === 'student') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();
    const course = await Course.findById(params.courseId);
    if (!course) return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    
    // Auth Check: Is this instructor the owner or an admin?
    if (course.course_creator?.toString() !== user.id && user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized to edit this course' }, { status: 403 });
    }

    const body = await req.json();
    const updatedCourse = await Course.findByIdAndUpdate(params.courseId, body, { new: true, runValidators: true });
    
    return NextResponse.json({ success: true, data: updatedCourse }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role === 'student') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });

    await connectDB();
    const course = await Course.findById(params.courseId);
    if (!course) return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });

    if (course.course_creator?.toString() !== user.id && user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized to delete this course' }, { status: 403 });
    }

    // Cascade delete cascading sections -> lessons (simplified for now to just Course)
    // A robust app might recursively find all Section IDs and delete them.
    await Course.findByIdAndDelete(params.courseId);
    
    // Cleanup sections associated with course
    const sections = await Section.find({ courseId: params.courseId });
    for(const sec of sections) {
        await Lesson.deleteMany({ sectionId: sec._id });
        await sec.deleteOne();
    }

    return NextResponse.json({ success: true, data: {} }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

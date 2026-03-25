import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Section from '@/models/Section';
import Course from '@/models/Course';
import Lesson from '@/models/Lesson';
import { getUserFromCookie } from '@/utils/auth';

const authorizeSectionEdit = async (sectionId) => {
    const user = getUserFromCookie();
    if (!user || user.role === 'student') return null;

    const section = await Section.findById(sectionId);
    if (!section) return null;

    const course = await Course.findById(section.courseId);
    if (!course || (course.instructor.toString() !== user.id && user.role !== 'admin')) {
        return null; // Unauthorized or orphaned
    }
    return section;
};

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const section = await authorizeSectionEdit(params.sectionId);
    if (!section) return NextResponse.json({ success: false, error: 'Unauthorized or not found' }, { status: 403 });

    const body = await req.json();
    const updated = await Section.findByIdAndUpdate(params.sectionId, { title: body.title, order: body.order }, { new: true, runValidators: true });
    
    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const section = await authorizeSectionEdit(params.sectionId);
    if (!section) return NextResponse.json({ success: false, error: 'Unauthorized or not found' }, { status: 403 });

    // Cascade delete lessons
    await Lesson.deleteMany({ sectionId: section._id });
    await section.deleteOne();

    return NextResponse.json({ success: true, data: {} }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

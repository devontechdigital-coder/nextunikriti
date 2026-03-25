import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Course from '@/models/Course';
import Section from '@/models/Section';
import Lesson from '@/models/Lesson';
import { getUserFromCookie } from '@/utils/auth';

const authorizeLessonEdit = async (sectionId) => {
    const user = getUserFromCookie();
    if (!user || user.role === 'student') return null;

    const section = await Section.findById(sectionId);
    if (!section) return null;

    const course = await Course.findById(section.courseId);
    if (!course || (course.instructor.toString() !== user.id && user.role !== 'admin')) {
        return null;
    }
    return section;
};

// Create a new lesson inside a section
export async function POST(req, { params }) {
  try {
    await connectDB();
    const section = await authorizeLessonEdit(params.sectionId);
    if (!section) return NextResponse.json({ success: false, error: 'Unauthorized or not found' }, { status: 403 });

    const body = await req.json();
    if(!body.title) return NextResponse.json({ success: false, error: 'Title required' }, { status: 400 });

    const existingLessons = await Lesson.find({ sectionId: section._id }).sort({ order: -1 }).limit(1);
    const nextOrder = existingLessons.length > 0 ? existingLessons[0].order + 1 : 0;

    const lesson = await Lesson.create({
      sectionId: section._id,
      title: body.title,
      order: nextOrder,
      videoUrl: body.videoUrl || '',
      resources: body.resources || [],
      duration: body.duration || 0
    });

    return NextResponse.json({ success: true, data: lesson }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Get all lessons for a section
export async function GET(req, { params }) {
  try {
    await connectDB();
    const lessons = await Lesson.find({ sectionId: params.sectionId }).sort({ order: 1 });
    return NextResponse.json({ success: true, data: lessons }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

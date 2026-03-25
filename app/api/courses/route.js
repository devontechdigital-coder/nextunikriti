import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Course from '@/models/Course';
import { getUserFromCookie } from '@/utils/auth';

// Fetch all courses (public with filters or instructor-specific)
export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const filter = {};

    const categoryId = searchParams.get('categoryId');
    if (categoryId) {
      filter.categoryIds = categoryId;
    }

    // For public courses, we only show published and approved. 
    // If requested by an instructor, we show their courses.
    const user = getUserFromCookie();
    if (searchParams.get('instructor') === 'true' && user && ['admin', 'instructor'].includes(user.role)) {
       filter.course_creator = user.id;
    } else {
       filter.isPublished = true;
       filter.moderationStatus = 'approved';
    }

    const courses = await Course.find(filter)
      .populate('course_creator', 'name avatar')
      .populate('instrument_id', 'name')
      .populate('level_id', 'levelName')
      .select('title thumbnail price instrument_id level_id course_creator categoryIds shortDescription mode duration certification faq');

    return NextResponse.json({ success: true, data: courses }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Create a new course (Public-accessible API usually used by creators)
export async function POST(req) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role === 'student') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    await connectDB();
    
    body.course_creator = user.id; // Force creator to be the authenticated user
    
    const course = await Course.create(body);
    return NextResponse.json({ success: true, data: course }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

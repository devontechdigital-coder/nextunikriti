import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Enrollment from '@/models/Enrollment';
import Section from '@/models/Section';
import Lesson from '@/models/Lesson';
import { getUserFromCookie } from '@/utils/auth';

// GET /api/student/progress?courseId=XYZ — Returns progress & metadata for a specific enrollment
export async function GET(req) {
  try {
    const user = getUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) return NextResponse.json({ success: false, error: 'Course ID required' }, { status: 400 });

    await connectDB();
    
    // Find enrollment
    const enrollment = await Enrollment.findOne({ 
        userId: user.id, 
        courseId,
        status: 'active'
    });

    if (!enrollment) {
        return NextResponse.json({ 
            success: false, 
            error: 'No active enrollment found for this course.' 
        }, { status: 403 });
    }

    // Standard response for LearningPage.js
    return NextResponse.json({ 
      success: true, 
      data: {
        progress: enrollment.progress,
        completedLessons: enrollment.completedLessons || [],
        lastLessonId: enrollment.lastLessonId,
        status: enrollment.status,
        paymentStatus: enrollment.paymentStatus
      }
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

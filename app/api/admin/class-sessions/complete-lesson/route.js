import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ClassProgress from '@/models/ClassProgress';
import StudentProgress from '@/models/StudentProgress';
import BatchStudent from '@/models/BatchStudent';
import { getUserFromCookie } from '@/utils/auth';

export async function POST(req) {
  try {
    const user = getUserFromCookie();
    if (!user || (!['admin', 'staff', 'instructor'].includes(user.role))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const { batchId, classSessionId, lessonId } = body;

    if (!batchId || !lessonId) {
      return NextResponse.json({ success: false, error: 'Batch ID and Lesson ID are required' }, { status: 400 });
    }

    // 1. Mark ClassProgress (Batch Level)
    const classProgress = await ClassProgress.findOneAndUpdate(
       { batchId, lessonId },
       { classSessionId, completedBy: user.id, completedAt: new Date() },
       { upsert: true, new: true }
    );

    // 2. Mark StudentProgress (Student Level) for all active students in this batch
    const activeStudents = await BatchStudent.find({ batchId, status: 'active' });
    
    const studentProgressPromises = activeStudents.map(bs => 
      StudentProgress.findOneAndUpdate(
        { studentId: bs.studentId, lessonId },
        { status: 'completed', completionDate: new Date() },
        { upsert: true, new: true }
      )
    );

    await Promise.all(studentProgressPromises);

    return NextResponse.json({ success: true, classProgress, studentsUpdated: activeStudents.length });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

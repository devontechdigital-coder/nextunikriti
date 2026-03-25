import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Student from '@/models/Student';
import BatchStudent from '@/models/BatchStudent';
import BatchCourse from '@/models/BatchCourse';
import StudentProgress from '@/models/StudentProgress';
import Section from '@/models/Section';
import Lesson from '@/models/Lesson';
import CourseMapping from '@/models/CourseMapping';
import { getUserFromCookie } from '@/utils/auth';

export async function GET(req) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'student') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // 1. Get student profile
    const student = await Student.findOne({ userId: user.id });
    if (!student) return NextResponse.json({ success: false, error: 'Student profile not found' }, { status: 404 });

    // 2. Get active batch
    const batchStudent = await BatchStudent.findOne({ studentId: student._id, status: 'active' }).populate('batchId');
    if (!batchStudent) return NextResponse.json({ success: true, progress: null, message: 'No active batch found' });

    const batch = batchStudent.batchId;

    // 3. Get assigned course
    let batchCourse = await BatchCourse.findOne({ batchId: batch._id }).populate('courseId');
    let course = batchCourse?.courseId;

    if (!course) {
      // Try auto-mapping
      const mapping = await CourseMapping.findOne({ 
        instrument: batch.instrument, 
        level: batch.level 
      }).populate('courseId');
      course = mapping?.courseId;
    }

    if (!course) {
      return NextResponse.json({ success: true, progress: null, message: 'No course assigned to your batch' });
    }

    // 4. Calculate progress
    const sections = await Section.find({ courseId: course._id });
    const sectionIds = sections.map(s => s._id);
    const totalLessons = await Lesson.countDocuments({ sectionId: { $in: sectionIds } });
    
    const completedLessonsCount = await StudentProgress.countDocuments({ 
      studentId: student._id, 
      lessonId: { $in: await Lesson.find({ sectionId: { $in: sectionIds } }).distinct('_id') },
      status: 'completed'
    });

    const progressPercentage = totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;

    return NextResponse.json({ 
      success: true, 
      courseTitle: course.title,
      totalLessons,
      completedLessonsCount,
      progressPercentage,
      batchName: batch.batchName
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import ClassSession from '@/models/ClassSession';
import BatchCourse from '@/models/BatchCourse';
import ClassProgress from '@/models/ClassProgress';
import Section from '@/models/Section';
import Lesson from '@/models/Lesson';
import Course from '@/models/Course';
import { getUserFromCookie } from '@/utils/auth';

export async function GET(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user || (!['admin', 'staff', 'instructor', 'school_admin'].includes(user.role))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const session = await ClassSession.findById(params.id).populate('batchId');
    if (!session) return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });

    const batchId = session.batchId._id;

    // 1. Get assigned course
    let batchCourse = await BatchCourse.findOne({ batchId });
    let courseId = batchCourse?.courseId;

    if (!courseId) {
      // Try auto-mapping via Course model
      const batch = session.batchId;
      if (batch.instrument_id && batch.level_id) {
         const course = await Course.findOne({ 
           instrument_id: batch.instrument_id, 
           level_id: batch.level_id 
         });
         courseId = course?._id;
      }
    }

    if (!courseId) {
      return NextResponse.json({ success: true, lesson: null, message: 'No course assigned to this batch' });
    }

    // 2. Get all lessons for this course in order
    const sections = await Section.find({ courseId }).sort({ order: 1 });
    const sectionIds = sections.map(s => s._id);
    const allLessons = await Lesson.find({ sectionId: { $in: sectionIds } }).sort({ sectionId: 1, order: 1 });
    
    // Note: sorting by sectionId:1 might not follow section order perfectly if section IDs are not chronological. 
    // We should map them.
    const orderedLessons = [];
    sections.forEach(sec => {
       const secLessons = allLessons.filter(l => l.sectionId.toString() === sec._id.toString()).sort((a,b) => a.order - b.order);
       orderedLessons.push(...secLessons);
    });

    // 3. Find completed lessons
    const completedLessonIds = await ClassProgress.find({ batchId }).distinct('lessonId');
    const completedSet = new Set(completedLessonIds.map(id => id.toString()));

    // 4. Find first non-completed lesson
    const nextLesson = orderedLessons.find(l => !completedSet.has(l._id.toString()));

    return NextResponse.json({ 
      success: true, 
      lesson: nextLesson || null, 
      courseId,
      totalLessons: orderedLessons.length,
      completedCount: completedSet.size
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

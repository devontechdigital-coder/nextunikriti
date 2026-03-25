import Batch from '@/models/Batch';
import BatchCourse from '@/models/BatchCourse';
import Course from '@/models/Course';
import { getUserFromCookie } from '@/utils/auth';

export async function GET(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user || (!['admin', 'staff', 'school_admin', 'instructor'].includes(user.role))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const batchId = params.id;
    
    // 1. Check for manual assignment first
    let batchCourse = await BatchCourse.findOne({ batchId }).populate('courseId');
    
    if (batchCourse) {
      return NextResponse.json({ success: true, batchCourse, source: 'manual' });
    }

    // 2. If no manual assignment, attempt auto-mapping via Course model
    const batch = await Batch.findById(batchId);
    if (!batch) return NextResponse.json({ success: false, error: 'Batch not found' }, { status: 404 });

    // Use instrument_id and level_id if available, otherwise fallback to strings (if needed, but aim for IDs)
    const query = {};
    if (batch.instrument_id && batch.level_id) {
       query.instrument_id = batch.instrument_id;
       query.level_id = batch.level_id;
    } else {
       // Support legacy mapping by matching names if possible (requires instrument/level names to be unique in Course)
       // However, the new standard is instrument_id and level_id.
       // For now, if IDs are missing, we can't do auto-mapping easily without the mapping table.
       return NextResponse.json({ success: true, batchCourse: null, message: 'Batch requires instrument_id and level_id for auto-mapping' });
    }

    const course = await Course.findOne(query);

    if (course) {
      return NextResponse.json({ success: true, batchCourse: { courseId: course }, source: 'auto' });
    }

    return NextResponse.json({ success: true, batchCourse: null, message: 'No course assigned' });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user || (!['admin', 'staff', 'school_admin'].includes(user.role))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const batchId = params.id;
    const body = await req.json();
    const { courseId } = body;

    const batchCourse = await BatchCourse.findOneAndUpdate(
       { batchId },
       { courseId, isActive: true },
       { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, batchCourse });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

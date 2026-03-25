import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Course from '@/models/Course';
import Instrument from '@/models/Instrument';
import Level from '@/models/Level';
import { getUserFromCookie } from '@/utils/auth';
import mongoose from 'mongoose';

export async function GET(req) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const instrumentId = searchParams.get('instrumentId');
    const levelId = searchParams.get('levelId');

    let query = {};
    if (instrumentId) query.instrument_id = instrumentId;
    if (levelId) query.level_id = levelId;

    const courses = await Course.find(query)
      .populate('course_creator', 'name email')
      .populate({ path: 'instrument_id', select: 'name', strictPopulate: false })
      .populate({ path: 'level_id', select: 'levelName', strictPopulate: false })
      .sort({ createdAt: -1 });

    // Normalize categories: ensure categoryIds is an array and include legacy category if present
    const normalizedCourses = courses.map(course => {
      const obj = course.toObject();
      let cIds = Array.isArray(obj.categoryIds) ? obj.categoryIds.map(id => id.toString()) : [];
      
      // Fallback: if categoryIds is empty but legacy category exists, keep it in view
      // Note: We might want to look up the Category by name in a more advanced migration, 
      // but for now we just handle the presence of the data.
      
      obj.categoryIds = cIds;
      return obj;
    });

    return NextResponse.json({ success: true, data: normalizedCourses });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

const generateSlug = (str) => {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

export async function POST(req) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const courseData = await req.json();
    
    // Auto-generate slug if not provided
    if (!courseData.slug && courseData.title) {
        courseData.slug = generateSlug(courseData.title);
    }
    
    // Validate new fields
    if (courseData.mode && !['Online', 'Offline'].includes(courseData.mode)) {
      return NextResponse.json({ success: false, error: "mode must be 'Online' or 'Offline'" }, { status: 400 });
    }
    if (courseData.faq !== undefined && !Array.isArray(courseData.faq)) {
      return NextResponse.json({ success: false, error: 'faq must be an array' }, { status: 400 });
    }

    // Clean up mapping fields: convert empty strings to null
    if (courseData.instrument_id === '') courseData.instrument_id = null;
    if (courseData.level_id === '') courseData.level_id = null;
    
    // Validation: if level_id is provided, verify it belongs to instrument_id
    if (courseData.level_id && courseData.instrument_id) {
       await connectDB();
       const level = await Level.findById(courseData.level_id);
       if (!level || level.instrumentId.toString() !== courseData.instrument_id) {
          return NextResponse.json({ success: false, error: 'Level does not belong to the selected instrument' }, { status: 400 });
       }
    }

    // Explicitly cast categoryIds to ObjectIds
    if (courseData.categoryIds && Array.isArray(courseData.categoryIds)) {
      courseData.categoryIds = courseData.categoryIds
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));
    }

    await connectDB();
    const newCourse = new Course({
        ...courseData,
        course_creator: courseData.instructor || courseData.course_creator,
        category: undefined 
    });
    
    await newCourse.save();

    return NextResponse.json({ success: true, data: newCourse });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId, ...updateData } = await req.json();

    // Auto-generate slug if title changed and slug not explicit
    if (!updateData.slug && updateData.title) {
        updateData.slug = generateSlug(updateData.title);
    }

    // Validate new fields
    if (updateData.mode && !['Online', 'Offline'].includes(updateData.mode)) {
      return NextResponse.json({ success: false, error: "mode must be 'Online' or 'Offline'" }, { status: 400 });
    }
    if (updateData.faq !== undefined && !Array.isArray(updateData.faq)) {
      return NextResponse.json({ success: false, error: 'faq must be an array' }, { status: 400 });
    }

    // Clean up mapping fields: convert empty strings to null
    if (updateData.instrument_id === '') updateData.instrument_id = null;
    if (updateData.level_id === '') updateData.level_id = null;

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
        return NextResponse.json({ success: false, error: 'Invalid Course ID' }, { status: 400 });
    }

    // Validation: if level_id is provided, verify it belongs to instrument_id
    if (updateData.level_id && updateData.instrument_id) {
       await connectDB();
       const level = await Level.findById(updateData.level_id);
       if (!level || level.instrumentId.toString() !== updateData.instrument_id) {
          return NextResponse.json({ success: false, error: 'Level does not belong to the selected instrument' }, { status: 400 });
       }
    }

    // Explicitly cast categoryIds to ObjectIds
    if (updateData.categoryIds && Array.isArray(updateData.categoryIds)) {
      updateData.categoryIds = updateData.categoryIds
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));
    }

    await connectDB();
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    // Apply updates
    Object.keys(updateData).forEach(key => {
        course[key] = updateData[key];
    });
    
    // Explicitly handle unset if needed, or migration
    course.category = undefined;

    await course.save();

    return NextResponse.json({ success: true, data: course });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    await connectDB();
    const deletedCourse = await Course.findByIdAndDelete(courseId);

    if (!deletedCourse) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

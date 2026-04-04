import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Batch from '@/models/Batch';
import BatchStudent from '@/models/BatchStudent';
import { getUserFromCookie } from '@/utils/auth';

export async function GET(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user || (!['admin', 'staff', 'instructor', 'school_admin'].includes(user.role))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const batch = await Batch.findById(params.id)
      .populate('schoolId', 'schoolName')
      .populate('teacherId', 'name email');

    if (!batch) {
      return NextResponse.json({ success: false, error: 'Batch not found' }, { status: 404 });
    }

    // Role check for instructors and school admins
    if (user.role === 'instructor' && batch.teacherId?._id?.toString() !== user._id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role === 'school_admin' && batch.schoolId?._id?.toString() !== user.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ success: true, batch });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user || (!['admin', 'staff', 'school_admin'].includes(user.role))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    delete body.course_id;
    delete body.price;
    delete body.timetable;

    // Check ownership if school_admin
    if (user.role === 'school_admin') {
      const existingBatch = await Batch.findById(params.id);
      if (!existingBatch || existingBatch.schoolId?.toString() !== user.schoolId) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
      // Ensure they don't change schoolId or other protected fields if necessary
      delete body.schoolId; 
    }

    const batch = await Batch.findByIdAndUpdate(params.id, body, { new: true });
    
    if (!batch) {
      return NextResponse.json({ success: false, error: 'Batch not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, batch });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user || (!['admin', 'school_admin'].includes(user.role))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Check ownership if school_admin
    if (user.role === 'school_admin') {
      const existingBatch = await Batch.findById(params.id);
      if (!existingBatch || existingBatch.schoolId?.toString() !== user.schoolId) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    // 1. Delete batch
    const batch = await Batch.findByIdAndDelete(params.id);
    if (!batch) {
      return NextResponse.json({ success: false, error: 'Batch not found' }, { status: 404 });
    }

    // 2. Delete enrollment records
    await BatchStudent.deleteMany({ batchId: params.id });

    return NextResponse.json({ success: true, message: 'Batch and enrollment records deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

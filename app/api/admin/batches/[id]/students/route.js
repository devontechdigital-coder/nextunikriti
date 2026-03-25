import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Batch from '@/models/Batch';
import BatchStudent from '@/models/BatchStudent';
import { getUserFromCookie } from '@/utils/auth';

export async function GET(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user || (!['admin', 'staff', 'school_admin', 'instructor'].includes(user.role))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // Check batch ownership if school_admin
    const batch = await Batch.findById(params.id);
    if (!batch) {
       return NextResponse.json({ success: false, error: 'Batch not found' }, { status: 404 });
    }

    if (user.role === 'school_admin' && batch.schoolId?.toString() !== user.schoolId?.toString()) {
       return NextResponse.json({ success: false, error: 'Unauthorized access to this batch' }, { status: 401 });
    }

    if (user.role === 'instructor' && batch.teacherId?.toString() !== user.id?.toString()) {
      return NextResponse.json({ success: false, error: 'Unauthorized: You are not the instructor for this batch' }, { status: 401 });
    }
    const students = await BatchStudent.find({ batchId: params.id })
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'name email phone' }
      });

    return NextResponse.json({ success: true, students });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user || (!['admin', 'staff', 'school_admin', 'instructor'].includes(user.role))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Check ownership if school_admin
    const batch = await Batch.findById(params.id);
    if (!batch) {
      return NextResponse.json({ success: false, error: 'Batch not found' }, { status: 404 });
    }

    if (user.role === 'school_admin' && batch.schoolId?.toString() !== user.schoolId?.toString()) {
       return NextResponse.json({ success: false, error: 'Unauthorized access to this batch' }, { status: 401 });
    }

    const body = await req.json();
    const { studentId } = body;

    // 1. Check batch capacity
    const currentEnrollment = await BatchStudent.countDocuments({ batchId: params.id });
    if (currentEnrollment >= batch.maxStrength) {
      return NextResponse.json({ success: false, error: 'Batch is already at maximum capacity' }, { status: 400 });
    }

    // 2. Check duplicate enrollment
    const existing = await BatchStudent.findOne({ batchId: params.id, studentId });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Student already enrolled in this batch' }, { status: 400 });
    }

    // 3. Enroll student
    const enrollment = await BatchStudent.create({
      batchId: params.id,
      studentId
    });

    return NextResponse.json({ success: true, enrollment });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

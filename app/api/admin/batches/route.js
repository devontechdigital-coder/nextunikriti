import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Batch from '@/models/Batch';
import { getUserFromCookie } from '@/utils/auth';
import mongoose from 'mongoose';

export async function GET(req) {
  try {
    const user = getUserFromCookie();
    if (!user || (!['admin', 'staff', 'instructor', 'school_admin'].includes(user.role))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get('schoolId');
    const teacherId = searchParams.get('teacherId');
    const programType = searchParams.get('programType');
    const grade = searchParams.get('grade');
    const batchNo = searchParams.get('batchNo');

    const query = {};
    if (schoolId && mongoose.Types.ObjectId.isValid(schoolId)) query.schoolId = new mongoose.Types.ObjectId(schoolId);
    if (teacherId && mongoose.Types.ObjectId.isValid(teacherId)) query.teacherId = new mongoose.Types.ObjectId(teacherId);
    if (programType) query.programType = programType;
    if (grade) query.grade = { $regex: grade, $options: 'i' };
    if (batchNo) query.batchNo = { $regex: batchNo, $options: 'i' };

    // Instructors can only see their own batches
    if (user.role === 'instructor' && user.id) {
      query.teacherId = new mongoose.Types.ObjectId(user.id);
    }
    
    // School admins can only see batches for their school
    if (user.role === 'school_admin' && user.schoolId) {
      query.schoolId = new mongoose.Types.ObjectId(user.schoolId);
    }

    const batches = await Batch.find(query)
      .populate('schoolId', 'schoolName')
      .populate('teacherId', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, batches });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
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
    
    if (user.role === 'school_admin') {
       body.schoolId = user.schoolId;
    }

    const batch = await Batch.create(body);
    return NextResponse.json({ success: true, batch });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

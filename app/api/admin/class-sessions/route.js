import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ClassSession from '@/models/ClassSession';
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
    const batchId = searchParams.get('batchId');
    const schoolId = searchParams.get('schoolId');
    const teacherId = searchParams.get('teacherId');
    const status = searchParams.get('status');

    const query = {};
    if (batchId && mongoose.Types.ObjectId.isValid(batchId)) query.batchId = new mongoose.Types.ObjectId(batchId);
    if (schoolId && mongoose.Types.ObjectId.isValid(schoolId)) query.schoolId = new mongoose.Types.ObjectId(schoolId);
    if (teacherId && mongoose.Types.ObjectId.isValid(teacherId)) query.teacherId = new mongoose.Types.ObjectId(teacherId);
    if (status) query.status = status;

    // Role-based filtering
    if (user.role === 'instructor') {
      query.teacherId = new mongoose.Types.ObjectId(user.id);
    } else if (user.role === 'school_admin') {
      query.schoolId = new mongoose.Types.ObjectId(user.schoolId);
    }

    const sessions = await ClassSession.find(query)
      .populate('batchId', 'batchName programType instrument level')
      .populate('teacherId', 'name email')
      .populate('schoolId', 'schoolName')
      .sort({ classDate: -1 });

    return NextResponse.json({ success: true, sessions });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = getUserFromCookie();
    if (!user || (!['admin', 'staff', 'school_admin', 'instructor'].includes(user.role))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const { batchId, classDate } = body;

    if (!batchId || !classDate) {
      return NextResponse.json({ success: false, error: 'batchId and classDate are required' }, { status: 400 });
    }

    // Auto-fetch teacher and school from batch
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return NextResponse.json({ success: false, error: 'Batch not found' }, { status: 404 });
    }

    // Permission check for non-super-admins
    if (user.role === 'instructor' && batch.teacherId.toString() !== user.id) {
       return NextResponse.json({ success: false, error: 'You are not the designated teacher for this batch' }, { status: 403 });
    }
    if (user.role === 'school_admin' && batch.schoolId.toString() !== user.schoolId) {
       return NextResponse.json({ success: false, error: 'Batch does not belong to your school' }, { status: 403 });
    }

    const sessionData = {
      ...body,
      schoolId: batch.schoolId,
      teacherId: batch.teacherId
    };

    const selectedDate = new Date(classDate);
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const existingSession = await ClassSession.findOne({
      batchId,
      classDate: { $gte: dayStart, $lt: dayEnd }
    })
      .populate('batchId', 'batchName programType instrument level')
      .populate('teacherId', 'name email')
      .populate('schoolId', 'schoolName');

    if (existingSession) {
      return NextResponse.json({ success: true, session: existingSession, existing: true });
    }

    const session = await ClassSession.create(sessionData);
    const populatedSession = await ClassSession.findById(session._id)
      .populate('batchId', 'batchName programType instrument level')
      .populate('teacherId', 'name email')
      .populate('schoolId', 'schoolName');

    return NextResponse.json({ success: true, session: populatedSession });
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json({ success: false, error: 'A session already exists for this batch on this date' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

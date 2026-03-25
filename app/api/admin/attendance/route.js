import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Attendance from '@/models/Attendance';
import ClassSession from '@/models/ClassSession';
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
    const classSessionId = searchParams.get('classSessionId');
    const studentId = searchParams.get('studentId');

    const query = {};
    if (classSessionId && mongoose.Types.ObjectId.isValid(classSessionId)) query.classSessionId = new mongoose.Types.ObjectId(classSessionId);
    if (studentId && mongoose.Types.ObjectId.isValid(studentId)) query.studentId = new mongoose.Types.ObjectId(studentId);

    const attendance = await Attendance.find(query)
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .sort({ createdAt: 1 });

    return NextResponse.json({ success: true, attendance });
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
    const body = await req.json(); // Expecting { classSessionId: string, attendanceRecords: Array<{ studentId, status, remarks }> }
    const { classSessionId, attendanceRecords } = body;

    if (!classSessionId || !attendanceRecords || !Array.isArray(attendanceRecords)) {
      return NextResponse.json({ success: false, error: 'classSessionId and attendanceRecords array are required' }, { status: 400 });
    }

    // Verify session exists and user has permission
    const session = await ClassSession.findById(classSessionId);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Class session not found' }, { status: 404 });
    }

    if (user.role === 'instructor' && session.teacherId.toString() !== user.id) {
       return NextResponse.json({ success: false, error: 'You are not the teacher for this session' }, { status: 403 });
    }

    // Upsert attendance records
    const operations = attendanceRecords.map(record => ({
      updateOne: {
        filter: { classSessionId, studentId: record.studentId },
        update: { $set: { status: record.status, remarks: record.remarks || '' } },
        upsert: true
      }
    }));

    await Attendance.bulkWrite(operations);

    // Mark session as completed if it was scheduled
    if (session.status === 'scheduled') {
      session.status = 'completed';
      await session.save();
    }

    return NextResponse.json({ success: true, message: 'Attendance marked successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

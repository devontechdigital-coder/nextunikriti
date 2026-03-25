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
    const batchId = searchParams.get('batchId');
    const studentId = searchParams.get('studentId');
    const schoolId = searchParams.get('schoolId');

    // 1. If studentId is provided, get individual attendance %
    if (studentId) {
      const studentObjId = new mongoose.Types.ObjectId(studentId);
      
      // Get all sessions for this student's batches or school
      const sessionsQuery = {};
      if (batchId) sessionsQuery.batchId = new mongoose.Types.ObjectId(batchId);
      if (schoolId) sessionsQuery.schoolId = new mongoose.Types.ObjectId(schoolId);
      
      const sessionIds = await ClassSession.find(sessionsQuery).distinct('_id');
      
      const attendanceRecords = await Attendance.find({
        classSessionId: { $in: sessionIds },
        studentId: studentObjId
      });

      const totalSessions = sessionIds.length;
      const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
      const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
      const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;

      const attendancePercentage = totalSessions > 0 ? ((presentCount + (lateCount * 0.5)) / totalSessions) * 100 : 0;

      return NextResponse.json({
        success: true,
        report: {
          totalSessions,
          presentCount,
          lateCount,
          absentCount,
          percentage: attendancePercentage.toFixed(2)
        }
      });
    }

    // 2. If batchId is provided, get batch summary
    if (batchId) {
       const batchObjId = new mongoose.Types.ObjectId(batchId);
       const sessions = await ClassSession.find({ batchId: batchObjId, status: 'completed' });
       const sessionIds = sessions.map(s => s._id);

       const stats = await Attendance.aggregate([
         { $match: { classSessionId: { $in: sessionIds } } },
         { $group: {
             _id: "$status",
             count: { $sum: 1 }
         }}
       ]);

       return NextResponse.json({ success: true, stats, totalSessions: sessionIds.length });
    }

    return NextResponse.json({ success: false, error: 'studentId or batchId required' }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

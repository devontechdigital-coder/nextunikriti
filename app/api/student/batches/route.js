import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Attendance from '@/models/Attendance';
import BatchStudent from '@/models/BatchStudent';
import ClassSession from '@/models/ClassSession';
import Student from '@/models/Student';
import '@/models/Batch';
import '@/models/Course';
import '@/models/School';
import '@/models/User';
import { getUserFromCookie } from '@/utils/auth';

export async function GET() {
  try {
    const authUser = getUserFromCookie();
    if (!authUser || authUser.role !== 'student') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const student = await Student.findOne({ userId: authUser.id }).select('_id').lean();
    if (!student?._id) {
      return NextResponse.json({ success: true, data: [] });
    }

    const batchStudents = await BatchStudent.find({ studentId: student._id })
      .populate({
        path: 'batchId',
        select: 'batchName programType instrument level totalDays startDate endDate timetable status course_id schoolId teacherId',
        populate: [
          { path: 'course_id', select: 'title thumbnail' },
          { path: 'schoolId', select: 'schoolName' },
          { path: 'teacherId', select: 'name email' },
        ],
      })
      .sort({ updatedAt: -1 })
      .lean();

    const data = await Promise.all(batchStudents.map(async (batchStudent) => {
      const batch = batchStudent.batchId;
      if (!batch?._id) return null;

      const [completedSessions, scheduledClasses] = await Promise.all([
        ClassSession.find({ batchId: batch._id, status: 'completed' }).select('_id').lean(),
        ClassSession.countDocuments({ batchId: batch._id, status: 'scheduled', classDate: { $gte: new Date() } }),
      ]);

      const completedClasses = completedSessions.length;
      const totalClasses = batch.totalDays || completedClasses + scheduledClasses;
      const classesLeft = batch.totalDays
        ? Math.max(Number(batch.totalDays || 0) - completedClasses, 0)
        : scheduledClasses;

      let attendanceSummary = {
        present: 0,
        absent: 0,
        late: 0,
        totalMarked: 0,
        percentage: null,
      };

      if (completedSessions.length > 0) {
        const attendance = await Attendance.find({
          studentId: student._id,
          classSessionId: { $in: completedSessions.map((session) => session._id) },
        }).select('status').lean();

        const summary = attendance.reduce((acc, record) => {
          acc[record.status] = (acc[record.status] || 0) + 1;
          acc.totalMarked += 1;
          return acc;
        }, { present: 0, absent: 0, late: 0, totalMarked: 0 });

        const attended = summary.present + summary.late;
        attendanceSummary = {
          ...summary,
          percentage: summary.totalMarked ? Math.round((attended / summary.totalMarked) * 100) : null,
        };
      }

      const attendanceRecords = await ClassSession.aggregate([
        { $match: { batchId: batch._id, status: 'completed' } },
        { $sort: { classDate: -1 } },
        {
          $lookup: {
            from: 'attendances',
            let: { sessionId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$classSessionId', '$$sessionId'] },
                      { $eq: ['$studentId', student._id] },
                    ],
                  },
                },
              },
              { $project: { status: 1, remarks: 1, createdAt: 1, updatedAt: 1 } },
            ],
            as: 'attendanceRecord',
          },
        },
        {
          $project: {
            _id: 1,
            classDate: 1,
            topicTaught: 1,
            notes: 1,
            attendance: { $first: '$attendanceRecord' },
          },
        },
      ]);

      return {
        batch_id: batch._id,
        batch_name: batch.batchName,
        batch_program_type: batch.programType,
        batch_instrument: batch.instrument,
        batch_level: batch.level,
        batch_total_days: batch.totalDays || 0,
        batch_startDate: batch.startDate || null,
        batch_endDate: batch.endDate || null,
        batch_timetable: batch.timetable || [],
        batch_student_status: batchStudent.status,
        batch_status: batch.status,
        school_name: batch.schoolId?.schoolName || '',
        teacher_name: batch.teacherId?.name || '',
        completed_classes: completedClasses,
        scheduled_classes: scheduledClasses,
        total_classes: totalClasses,
        classes_left: classesLeft,
        attendance: attendanceSummary,
        attendance_records: attendanceRecords.map((session) => ({
          session_id: session._id,
          classDate: session.classDate,
          topicTaught: session.topicTaught || '',
          notes: session.notes || '',
          status: session.attendance?.status || 'not_marked',
          remarks: session.attendance?.remarks || '',
          markedAt: session.attendance?.updatedAt || session.attendance?.createdAt || null,
        })),
        courses: batch.course_id ? [{
          course_id: batch.course_id._id,
          course_title: batch.course_id.title,
          thumbnail: batch.course_id.thumbnail,
        }] : [],
      };
    }));

    return NextResponse.json({ success: true, data: data.filter(Boolean) });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

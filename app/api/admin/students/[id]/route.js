import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Student from '@/models/Student';
import User from '@/models/User';
import StudentParent from '@/models/StudentParent';
import { getUserFromCookie } from '@/utils/auth';

export async function GET(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user || (!['admin', 'staff', 'teacher', 'school_admin'].includes(user.role))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const student = await Student.findById(params.id)
      .populate('userId', 'name email phone avatar')
      .populate('schoolId', 'schoolName');

    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    // School admin check
    if (user.role === 'school_admin' && student.schoolId?._id?.toString() !== user.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ success: true, student });
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
    const student = await Student.findById(params.id);
    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    // School admin check
    if (user.role === 'school_admin') {
      if (student.schoolId?.toString() !== user.schoolId) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
      // Prevent changing schoolId
      delete body.schoolId;
    }

    // Update User if name/email/phone provided
    if (body.name || body.email || body.phone) {
      await User.findByIdAndUpdate(student.userId, {
        name: body.name,
        email: body.email,
        phone: body.phone
      });
    }

    // Update Student
    const updatedStudent = await Student.findByIdAndUpdate(params.id, body, { new: true });
    
    return NextResponse.json({ success: true, student: updatedStudent });
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
    const student = await Student.findById(params.id);
    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    // School admin check
    if (user.role === 'school_admin' && student.schoolId?.toString() !== user.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Delete Student
    await Student.findByIdAndDelete(params.id);

    // 2. Delete Parent Details
    await StudentParent.deleteMany({ studentId: params.id });

    // 3. Delete User
    await User.findByIdAndDelete(student.userId);

    return NextResponse.json({ success: true, message: 'Student and linked data deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

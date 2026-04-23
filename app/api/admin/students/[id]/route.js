import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Student from '@/models/Student';
import User from '@/models/User';
import StudentParent from '@/models/StudentParent';
import { getUserFromCookie } from '@/utils/auth';

function buildStudentPayload(body) {
  const payload = {};

  const mappings = {
    enrolmentNumber: body.enrolmentNumber,
    joiningYear: body.joiningYear,
    dob: body.dateOfBirth ?? body.dob,
    joiningDate: body.dateOfJoining ?? body.joiningDate,
    leavingDate: body.dateOfLeaving ?? body.leavingDate,
    studentName: body.studentName,
    onBoard: body.onBoard,
    time: body.time,
    enrolledFor: body.enrolledFor,
    location: body.location,
    gender: body.gender,
    bloodGroup: body.bloodGroup,
    nationality: body.nationality,
    addressLine1: body.address1 ?? body.addressLine1,
    addressLine2: body.address2 ?? body.addressLine2,
    street: body.street,
    city: body.cityDistrict ?? body.city,
    state: body.state,
    country: body.country,
    pinCode: body.pinCode,
    motherName: body.motherName,
    motherMobile: body.motherMobile,
    motherEmail: body.motherEmail,
    fatherName: body.fatherName,
    fatherMobile: body.fatherMobile,
    fatherEmail: body.fatherEmail,
    homePhone: body.homePhone,
    emergencyDetails: body.emergencyDetails,
    relationship: body.relationship,
    emergencyPhoneNo: body.emergencyPhoneNo,
    allergies: body.allergies,
    medicalCondition: body.medicalCondition,
    status: body.status,
    profilePhoto: body.profilePhoto
  };

  for (const [key, value] of Object.entries(mappings)) {
    if (value !== undefined) {
      payload[key] = value;
    }
  }

  return payload;
}

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
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.email !== undefined ? { email: body.email } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {})
      });
    }

    // Update Student
    const updatedStudent = await Student.findByIdAndUpdate(
      params.id,
      buildStudentPayload(body),
      { new: true, runValidators: true }
    );
    
    return NextResponse.json({ success: true, student: updatedStudent });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const student = await Student.findById(params.id);
    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
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

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Student from '@/models/Student';
import User from '@/models/User';
import { getUserFromCookie } from '@/utils/auth';
import bcrypt from 'bcryptjs';

export async function GET(req) {
  try {
    const user = getUserFromCookie();
    if (!user || (!['admin', 'staff', 'school_admin'].includes(user.role))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get('schoolId');
    const status = searchParams.get('status');
    const gender = searchParams.get('gender');
    const search = searchParams.get('search');

    const query = {};
    if (schoolId) query.schoolId = schoolId;
    if (status) query.status = status;
    if (gender) query.gender = gender;
    
    if (user.role === 'school_admin') {
      query.schoolId = user.schoolId;
    }

    let students = await Student.find(query)
      .populate('userId', 'name email phone avatar')
      .populate('schoolId', 'schoolName')
      .sort({ createdAt: -1 });

    if (search) {
      const searchLower = search.toLowerCase();
      students = students.filter(s => 
        (s.userId?.name && s.userId.name.toLowerCase().includes(searchLower)) ||
        (s.enrolmentNumber && s.enrolmentNumber.toLowerCase().includes(searchLower))
      );
    }

    return NextResponse.json({ success: true, students });
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
    const { 
      name, email, phone, password, 
      schoolId, enrolmentNumber, dob, gender, 
      bloodGroup, nationality, addressLine1, 
      addressLine2, city, state, pinCode, 
      status, joiningDate, leavingDate 
    } = body;

    // 1. Create User
    const existingUser = await User.findOne({ 
      $or: [
        { email: email || 'nevermatch' },
        { phone: phone || 'nevermatch' }
      ] 
    });

    if (existingUser) {
      return NextResponse.json({ success: false, error: 'User with this email or phone already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password || 'Student@123', 10);
    const newUser = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: 'student',
      status: 'active'
    });

    // 2. Create Student
    let finalSchoolId = schoolId;
    if (user.role === 'school_admin') {
      finalSchoolId = user.schoolId;
    }

    try {
      const newStudent = await Student.create({
        userId: newUser._id,
        schoolId: finalSchoolId,
        enrolmentNumber,
        dob,
        gender,
        bloodGroup,
        nationality,
        addressLine1,
        addressLine2,
        city,
        state,
        pinCode,
        status,
        joiningDate,
        leavingDate
      });

      return NextResponse.json({ success: true, student: newStudent });
    } catch (studentError) {
      // Rollback user creation if student creation fails
      await User.findByIdAndDelete(newUser._id);
      throw studentError;
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

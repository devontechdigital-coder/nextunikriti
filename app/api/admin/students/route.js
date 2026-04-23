import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Student from '@/models/Student';
import User from '@/models/User';
import Counter from '@/models/Counter';
import { getUserFromCookie } from '@/utils/auth';
import bcrypt from 'bcryptjs';

const STUDENT_COUNTER_KEY = 'student_enrolment_number';
const ENROLMENT_PREFIX = 'STU';

async function generateStudentEnrolmentNumber() {
  const counter = await Counter.findOneAndUpdate(
    { name: STUDENT_COUNTER_KEY },
    {
      $inc: { seq: 1 },
      $setOnInsert: { name: STUDENT_COUNTER_KEY }
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );

  return `${ENROLMENT_PREFIX}-${String(counter.seq).padStart(5, '0')}`;
}

function buildStudentPayload(body) {
  return {
    schoolId: body.schoolId,
    enrolmentNumber: body.enrolmentNumber,
    joiningYear: body.joiningYear || '',
    dob: body.dateOfBirth || body.dob || undefined,
    joiningDate: body.dateOfJoining || body.joiningDate || undefined,
    leavingDate: body.dateOfLeaving || body.leavingDate || undefined,
    studentName: body.studentName || body.name || '',
    onBoard: typeof body.onBoard === 'boolean' ? body.onBoard : false,
    time: body.time || '',
    enrolledFor: body.enrolledFor || '',
    location: body.location || '',
    gender: body.gender,
    bloodGroup: body.bloodGroup,
    nationality: body.nationality,
    addressLine1: body.address1 || body.addressLine1 || '',
    addressLine2: body.address2 || body.addressLine2 || '',
    street: body.street || '',
    city: body.cityDistrict || body.city || '',
    state: body.state || '',
    country: body.country || '',
    pinCode: body.pinCode || '',
    motherName: body.motherName || '',
    motherMobile: body.motherMobile || '',
    motherEmail: body.motherEmail || '',
    fatherName: body.fatherName || '',
    fatherMobile: body.fatherMobile || '',
    fatherEmail: body.fatherEmail || '',
    homePhone: body.homePhone || '',
    emergencyDetails: body.emergencyDetails || '',
    relationship: body.relationship || '',
    emergencyPhoneNo: body.emergencyPhoneNo || '',
    allergies: body.allergies || '',
    medicalCondition: body.medicalCondition || '',
    status: body.status,
    profilePhoto: body.profilePhoto || '',
  };
}

export async function GET(req) {
  try {
    const user = getUserFromCookie();
    if (!user || (!['admin', 'staff', 'school_admin'].includes(user.role))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get('schoolId');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const gender = searchParams.get('gender');
    const search = searchParams.get('search');

    const query = {};
    if (schoolId) query.schoolId = schoolId;
    if (userId) query.userId = userId;
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
      name, email, phone, password, schoolId
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
      const studentPayload = buildStudentPayload({ ...body, schoolId: finalSchoolId });

      if (!studentPayload.enrolmentNumber || !String(studentPayload.enrolmentNumber).trim()) {
        studentPayload.enrolmentNumber = await generateStudentEnrolmentNumber();
      }

      const newStudent = await Student.create({
        userId: newUser._id,
        schoolId: finalSchoolId,
        ...studentPayload
      });

      return NextResponse.json({
        success: true,
        student: newStudent,
        enrolmentNumber: newStudent.enrolmentNumber
      });
    } catch (studentError) {
      // Rollback user creation if student creation fails
      await User.findByIdAndDelete(newUser._id);
      throw studentError;
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

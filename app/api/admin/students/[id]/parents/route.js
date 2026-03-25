import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import StudentParent from '@/models/StudentParent';
import User from '@/models/User';
import { getUserFromCookie } from '@/utils/auth';
import bcrypt from 'bcryptjs';

export async function GET(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user || (!['admin', 'staff', 'teacher', 'school_admin'].includes(user.role))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const parents = await StudentParent.find({ studentId: params.id });
    return NextResponse.json({ success: true, parents });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user || (!['admin', 'staff', 'school_admin'].includes(user.role))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const { name, phone, email, relation, occupation, password } = body;

    if (!name || !relation || !phone || !email || !password) {
      return NextResponse.json({ success: false, error: 'Missing required fields (name, relation, phone, email, password)' }, { status: 400 });
    }

    // 1. Create User
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ success: false, error: 'User with this email already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: 'parent',
      schoolId: user.role === 'school_admin' ? user.schoolId : (body.schoolId || null),
      status: 'active'
    });

    // 2. Create Student Parent Record
    const parent = await StudentParent.create({
      studentId: params.id,
      userId: newUser._id,
      name,
      phone,
      email,
      relation,
      occupation
    });

    return NextResponse.json({ success: true, parent });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

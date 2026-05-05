import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password required' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    // Admins, school admins, and instructors must have elevated roles
    if (!['admin', 'sub_admin', 'school_admin', 'instructor'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Access denied for student roles via email logic' }, { status: 403 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate JWT
    const jwtPayload = {
      id: user._id,
      role: user.role === 'sub_admin' ? 'admin' : user.role,
      actualRole: user.role,
      adminPermissions: user.adminPermissions || [],
    };
    if (user.schoolId) {
      jwtPayload.schoolId = user.schoolId;
    }

    const token = jwt.sign(
      jwtPayload,
      process.env.JWT_SECRET || 'fallback_secret_for_dev_only',
      { expiresIn: '7d' }
    );

    // Set cookie
    cookies().set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    user.password = undefined;
    return NextResponse.json({ success: true, data: user }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { getUserFromCookie } from '@/utils/auth';

export async function GET(req) {
  try {
    const user = getUserFromCookie();
    if (!user || (!['admin', 'school_admin'].includes(user.role))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || 'all';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    await connectDB();

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (user.role === 'school_admin') {
      query.schoolId = user.schoolId;
      query.role = 'instructor'; // School admins can only see instructors
    } else {
      if (role !== 'all') {
        query.role = role;
      }
    }

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({ 
      success: true, 
      data: users,
      meta: {
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import bcrypt from 'bcryptjs';

const cleanOptionalString = (value) => {
  const trimmed = String(value || '').trim();
  return trimmed || undefined;
};

export async function POST(req) {
  try {
    const user = getUserFromCookie();
    if (!user || (!['admin', 'school_admin'].includes(user.role))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, phone, password, role, schoolId, adminPermissions } = await req.json();
    const cleanPhone = cleanOptionalString(phone);
    const cleanEmail = cleanOptionalString(email);

    if (!password) {
      return NextResponse.json({ success: false, error: 'Password is required' }, { status: 400 });
    }

    await connectDB();
    
    // Check if user exists
    const query = { $or: [] };
    if (cleanEmail) query.$or.push({ email: cleanEmail });
    if (cleanPhone) {
      query.$or.push({ phone: cleanPhone });
    }

    const existingUser = query.$or.length ? await User.findOne(query) : null;
    if (existingUser) {
      const conflictField = existingUser.email === cleanEmail ? 'Email' : 'Phone number';
      return NextResponse.json({ success: false, error: `${conflictField} already exists` }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    let finalRole = role;
    let finalSchoolId = null;

    if (user.role === 'school_admin') {
      finalRole = 'instructor';
      finalSchoolId = user.schoolId;
    } else if (user.role === 'admin' && role === 'school_admin' && schoolId) {
      finalSchoolId = schoolId;
    }

    const newUserData = {
      name,
      email: cleanEmail,
      password: hashedPassword,
      role: finalRole
    };
    if (cleanPhone) newUserData.phone = cleanPhone;
    if (finalRole === 'sub_admin') {
      newUserData.adminPermissions = Array.isArray(adminPermissions) ? adminPermissions : [];
    }
    
    if (finalSchoolId) {
       newUserData.schoolId = finalSchoolId;
    }

    const newUser = await User.create(newUserData);

    return NextResponse.json({ success: true, data: newUser });
  } catch (error) {
    if (error?.code === 11000) {
      const field = Object.keys(error.keyPattern || error.keyValue || {})[0] || 'Field';
      return NextResponse.json({ success: false, error: `${field === 'phone' ? 'Phone number' : 'Email'} already exists` }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

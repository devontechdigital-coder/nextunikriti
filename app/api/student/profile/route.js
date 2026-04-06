import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { getUserFromCookie } from '@/utils/auth';

const buildProfilePayload = (body = {}) => {
  const payload = {};

  if (Object.prototype.hasOwnProperty.call(body, 'name')) {
    payload.name = String(body.name || '').trim();
  }
  if (Object.prototype.hasOwnProperty.call(body, 'email')) {
    payload.email = String(body.email || '').trim().toLowerCase();
  }
  if (Object.prototype.hasOwnProperty.call(body, 'bio')) {
    payload.bio = String(body.bio || '').trim();
  }
  if (Object.prototype.hasOwnProperty.call(body, 'avatar')) {
    payload.avatar = String(body.avatar || '').trim();
  }

  return payload;
};

export async function GET() {
  try {
    const authUser = getUserFromCookie();
    if (!authUser || authUser.role !== 'student') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(authUser.id).select('name phone email bio avatar role status createdAt');
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const authUser = getUserFromCookie();
    if (!authUser || authUser.role !== 'student') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const payload = buildProfilePayload(body);

    if (!payload.name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findByIdAndUpdate(
      authUser.id,
      { $set: payload },
      { new: true, runValidators: true }
    ).select('name phone email bio avatar role status createdAt');

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

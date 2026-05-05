import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { getUserFromCookie } from '@/utils/auth';

import bcrypt from 'bcryptjs';

const cleanOptionalString = (value) => {
  const trimmed = String(value || '').trim();
  return trimmed || undefined;
};

export async function PUT(req, { params }) {
  try {
    const adminUser = getUserFromCookie();
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const updateData = await req.json();

    await connectDB();

    const unsetData = {};
    if ('phone' in updateData) {
      const cleanPhone = cleanOptionalString(updateData.phone);
      if (cleanPhone) {
        updateData.phone = cleanPhone;
      } else {
        delete updateData.phone;
        unsetData.phone = '';
      }
    }

    if ('email' in updateData) {
      const cleanEmail = cleanOptionalString(updateData.email);
      if (cleanEmail) {
        updateData.email = cleanEmail;
      } else {
        delete updateData.email;
        unsetData.email = '';
      }
    }

    // Hash password if provided
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    } else {
      delete updateData.password; // Don't overwrite with empty string
    }

    if (updateData.role !== 'sub_admin') {
      updateData.adminPermissions = [];
    } else if (!Array.isArray(updateData.adminPermissions)) {
      updateData.adminPermissions = [];
    }

    const updateOperation = { $set: updateData };
    if (Object.keys(unsetData).length > 0) updateOperation.$unset = unsetData;

    const updatedUser = await User.findByIdAndUpdate(id, updateOperation, { new: true, runValidators: true });

    if (!updatedUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    if (error?.code === 11000) {
      const field = Object.keys(error.keyPattern || error.keyValue || {})[0] || 'Field';
      return NextResponse.json({ success: false, error: `${field === 'phone' ? 'Phone number' : 'Email'} already exists` }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const adminUser = getUserFromCookie();
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    await connectDB();
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

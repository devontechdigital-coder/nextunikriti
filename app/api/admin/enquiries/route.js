import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Enquiry from '@/models/Enquiry';
import '@/models/School';
import { getUserFromCookie } from '@/utils/auth';

export async function GET(req) {
  try {
    const user = getUserFromCookie();
    if (!user || !['admin', 'school_admin'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const type = searchParams.get('type');

    const query = {};
    if (status && status !== 'all') query.status = status;
    if (type && type !== 'all') query.enquiryType = type;
    if (user.role === 'school_admin') {
      if (!user.schoolId) {
        return NextResponse.json({ success: true, data: [] });
      }
      query.schoolId = user.schoolId;
    }

    const enquiries = await Enquiry.find(query)
      .populate('schoolId', 'schoolName city')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: enquiries });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const user = getUserFromCookie();
    if (!user || !['admin', 'school_admin'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id, status, notes } = await req.json();
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required.' }, { status: 400 });
    }

    await connectDB();
    const query = { _id: id };
    if (user.role === 'school_admin') query.schoolId = user.schoolId;

    const update = {};
    if (status) update.status = status;
    if (typeof notes === 'string') update.notes = notes;

    const enquiry = await Enquiry.findOneAndUpdate(query, update, { new: true });
    if (!enquiry) {
      return NextResponse.json({ success: false, error: 'Enquiry not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: enquiry });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import School from '@/models/School';
import { getUserFromCookie } from '@/utils/auth';

export async function GET(req) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');
    const status = searchParams.get('status');
    
    const query = {};
    if (city) query.city = new RegExp(city, 'i');
    if (status) query.status = status;

    const schools = await School.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, schools });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const body = await req.json();
    const school = await School.create(body);
    return NextResponse.json({ success: true, school });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

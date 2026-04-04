import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Mode from '@/models/Mode';
import { getUserFromCookie } from '@/utils/auth';

export async function GET(req) {
  try {
    const user = getUserFromCookie();
    if (!user || !['admin', 'staff'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const query = {};
    if (status) query.status = status;

    const modes = await Mode.find(query).sort({ name: 1 });
    return NextResponse.json({ success: true, modes });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = getUserFromCookie();
    if (!user || !['admin', 'staff'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const mode = await Mode.create(body);
    return NextResponse.json({ success: true, mode });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

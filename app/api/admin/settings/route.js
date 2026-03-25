import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Setting from '@/models/Setting';
import { getUserFromCookie } from '@/utils/auth';

export async function GET(req) {
  try {
    await connectDB();
    const settings = await Setting.find({});
    return NextResponse.json({ success: true, data: settings });
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

    const { settings } = await req.json(); // settings should be an array of { key, value }

    await connectDB();
    
    const bulkOps = settings.map(setting => ({
      updateOne: {
        filter: { key: setting.key },
        update: { $set: { value: setting.value } },
        upsert: true
      }
    }));

    await Setting.bulkWrite(bulkOps);

    return NextResponse.json({ success: true, message: 'Settings updated' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

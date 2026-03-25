import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Setting from '@/models/Setting';

export async function GET(req) {
  try {
    await connectDB();
    // Fetch all settings. For public use, we might want to filter sensitive keys in the future.
    // For now, all settings in this collection are assumed to be non-sensitive configuration keys.
    const settings = await Setting.find({});
    
    // Transform array of {key, value} to a single object { [key]: value } for easier consumption
    const settingsObj = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    return NextResponse.json({ success: true, data: settingsObj });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

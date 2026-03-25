import { NextResponse } from 'next/server';
import { renameFile } from '@/lib/gcs';
import { getUserFromCookie } from '@/utils/auth';

export async function PUT(req) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { oldName, newName } = await req.json();

    if (!oldName || !newName) {
      return NextResponse.json({ success: false, error: 'Old Name and New Name are required' }, { status: 400 });
    }

    await renameFile(oldName, newName);
    return NextResponse.json({ success: true, message: 'Renamed successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

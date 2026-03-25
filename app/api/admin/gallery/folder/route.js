import { NextResponse } from 'next/server';
import { createFolder } from '@/lib/gcs';
import { getUserFromCookie } from '@/utils/auth';

export async function POST(req) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { folderPath } = await req.json();

    if (!folderPath) {
      return NextResponse.json({ success: false, error: 'FolderPath is required' }, { status: 400 });
    }

    await createFolder(folderPath);
    return NextResponse.json({ success: true, message: 'Folder created successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

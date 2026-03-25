import { NextResponse } from 'next/server';
import { setupCors } from '@/lib/gcs';
import { getUserFromCookie } from '@/utils/auth';

export async function POST(req) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await setupCors();
    return NextResponse.json({ success: true, message: 'CORS configuration applied successfully' });
  } catch (error) {
    console.error('CORS Setup Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

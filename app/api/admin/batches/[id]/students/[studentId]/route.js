import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import BatchStudent from '@/models/BatchStudent';
import { getUserFromCookie } from '@/utils/auth';

export async function DELETE(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id, studentId } = params;
    
    await BatchStudent.findOneAndDelete({ batchId: id, studentId });
    
    return NextResponse.json({ success: true, message: 'Student removed from batch' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

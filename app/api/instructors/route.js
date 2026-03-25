import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function GET() {
  try {
    await connectDB();
    // Fetch only active instructors
    const instructors = await User.find({ 
      role: 'instructor', 
      status: 'active' 
    }).select('name avatar bio expertise');
    
    return NextResponse.json({ success: true, data: instructors }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

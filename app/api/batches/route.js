import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Batch from '@/models/Batch';
import Enrollment from '@/models/Enrollment';

export async function GET(req) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const course_id = searchParams.get('course_id');

        if (!course_id) {
            return NextResponse.json({ success: false, error: 'Course ID is required' }, { status: 400 });
        }

        const batches = await Batch.find({ 
            course_id, 
            status: 'active' 
        })
        .populate('teacherId', 'name avatar')
        .populate('instrument_id', 'name')
        .lean();

        // Calculate available seats for each batch
        for (const batch of batches) {
            const enrollmentCount = await Enrollment.countDocuments({ batchId: batch._id });
            batch.available_seats = Math.max(0, batch.maxStrength - enrollmentCount);
        }

        return NextResponse.json({ success: true, data: batches });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

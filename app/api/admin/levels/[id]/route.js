import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Level from '@/models/Level';
import Batch from '@/models/Batch';
import { normalizeGradeList } from '@/lib/gradeUtils';

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    const body = await req.json();
    const payload = {
      ...body,
      grades: normalizeGradeList(body?.grades),
    };
    const level = await Level.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!level) {
      return NextResponse.json({ error: 'Level not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, level });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;

    // Check if any batches are using this level name
    const level = await Level.findById(id);
    if (level) {
      const batchCount = await Batch.countDocuments({ level: level.levelName });
      if (batchCount > 0) {
        return NextResponse.json({ error: 'Cannot delete level while batches are using it.' }, { status: 400 });
      }
    }

    const deleted = await Level.findByIdAndDelete(id);
    if (!deleted) {
       return NextResponse.json({ error: 'Level not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Level deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Instrument from '@/models/Instrument';
import Level from '@/models/Level';
import Batch from '@/models/Batch';

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    const body = await req.json();
    const instrument = await Instrument.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!instrument) {
      return NextResponse.json({ error: 'Instrument not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, instrument });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;

    // Check if levels exist for this instrument
    const levelCount = await Level.countDocuments({ instrumentId: id });
    if (levelCount > 0) {
      return NextResponse.json({ error: 'Cannot delete instrument while levels are assigned to it.' }, { status: 400 });
    }

    // Since Batch uses instrument name as a string (currently), we might want to check for batches too.
    // However, the previous Batch model had 'instrument' as a String.
    // If we transition to ID, we check for ID. 
    // To be safe, we check if any batch has this instrument name.
    const instrument = await Instrument.findById(id);
    if (instrument) {
      const batchCount = await Batch.countDocuments({ instrument: instrument.name });
      if (batchCount > 0) {
        return NextResponse.json({ error: 'Cannot delete instrument while batches are using it.' }, { status: 400 });
      }
    }

    const deleted = await Instrument.findByIdAndDelete(id);
    if (!deleted) {
       return NextResponse.json({ error: 'Instrument not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Instrument deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

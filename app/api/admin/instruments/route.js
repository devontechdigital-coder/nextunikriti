import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Instrument from '@/models/Instrument';

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    
    let query = {};
    if (status) query.status = status;

    const instruments = await Instrument.find(query).sort({ name: 1 });
    return NextResponse.json({ success: true, instruments });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const instrument = await Instrument.create(body);
    return NextResponse.json({ success: true, instrument });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

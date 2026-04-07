import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Level from '@/models/Level';
import { normalizeGradeList } from '@/lib/gradeUtils';

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const instrumentId = searchParams.get('instrumentId');
    const status = searchParams.get('status');

    let query = {};
    if (instrumentId) query.instrumentId = instrumentId;
    if (status) query.status = status;

    const levels = await Level.find(query).sort({ instrumentId: 1, orderNo: 1 });
    return NextResponse.json({ success: true, levels });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const payload = {
      ...body,
      grades: normalizeGradeList(body?.grades),
    };
    const level = await Level.create(payload);
    return NextResponse.json({ success: true, level });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

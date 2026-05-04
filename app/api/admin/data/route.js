import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { adminDataModels, resolveAdminDataModels } from '@/lib/adminDataModels';
import { getUserFromCookie } from '@/utils/auth';

function requireAdmin() {
  const user = getUserFromCookie();
  return user?.role === 'admin';
}

function parseModelKeys(searchParams) {
  const rawModels = searchParams.get('models') || '';
  return rawModels
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean);
}

function buildFileName() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `nextlms-data-export-${stamp}.json`;
}

export async function GET(req) {
  try {
    if (!requireAdmin()) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'models';

    if (action === 'export') {
      const requestedKeys = parseModelKeys(searchParams);
      const selectedModels = resolveAdminDataModels(requestedKeys.length ? requestedKeys : ['all']);

      if (!selectedModels.length) {
        return NextResponse.json({ success: false, error: 'Select at least one valid model.' }, { status: 400 });
      }

      const data = {};
      const counts = {};

      for (const entry of selectedModels) {
        const documents = await entry.model.find({}).lean();
        data[entry.key] = documents;
        counts[entry.key] = documents.length;
      }

      const payload = {
        app: 'next-lms',
        version: 1,
        exportedAt: new Date().toISOString(),
        models: selectedModels.map(({ key, label }) => ({ key, label })),
        counts,
        data,
      };

      return new NextResponse(JSON.stringify(payload, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${buildFileName()}"`,
        },
      });
    }

    const models = await Promise.all(
      adminDataModels.map(async ({ key, label, model }) => ({
        key,
        label,
        collection: model.collection.name,
        count: await model.countDocuments({}),
      }))
    );

    return NextResponse.json({ success: true, data: models });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    if (!requireAdmin()) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const payload = body?.payload;
    const importData = payload?.data || payload;
    const mode = body?.mode === 'replace' ? 'replace' : 'upsert';
    const requestedKeys = Array.isArray(body?.models) ? body.models : [];

    if (!importData || typeof importData !== 'object' || Array.isArray(importData)) {
      return NextResponse.json({ success: false, error: 'Upload a valid export JSON file.' }, { status: 400 });
    }

    await connectDB();

    const selectedModels = resolveAdminDataModels(requestedKeys.length ? requestedKeys : Object.keys(importData));
    const result = {};

    for (const entry of selectedModels) {
      const documents = importData[entry.key];
      if (!Array.isArray(documents)) {
        result[entry.key] = { skipped: true, reason: 'No array found in import file.' };
        continue;
      }

      if (mode === 'replace') {
        await entry.model.deleteMany({});
        if (documents.length) {
          await entry.model.insertMany(documents, { ordered: false });
        }
        result[entry.key] = { mode, imported: documents.length };
        continue;
      }

      if (!documents.length) {
        result[entry.key] = { mode, imported: 0 };
        continue;
      }

      const operations = documents.map((document) => ({
        replaceOne: {
          filter: { _id: document._id },
          replacement: document,
          upsert: true,
        },
      }));

      const writeResult = await entry.model.bulkWrite(operations, { ordered: false });
      result[entry.key] = {
        mode,
        imported: documents.length,
        inserted: writeResult.upsertedCount || 0,
        modified: writeResult.modifiedCount || 0,
      };
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

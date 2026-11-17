import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { FEATURE_CHAT_MODE } from '@/config/featureChatConfig';

let featureTableReady = false;

async function ensureFeatureTable() {
  if (featureTableReady) return;
  await db.execute(`
    CREATE TABLE IF NOT EXISTS feature_requests (
      id SERIAL PRIMARY KEY,
      author TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
  featureTableReady = true;
}

export async function GET() {
  if (FEATURE_CHAT_MODE === 'false') {
    return NextResponse.json({ mode: 'false', items: [] });
  }

  try {
    await ensureFeatureTable();
    const res = await db.execute(
      `SELECT id, author, message, to_char(created_at AT TIME ZONE 'Europe/Rome', 'DD/MM HH24:MI') as created_at
       FROM feature_requests
       ORDER BY id DESC
       LIMIT 100`
    );
    return NextResponse.json({ mode: FEATURE_CHAT_MODE, items: res.rows });
  } catch (err) {
    console.error('Errore GET /api/features:', err);
    return NextResponse.json({ mode: FEATURE_CHAT_MODE, items: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (FEATURE_CHAT_MODE !== 'true') {
    return NextResponse.json({ error: 'Invio disabilitato nella modalità corrente.' }, { status: 403 });
  }

  try {
    await ensureFeatureTable();
    const body = await request.json();
    const author = String(body.author || '').trim().slice(0, 40) || 'Pilota';
    const message = String(body.message || '').trim().slice(0, 400);

    if (!message) {
      return NextResponse.json({ error: 'Il messaggio non può essere vuoto.' }, { status: 400 });
    }

    await db.execute({
      sql: 'INSERT INTO feature_requests (author, message) VALUES (?, ?)',
      args: [author, message],
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Errore POST /api/features:', err);
    return NextResponse.json({ error: 'Errore salvataggio richiesta.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (FEATURE_CHAT_MODE !== 'developer') {
    return NextResponse.json({ error: 'Azione consentita solo in modalità developer.' }, { status: 403 });
  }

  try {
    await ensureFeatureTable();
    const { searchParams } = new URL(request.url);
    const wipe = searchParams.get('wipe');
    const id = searchParams.get('id');

    if (wipe === 'all') {
      await db.execute('TRUNCATE TABLE feature_requests RESTART IDENTITY');
      return NextResponse.json({ ok: true });
    }

    if (id) {
      await db.execute({
        sql: 'DELETE FROM feature_requests WHERE id = ?',
        args: [Number(id)],
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Parametro mancante.' }, { status: 400 });
  } catch (err) {
    console.error('Errore DELETE /api/features:', err);
    return NextResponse.json({ error: 'Errore eliminazione.' }, { status: 500 });
  }
}

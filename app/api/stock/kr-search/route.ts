import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: '검색어를 입력하세요.' }, { status: 400 });
  }

  try {
    const [rows]: any = await pool.execute(
      `SELECT symbol, name FROM kr_stocks
       WHERE name LIKE ? OR symbol LIKE ?
       LIMIT 8`,
      [`%${query}%`, `%${query}%`]
    );

    const results = rows.map((r: any) => ({ symbol: r.symbol, name: r.name }));
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}

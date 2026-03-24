import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import pool from '@/lib/db';

// 관심종목 조회
export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const { userId } = verifyToken(token);

  const [accounts]: any = await pool.execute(
    'SELECT id FROM accounts WHERE user_id = ?', [userId]
  );
  const account = accounts[0];

  const [items]: any = await pool.execute(
    `SELECT w.symbol_code, s.name
     FROM watchlist_items w
     JOIN symbols s ON w.symbol_code = s.code
     WHERE w.account_id = ?`,
    [account.id]
  );

  return NextResponse.json({ items });
}

// 관심종목 추가
export async function POST(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const { userId } = verifyToken(token);
  const { symbol, name } = await req.json();

  const [accounts]: any = await pool.execute(
    'SELECT id FROM accounts WHERE user_id = ?', [userId]
  );
  const account = accounts[0];

  await pool.execute(
    `INSERT IGNORE INTO symbols (code, name, market) VALUES (?, ?, 'US')`,
    [symbol, name ?? symbol]
  );

  await pool.execute(
    `INSERT IGNORE INTO watchlist_items (account_id, symbol_code) VALUES (?, ?)`,
    [account.id, symbol]
  );

  return NextResponse.json({ ok: true });
}

// 관심종목 삭제
export async function DELETE(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const { userId } = verifyToken(token);
  const { symbol } = await req.json();

  const [accounts]: any = await pool.execute(
    'SELECT id FROM accounts WHERE user_id = ?', [userId]
  );
  const account = accounts[0];

  await pool.execute(
    'DELETE FROM watchlist_items WHERE account_id = ? AND symbol_code = ?',
    [account.id, symbol]
  );

  return NextResponse.json({ ok: true });
}

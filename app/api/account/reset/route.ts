import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import pool from '@/lib/db';

const INITIAL_BALANCE = 10_000_000;

export async function POST(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: '인증 만료' }, { status: 401 });
  const { userId } = decoded;

  const conn = await pool.getConnection();
  try {
    const [accounts]: any = await conn.execute(
      'SELECT id FROM accounts WHERE user_id = ?', [userId]
    );
    if (accounts.length === 0) return NextResponse.json({ error: '계좌 없음' }, { status: 404 });
    const account = accounts[0];

    await conn.execute('DELETE FROM positions WHERE account_id = ?', [account.id]);
    await conn.execute('DELETE FROM orders WHERE account_id = ?', [account.id]);
    await conn.execute(
      'UPDATE accounts SET cash_balance = ? WHERE id = ?',
      [INITIAL_BALANCE, account.id]
    );

    return NextResponse.json({ ok: true });
  } finally {
    conn.release();
  }
}

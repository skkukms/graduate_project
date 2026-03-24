import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const { userId } = verifyToken(token);

  const [accounts]: any = await pool.execute(
    'SELECT id FROM accounts WHERE user_id = ?', [userId]
  );
  const account = accounts[0];

  const [orders]: any = await pool.execute(
    `SELECT o.id, o.symbol_code, s.name, o.side, o.qty, o.fill_price, o.created_at
     FROM orders o
     JOIN symbols s ON o.symbol_code = s.code
     WHERE o.account_id = ?
     ORDER BY o.created_at DESC
     LIMIT 20`,
    [account.id]
  );

  return NextResponse.json({ orders });
}

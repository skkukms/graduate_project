import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import pool from '@/lib/db';
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance({ validation: { logErrors: false } });

async function getAccount(token: string) {
  const decoded = verifyToken(token);
  if (!decoded) return null;
  const [accounts]: any = await pool.execute(
    'SELECT id FROM accounts WHERE user_id = ?', [decoded.userId]
  );
  return accounts[0] ?? null;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const account = await getAccount(token);
  if (!account) return NextResponse.json({ error: '인증 만료 또는 계좌 없음' }, { status: 401 });

  const [items]: any = await pool.execute(
    `SELECT w.symbol_code, s.name
     FROM watchlist_items w
     JOIN symbols s ON w.symbol_code = s.code
     WHERE w.account_id = ?`,
    [account.id]
  );

  const itemsWithQuotes = await Promise.all(
    items.map(async (item: any) => {
      try {
        const quote = await yf.quote(item.symbol_code) as any;
        return {
          ...item,
          current: quote.regularMarketPrice ?? 0,
          changePercent: quote.regularMarketChangePercent ?? 0,
        };
      } catch {
        return { ...item, current: 0, changePercent: 0 };
      }
    })
  );

  return NextResponse.json({ items: itemsWithQuotes });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const account = await getAccount(token);
  if (!account) return NextResponse.json({ error: '인증 만료 또는 계좌 없음' }, { status: 401 });

  const { symbol, name } = await req.json();
  const market = symbol.endsWith('.KS') ? 'KOSPI' : symbol.endsWith('.KQ') ? 'KOSDAQ' : 'US';

  await pool.execute(
    `INSERT IGNORE INTO symbols (code, name, market) VALUES (?, ?, ?)`,
    [symbol, name ?? symbol, market]
  );
  await pool.execute(
    `INSERT IGNORE INTO watchlist_items (account_id, symbol_code) VALUES (?, ?)`,
    [account.id, symbol]
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const account = await getAccount(token);
  if (!account) return NextResponse.json({ error: '인증 만료 또는 계좌 없음' }, { status: 401 });

  const { symbol } = await req.json();
  await pool.execute(
    'DELETE FROM watchlist_items WHERE account_id = ? AND symbol_code = ?',
    [account.id, symbol]
  );

  return NextResponse.json({ ok: true });
}

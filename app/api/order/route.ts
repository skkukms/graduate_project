import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import pool from '@/lib/db';
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance({ validation: { logErrors: false } });

export async function POST(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: '인증 만료' }, { status: 401 });
  const { userId } = decoded;
  const { symbol, side, qty } = await req.json();

  if (!symbol || !side || !qty || qty <= 0) {
    return NextResponse.json({ error: '올바른 주문 정보를 입력하세요.' }, { status: 400 });
  }

  const isKorean = symbol.endsWith('.KS') || symbol.endsWith('.KQ');

  // 현재가 조회 (Yahoo Finance)
  let result: any;
  try {
    result = await yf.quote(symbol);
  } catch {
    return NextResponse.json({ error: '시세 조회 실패' }, { status: 400 });
  }

  const fillPrice = result.regularMarketPrice ?? 0;
  if (!fillPrice || fillPrice <= 0) {
    return NextResponse.json({ error: '시세 조회 실패' }, { status: 400 });
  }

  // 환율 변환 (국내주식은 이미 원화)
  let fillPriceKrw: number;
  if (isKorean) {
    fillPriceKrw = fillPrice;
  } else {
    try {
      const fxRes = await fetch(
        'https://query1.finance.yahoo.com/v8/finance/chart/USDKRW=X?interval=1d&range=1d',
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      );
      const fxData = await fxRes.json();
      const usdToKrw = fxData.chart?.result?.[0]?.meta?.regularMarketPrice ?? 1350;
      fillPriceKrw = fillPrice * usdToKrw;
    } catch {
      fillPriceKrw = fillPrice * 1350;
    }
  }

  const conn = await pool.getConnection();
  try {
    // symbols 테이블 등록 (실제 종목명 저장)
    const stockName = result.longName ?? result.shortName ?? symbol;
    await conn.execute(
      `INSERT INTO symbols (code, name, market) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [symbol, stockName, symbol.endsWith('.KS') ? 'KOSPI' : symbol.endsWith('.KQ') ? 'KOSDAQ' : 'US']
    );

    // 계좌 조회
    const [accounts]: any = await conn.execute(
      'SELECT id, cash_balance FROM accounts WHERE user_id = ?',
      [userId]
    );
    if (accounts.length === 0) return NextResponse.json({ error: '계좌 없음' }, { status: 404 });
    const account = accounts[0];
    const totalCost = fillPriceKrw * qty;
    let realizedPnl: number | null = null;

    if (side === 'BUY') {
      if (account.cash_balance < totalCost) {
        return NextResponse.json({ error: '잔고가 부족합니다.' }, { status: 400 });
      }

      await conn.execute(
        'UPDATE accounts SET cash_balance = cash_balance - ? WHERE id = ?',
        [totalCost, account.id]
      );

      await conn.execute(
        `INSERT INTO positions (account_id, symbol_code, quantity, avg_price)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           avg_price = (avg_price * quantity + ? * ?) / (quantity + ?),
           quantity = quantity + ?`,
        [account.id, symbol, qty, fillPriceKrw, fillPriceKrw, qty, qty, qty]
      );

    } else if (side === 'SELL') {
      const [positions]: any = await conn.execute(
        'SELECT quantity, avg_price FROM positions WHERE account_id = ? AND symbol_code = ?',
        [account.id, symbol]
      );

      if (positions.length === 0 || positions[0].quantity < qty) {
        return NextResponse.json({ error: '보유 수량이 부족합니다.' }, { status: 400 });
      }

      const avgPrice = Number(positions[0].avg_price);
      realizedPnl = Math.round((fillPriceKrw - avgPrice) * qty);

      await conn.execute(
        'UPDATE accounts SET cash_balance = cash_balance + ? WHERE id = ?',
        [totalCost, account.id]
      );

      await conn.execute(
        `UPDATE positions SET
           quantity = quantity - ?,
           realized_pnl = realized_pnl + ?
         WHERE account_id = ? AND symbol_code = ?`,
        [qty, realizedPnl, account.id, symbol]
      );

      await conn.execute(
        'DELETE FROM positions WHERE account_id = ? AND symbol_code = ? AND quantity = 0',
        [account.id, symbol]
      );
    }

    await conn.execute(
      'INSERT INTO orders (account_id, symbol_code, side, qty, fill_price, fill_price_usd, realized_pnl) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [account.id, symbol, side, qty, fillPriceKrw, isKorean ? null : fillPrice, realizedPnl]
    );

    return NextResponse.json({ ok: true, fillPrice: fillPriceKrw, fillPriceUsd: isKorean ? null : fillPrice });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? '주문 처리 중 오류가 발생했습니다.' }, { status: 500 });
  } finally {
    conn.release();
  }
}

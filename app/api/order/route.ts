import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const { userId } = verifyToken(token);
  const { symbol, side, qty } = await req.json();

  if (!symbol || !side || !qty || qty <= 0) {
    return NextResponse.json({ error: '올바른 주문 정보를 입력하세요.' }, { status: 400 });
  }

  // 현재가 조회
  const quoteRes = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`
  );
  const quoteData = await quoteRes.json();
  const fillPrice = quoteData.c;

  if (!fillPrice || fillPrice <= 0) {
    return NextResponse.json({ error: '시세 조회 실패' }, { status: 400 });
  }

  const conn = await pool.getConnection();
  
    await conn.execute(
    `INSERT INTO symbols (code, name, market) VALUES (?, ?, 'US')
    ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    [symbol, symbol]
    );

    const fxRes = await fetch(
  `https://finnhub.io/api/v1/forex/rates?base=USD&token=${process.env.FINNHUB_API_KEY}`
    );
    const fxData = await fxRes.json();
    const usdToKrw = fxData.quote?.KRW ?? 1350;

    const fillPriceKrw = fillPrice * usdToKrw;

  try {
    // 계좌 조회
    const [accounts]: any = await conn.execute(
      'SELECT id, cash_balance FROM accounts WHERE user_id = ?',
      [userId]
    );
    const account = accounts[0];
    const totalCost = fillPriceKrw * qty;

    if (side === 'BUY') {
      if (account.cash_balance < totalCost) {
        return NextResponse.json({ error: '잔고가 부족합니다.' }, { status: 400 });
      }

      // 잔고 차감
      await conn.execute(
        'UPDATE accounts SET cash_balance = cash_balance - ? WHERE id = ?',
        [totalCost, account.id]
      );

      // 포지션 업데이트
      await conn.execute(
        `INSERT INTO positions (account_id, symbol_code, quantity, avg_price)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           avg_price = (avg_price * quantity + ? * ?) / (quantity + ?),
           quantity = quantity + ?`,
        [account.id, symbol, qty, fillPriceKrw, fillPriceKrw, qty, qty, qty]
      );

    } else if (side === 'SELL') {
      // 보유 수량 확인
      const [positions]: any = await conn.execute(
        'SELECT quantity FROM positions WHERE account_id = ? AND symbol_code = ?',
        [account.id, symbol]
      );

      if (positions.length === 0 || positions[0].quantity < qty) {
        return NextResponse.json({ error: '보유 수량이 부족합니다.' }, { status: 400 });
      }

      // 잔고 추가
      await conn.execute(
        'UPDATE accounts SET cash_balance = cash_balance + ? WHERE id = ?',
        [totalCost, account.id]
      );

      // 포지션 업데이트
      await conn.execute(
        'UPDATE positions SET quantity = quantity - ? WHERE account_id = ? AND symbol_code = ?',
        [qty, account.id, symbol]
      );

      // 수량 0이면 삭제
      await conn.execute(
        'DELETE FROM positions WHERE account_id = ? AND symbol_code = ? AND quantity = 0',
        [account.id, symbol]
      );
    }

    // 주문 기록
    await conn.execute(
      'INSERT INTO orders (account_id, symbol_code, side, qty, fill_price) VALUES (?, ?, ?, ?, ?)',
      [account.id, symbol, side, qty, fillPriceKrw]
    );

    return NextResponse.json({ ok: true, fillPrice });
  } finally {
    conn.release();
  }
}

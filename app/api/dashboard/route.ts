import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const { userId } = verifyToken(token);

  const [accounts]: any = await pool.execute(
    'SELECT id, cash_balance FROM accounts WHERE user_id = ?',
    [userId]
  );

  if (accounts.length === 0) {
    return NextResponse.json({ error: '계좌 없음' }, { status: 404 });
  }

  const account = accounts[0];

  const [positions]: any = await pool.execute(
    `SELECT p.symbol_code, p.quantity, p.avg_price, p.realized_pnl, s.name
     FROM positions p
     JOIN symbols s ON p.symbol_code = s.code
     WHERE p.account_id = ? AND p.quantity > 0`,
    [account.id]
  );

  // 환율 조회
  const fxRes = await fetch(
    `https://finnhub.io/api/v1/forex/rates?base=USD&token=${process.env.FINNHUB_API_KEY}`
  );
  const fxData = await fxRes.json();
  const usdToKrw = fxData.quote?.KRW ?? 1350;

  // 각 종목 현재가 조회 후 평가손익 계산
  const positionsWithPnl = await Promise.all(
    positions.map(async (p: any) => {
      const quoteRes = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${p.symbol_code}&token=${process.env.FINNHUB_API_KEY}`
      );
      const quoteData = await quoteRes.json();
      const currentPriceKrw = quoteData.c * usdToKrw;
      const evalAmount = currentPriceKrw * p.quantity;
      const investAmount = p.avg_price * p.quantity;
      const unrealizedPnl = evalAmount - investAmount;
      const unrealizedPnlRate = (unrealizedPnl / investAmount) * 100;

      return {
        ...p,
        currentPrice: currentPriceKrw,
        evalAmount,
        unrealizedPnl,
        unrealizedPnlRate,
      };
    })
  );

  // 총 평가금액, 총 손익
  const totalEval = positionsWithPnl.reduce((sum, p) => sum + p.evalAmount, 0);
  const totalUnrealizedPnl = positionsWithPnl.reduce((sum, p) => sum + p.unrealizedPnl, 0);

  return NextResponse.json({
    cashBalance: account.cash_balance,
    totalEval,
    totalUnrealizedPnl,
    positions: positionsWithPnl,
  });
}

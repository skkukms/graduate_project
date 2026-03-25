import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import pool from '@/lib/db';
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'], validation: { logErrors: false } });

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

  // 환율 조회 (Yahoo Finance)
  const fxRes = await fetch(
    'https://query1.finance.yahoo.com/v8/finance/chart/USDKRW=X?interval=1d&range=1d',
    { headers: { 'User-Agent': 'Mozilla/5.0' } }
  );
  const fxData = await fxRes.json();
  const usdToKrw = fxData.chart?.result?.[0]?.meta?.regularMarketPrice ?? 1350;

  const positionsWithPnl = await Promise.all(
    positions.map(async (p: any) => {
      const isKorean = p.symbol_code.endsWith('.KS') || p.symbol_code.endsWith('.KQ');

      try {
        const quote = await yf.quote(p.symbol_code) as any;
        const rawPrice = quote.regularMarketPrice ?? 0;
        const currentPriceKrw = isKorean ? rawPrice : rawPrice * usdToKrw;

        // 국내주식 이름 가져오기
        const displayName = isKorean
          ? (quote.longName ?? quote.shortName ?? p.name)
          : p.name;

        const evalAmount = currentPriceKrw * p.quantity;
        const investAmount = p.avg_price * p.quantity;
        const unrealizedPnl = evalAmount - investAmount;
        const unrealizedPnlRate = investAmount > 0 ? (unrealizedPnl / investAmount) * 100 : 0;

        return {
          ...p,
          name: displayName,
          currentPrice: currentPriceKrw,
          evalAmount,
          unrealizedPnl,
          unrealizedPnlRate,
        };
      } catch {
        return {
          ...p,
          currentPrice: 0,
          evalAmount: 0,
          unrealizedPnl: 0,
          unrealizedPnlRate: 0,
        };
      }
    })
  );

  const totalEval = positionsWithPnl.reduce((sum, p) => sum + p.evalAmount, 0);
  const totalUnrealizedPnl = positionsWithPnl.reduce((sum, p) => sum + p.unrealizedPnl, 0);

  return NextResponse.json({
    cashBalance: account.cash_balance,
    totalEval,
    totalUnrealizedPnl,
    positions: positionsWithPnl,
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import pool from '@/lib/db';
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'], validation: { logErrors: false } });

export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: '인증 만료' }, { status: 401 });
  const { userId } = decoded;

  const [accounts]: any = await pool.execute(
    'SELECT id, cash_balance FROM accounts WHERE user_id = ?',
    [userId]
  );

  if (accounts.length === 0) {
    return NextResponse.json({ error: '계좌 없음' }, { status: 404 });
  }

  const account = accounts[0];
  const cashBalance = Math.round(Number(account.cash_balance));

  const [positions]: any = await pool.execute(
    `SELECT p.symbol_code, p.quantity, p.avg_price, p.realized_pnl, s.name
     FROM positions p
     JOIN symbols s ON p.symbol_code = s.code
     WHERE p.account_id = ? AND p.quantity > 0`,
    [account.id]
  );

  // 환율 조회
  let usdToKrw = 1350;
  try {
    const fxRes = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/USDKRW=X?interval=1d&range=1d',
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    const fxData = await fxRes.json();
    usdToKrw = fxData.chart?.result?.[0]?.meta?.regularMarketPrice ?? 1350;
  } catch {
    usdToKrw = 1350;
  }

  const positionsWithPnl = await Promise.all(
    positions.map(async (p: any) => {
      const isKorean = p.symbol_code.endsWith('.KS') || p.symbol_code.endsWith('.KQ');

      try {
        const quote = await yf.quote(p.symbol_code) as any;
        const rawPrice = quote.regularMarketPrice ?? 0;
        const currentPriceKrw = Math.round(isKorean ? rawPrice : rawPrice * usdToKrw);

        const displayName = quote.longName ?? quote.shortName ?? p.name;

        // symbols 이름이 코드로 저장된 경우 업데이트
        if (p.name === p.symbol_code || !p.name) {
          await pool.execute('UPDATE symbols SET name = ? WHERE code = ?', [displayName, p.symbol_code]);
        }

        const evalAmount = Math.round(currentPriceKrw * p.quantity);
        const investAmount = Math.round(Number(p.avg_price) * p.quantity);
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
  const totalRealizedPnl = positionsWithPnl.reduce((sum, p) => sum + Math.round(Number(p.realized_pnl ?? 0)), 0);
  const totalAsset = cashBalance + totalEval;

  return NextResponse.json({
    cashBalance,
    totalEval,
    totalUnrealizedPnl,
    totalRealizedPnl,
    totalAsset,
    positions: positionsWithPnl,
  });
}

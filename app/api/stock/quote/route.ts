import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance({ validation: { logErrors: false } });

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: '종목 코드를 입력하세요.' }, { status: 400 });
  }

  try {
    const result = await yf.quote(symbol);
    const isKorean = symbol.endsWith('.KS') || symbol.endsWith('.KQ');

    let usdToKrw: number | undefined;
    if (!isKorean) {
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
    }

    return NextResponse.json({
      symbol,
      name: result.longName ?? result.shortName ?? symbol,
      current: result.regularMarketPrice ?? 0,
      open: result.regularMarketOpen ?? 0,
      high: result.regularMarketDayHigh ?? 0,
      low: result.regularMarketDayLow ?? 0,
      prevClose: result.regularMarketPreviousClose ?? 0,
      change: result.regularMarketChange ?? 0,
      changePercent: result.regularMarketChangePercent ?? 0,
      ...(usdToKrw !== undefined && { usdToKrw }),
    });
  } catch {
    return NextResponse.json({ error: '시세 조회 실패' }, { status: 500 });
  }
}

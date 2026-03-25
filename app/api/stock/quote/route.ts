import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance({ validation: { logErrors: false } });

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: '종목 코드를 입력하세요.' }, { status: 400 });
  }

  const result = await yf.quote(symbol);

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
});
}

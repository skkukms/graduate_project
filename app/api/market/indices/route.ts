import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'], validation: { logErrors: false } });

const INDICES = [
  { symbol: '^IXIC', name: '나스닥', locale: 'US' },
  { symbol: '^GSPC', name: 'S&P 500', locale: 'US' },
  { symbol: '^KS11', name: 'KOSPI', locale: 'KR' },
  { symbol: '^KQ11', name: 'KOSDAQ', locale: 'KR' },
];

export async function GET() {
  const results = await Promise.all(
    INDICES.map(async (idx) => {
      try {
        const to = new Date();
        const from = new Date();
        from.setHours(0, 0, 0, 0);

        const [quote, chart] = await Promise.all([
          yf.quote(idx.symbol) as any,
          yf.chart(idx.symbol, { period1: from, period2: to, interval: '5m' }),
        ]);

        const prices = chart.quotes
          .filter((q: any) => q.close != null)
          .map((q: any) => q.close as number);

        return {
          symbol: idx.symbol,
          name: idx.name,
          price: quote.regularMarketPrice ?? 0,
          change: quote.regularMarketChange ?? 0,
          changePercent: quote.regularMarketChangePercent ?? 0,
          prices,
        };
      } catch {
        return {
          symbol: idx.symbol,
          name: idx.name,
          price: 0,
          change: 0,
          changePercent: 0,
          prices: [],
        };
      }
    })
  );

  return NextResponse.json({ indices: results });
}

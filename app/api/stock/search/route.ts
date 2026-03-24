import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance({ validation: { logErrors: false } });

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: '검색어를 입력하세요.' }, { status: 400 });
  }

  const results = await yf.search(query);

  const filtered = results.quotes
    ?.filter((item: any) => item.quoteType === 'EQUITY' && item.symbol && !item.symbol.includes('.'))
    .slice(0, 8)
    .map((item: any) => ({
      symbol: item.symbol,
      name: item.shortname ?? item.longname ?? item.symbol,
    })) ?? [];

  return NextResponse.json({ results: filtered });
}

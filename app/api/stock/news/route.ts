import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: '종목 코드를 입력하세요.' }, { status: 400 });
  }

  const to = new Date().toISOString().split('T')[0];
  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const res = await fetch(
    `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${process.env.FINNHUB_API_KEY}`
  );

  const data = await res.json();
  const news = data.slice(0, 10).map((item: any) => ({
    id: item.id,
    headline: item.headline,
    summary: item.summary,
    url: item.url,
    source: item.source,
    datetime: item.datetime,
    image: item.image,
  }));

  return NextResponse.json({ news });
}

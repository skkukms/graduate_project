import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: '종목 코드를 입력하세요.' }, { status: 400 });
  }

  const res = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`
  );

  const data = await res.json();

  return NextResponse.json({
    symbol,
    current: data.c,      // 현재가
    open: data.o,         // 시가
    high: data.h,         // 고가
    low: data.l,          // 저가
    prevClose: data.pc,   // 전일 종가
    change: data.d,       // 변동액
    changePercent: data.dp, // 변동률
  });
}

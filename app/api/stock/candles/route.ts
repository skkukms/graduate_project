import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance({ validation: { logErrors: false } });

// 인터벌별 최대 기간 제한 (Yahoo Finance 제약)
const INTERVAL_MAX_DAYS: Record<string, number> = {
  '1m':  7,
  '5m':  60,
  '15m': 60,
  '30m': 60,
  '1h':  730,
  '1d':  3650,
  '1wk': 3650,
  '1mo': 3650,
};

const PERIOD_DAYS: Record<string, number> = {
  '1D':  1,
  '3D':  3,
  '1W':  7,
  '1M':  30,
  '3M':  90,
  '6M':  180,
  '1Y':  365,
  '2Y':  730,
  '5Y':  1825,
  'MAX': 3650,
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol');
  const interval = searchParams.get('interval') ?? '1d';
  const period = searchParams.get('period') ?? '1Y';

  if (!symbol) {
    return NextResponse.json({ error: '종목 코드를 입력하세요.' }, { status: 400 });
  }

  const maxDays = INTERVAL_MAX_DAYS[interval] ?? 365;
  const requestedDays = PERIOD_DAYS[period] ?? 365;
  const days = Math.min(requestedDays, maxDays);

  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);

  try {
    const result = await yf.chart(symbol, {
      period1: from,
      period2: to,
      interval: interval as any,
    });

    const candles: any[] = [];
    const volumes: any[] = [];

    for (const q of result.quotes) {
      if (!q.open || !q.high || !q.low || !q.close) continue;
      const time = Math.floor(new Date(q.date).getTime() / 1000);
      candles.push({ time, open: q.open, high: q.high, low: q.low, close: q.close });
      volumes.push({
        time,
        value: q.volume ?? 0,
        color: q.close >= q.open ? 'rgba(239,68,68,0.4)' : 'rgba(59,130,246,0.4)',
      });
    }

    return NextResponse.json({ candles, volumes });
  } catch {
    return NextResponse.json({ error: '차트 데이터 조회 실패' }, { status: 500 });
  }
}

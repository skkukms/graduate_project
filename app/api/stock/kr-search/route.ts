import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance({ validation: { logErrors: false } });

// 주요 국내 종목 목록 (검색용)
const KR_STOCKS = [
  { symbol: '005930.KS', name: '삼성전자' },
  { symbol: '000660.KS', name: 'SK하이닉스' },
  { symbol: '005380.KS', name: '현대차' },
  { symbol: '035420.KS', name: 'NAVER' },
  { symbol: '035720.KS', name: '카카오' },
  { symbol: '005490.KS', name: 'POSCO홀딩스' },
  { symbol: '051910.KS', name: 'LG화학' },
  { symbol: '006400.KS', name: '삼성SDI' },
  { symbol: '028260.KS', name: '삼성물산' },
  { symbol: '012330.KS', name: '현대모비스' },
  { symbol: '068270.KS', name: '셀트리온' },
  { symbol: '207940.KS', name: '삼성바이오로직스' },
  { symbol: '003550.KS', name: 'LG' },
  { symbol: '096770.KS', name: 'SK이노베이션' },
  { symbol: '017670.KS', name: 'SK텔레콤' },
  { symbol: '030200.KS', name: 'KT' },
  { symbol: '055550.KS', name: '신한지주' },
  { symbol: '105560.KS', name: 'KB금융' },
  { symbol: '086790.KS', name: '하나금융지주' },
  { symbol: '032830.KS', name: '삼성생명' },
  { symbol: '018260.KS', name: '삼성에스디에스' },
  { symbol: '009150.KS', name: '삼성전기' },
  { symbol: '066570.KS', name: 'LG전자' },
  { symbol: '003490.KS', name: '대한항공' },
  { symbol: '011200.KS', name: 'HMM' },
  { symbol: '373220.KS', name: 'LG에너지솔루션' },
  { symbol: '247540.KS', name: '에코프로비엠' },
  { symbol: '086520.KS', name: '에코프로' },
  { symbol: '091990.KS', name: '셀트리온헬스케어' },
  { symbol: '323410.KS', name: '카카오뱅크' },
  // 코스닥
  { symbol: '293490.KQ', name: '카카오게임즈' },
  { symbol: '112040.KQ', name: '위메이드' },
  { symbol: '263750.KQ', name: '펄어비스' },
  { symbol: '041510.KQ', name: '에스엠' },
  { symbol: '035900.KQ', name: 'JYP Ent.' },
  { symbol: '122870.KQ', name: '와이지엔터테인먼트' },
  { symbol: '357780.KQ', name: '솔브레인' },
  { symbol: '196170.KQ', name: '알테오젠' },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: '검색어를 입력하세요.' }, { status: 400 });
  }

  const filtered = KR_STOCKS.filter(
    (s) =>
      s.name.includes(query) ||
      s.symbol.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8);

  return NextResponse.json({ results: filtered });
}

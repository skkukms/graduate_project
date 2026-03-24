'use client';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createChart, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import NewsPanel from './NewsPanel';


function calcMA(candles: any[], period: number) {
  return candles.map((c, i) => {
    if (i < period - 1) return null;
    const slice = candles.slice(i - period + 1, i + 1);
    const avg = slice.reduce((sum: number, x: any) => sum + x.close, 0) / period;
    return { time: c.time as import('lightweight-charts').Time, value: avg };
  }).filter((x): x is { time: import('lightweight-charts').Time; value: number } => x !== null);
}

const INTERVALS = [
  { label: '1분',   value: '1m'  },
  { label: '5분',   value: '5m'  },
  { label: '15분',  value: '15m' },
  { label: '30분',  value: '30m' },
  { label: '1시간', value: '1h'  },
  { label: '일봉',  value: '1d'  },
  { label: '주봉',  value: '1wk' },
  { label: '월봉',  value: '1mo' },
];

const PERIOD_OPTIONS: Record<string, { label: string; value: string }[]> = {
  '1m':  [{ label: '1일', value: '1D' }, { label: '3일', value: '3D' }, { label: '1주', value: '1W' }],
  '5m':  [{ label: '1일', value: '1D' }, { label: '3일', value: '3D' }, { label: '1주', value: '1W' }, { label: '1개월', value: '1M' }],
  '15m': [{ label: '3일', value: '3D' }, { label: '1주', value: '1W' }, { label: '1개월', value: '1M' }],
  '30m': [{ label: '1주', value: '1W' }, { label: '1개월', value: '1M' }, { label: '3개월', value: '3M' }],
  '1h':  [{ label: '1개월', value: '1M' }, { label: '3개월', value: '3M' }, { label: '6개월', value: '6M' }, { label: '1년', value: '1Y' }],
  '1d':  [{ label: '3개월', value: '3M' }, { label: '6개월', value: '6M' }, { label: '1년', value: '1Y' }, { label: '2년', value: '2Y' }, { label: '5년', value: '5Y' }],
  '1wk': [{ label: '1년', value: '1Y' }, { label: '2년', value: '2Y' }, { label: '5년', value: '5Y' }, { label: '전체', value: 'MAX' }],
  '1mo': [{ label: '2년', value: '2Y' }, { label: '5년', value: '5Y' }, { label: '전체', value: 'MAX' }],
};

export default function ChartPage() {
  const searchParams = useSearchParams();
  const initialSymbol = searchParams.get('symbol') ?? 'AAPL';

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [symbol, setSymbol] = useState(initialSymbol);
  const [input, setInput] = useState(initialSymbol);
  const [interval, setInterval] = useState('1d');
  const [period, setPeriod] = useState('1Y');
  const [showMA5, setShowMA5] = useState(true);
  const [showMA20, setShowMA20] = useState(true);
  const [showMA60, setShowMA60] = useState(true);
  const [ohlcv, setOhlcv] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<{ symbol: string; name: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 주문 관련
  const [qty, setQty] = useState(1);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderMessage, setOrderMessage] = useState('');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

  // 현재가 조회
  useEffect(() => {
    fetch(`/api/stock/quote?symbol=${symbol}`)
      .then(r => r.json())
      .then(data => setCurrentPrice(data.current));
  }, [symbol]);

  async function handleOrder(side: 'BUY' | 'SELL') {
    setOrderLoading(true);
    setOrderMessage('');
    const res = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, side, qty }),
    });
    const data = await res.json();
    if (!res.ok) {
      setOrderMessage(data.error);
    } else {
      setOrderMessage(`${side === 'BUY' ? '매수' : '매도'} 완료! 체결가: ${data.fillPrice.toLocaleString('ko-KR')}원`);
    }
    setOrderLoading(false);
  }

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 520,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#374151',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: '#f3f4f6' },
        horzLines: { color: '#f3f4f6' },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: '#e5e7eb' },
      timeScale: {
        borderColor: '#e5e7eb',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#ef4444',
      downColor: '#3b82f6',
      borderUpColor: '#ef4444',
      borderDownColor: '#3b82f6',
      wickUpColor: '#ef4444',
      wickDownColor: '#3b82f6',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    const ma5Series = chart.addSeries(LineSeries, {
      color: '#f59e0b', lineWidth: 1,
      priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
    });
    const ma20Series = chart.addSeries(LineSeries, {
      color: '#3b82f6', lineWidth: 1,
      priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
    });
    const ma60Series = chart.addSeries(LineSeries, {
      color: '#8b5cf6', lineWidth: 1,
      priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
    });

    fetch(`/api/stock/candles?symbol=${symbol}&period=${period}&interval=${interval}`)
      .then(r => r.json())
      .then(data => {
        if (!data.candles) return;
        candleSeries.setData(data.candles);
        volumeSeries.setData(data.volumes);
        ma5Series.setData(showMA5 ? calcMA(data.candles, 5) : []);
        ma20Series.setData(showMA20 ? calcMA(data.candles, 20) : []);
        ma60Series.setData(showMA60 ? calcMA(data.candles, 60) : []);
        chart.timeScale().fitContent();
      });

    chart.subscribeCrosshairMove((param) => {
      if (param.time) {
        const c = param.seriesData.get(candleSeries) as any;
        const v = param.seriesData.get(volumeSeries) as any;
        if (c) setOhlcv({ ...c, volume: v?.value });
      }
    });

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [symbol, period, interval, showMA5, showMA20, showMA60]);

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">차트</h1>

      <div className="flex gap-6">
        {/* 왼쪽: 차트 영역 */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
            {/* 검색 */}
            <div className="relative flex gap-2 mb-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setInput(val);
                    if (val.length < 1) { setSuggestions([]); setShowSuggestions(false); return; }
                    if (debounceRef.current) clearTimeout(debounceRef.current);
                    debounceRef.current = setTimeout(async () => {
                      const res = await fetch(`/api/stock/search?q=${val}`);
                      const data = await res.json();
                      setSuggestions(data.results?.slice(0, 8) ?? []);
                      setShowSuggestions(true);
                    }, 500);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { setSymbol(input); setShowSuggestions(false); }
                  }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder="종목명 또는 티커 (예: AAPL)"
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm outline-none focus:border-zinc-600"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden">
                    {suggestions.map((s) => (
                      <li
                        key={s.symbol}
                        onMouseDown={() => {
                          setInput(s.symbol);
                          setSymbol(s.symbol);
                          setShowSuggestions(false);
                        }}
                        className="flex justify-between items-center px-4 py-2.5 text-sm hover:bg-zinc-50 cursor-pointer border-b border-zinc-100 last:border-0"
                      >
                        <span className="font-medium text-zinc-900">{s.symbol}</span>
                        <span className="text-zinc-400 text-xs truncate ml-4">{s.name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                onClick={() => { setSymbol(input); setShowSuggestions(false); }}
                className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
              >
                조회
              </button>
            </div>

            {/* 봉 종류 */}
            <div className="flex gap-2 mb-3 flex-wrap">
              {INTERVALS.map((i) => (
                <button
                  key={i.value}
                  onClick={() => {
                    setInterval(i.value);
                    setPeriod(PERIOD_OPTIONS[i.value][0].value);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    interval === i.value ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {i.label}
                </button>
              ))}
            </div>

            {/* 기간 */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {(PERIOD_OPTIONS[interval] ?? PERIOD_OPTIONS['1d']).map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    period === p.value ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* 이동평균선 토글 */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowMA5(!showMA5)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  showMA5 ? 'border-amber-400 text-amber-600 bg-amber-50' : 'border-zinc-200 text-zinc-400'
                }`}
              >
                <span className="w-3 h-0.5 bg-amber-400 inline-block rounded" />MA5
              </button>
              <button
                onClick={() => setShowMA20(!showMA20)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  showMA20 ? 'border-blue-400 text-blue-600 bg-blue-50' : 'border-zinc-200 text-zinc-400'
                }`}
              >
                <span className="w-3 h-0.5 bg-blue-400 inline-block rounded" />MA20
              </button>
              <button
                onClick={() => setShowMA60(!showMA60)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  showMA60 ? 'border-purple-400 text-purple-600 bg-purple-50' : 'border-zinc-200 text-zinc-400'
                }`}
              >
                <span className="w-3 h-0.5 bg-purple-400 inline-block rounded" />MA60
              </button>
            </div>
          </div>

          {/* 차트 */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-zinc-900">{symbol}</h2>
              {ohlcv && (
                <div className="flex gap-4 text-xs text-zinc-500">
                  <span>시가 <span className="text-zinc-800 font-medium">{ohlcv.open?.toFixed(2)}</span></span>
                  <span>고가 <span className="text-red-500 font-medium">{ohlcv.high?.toFixed(2)}</span></span>
                  <span>저가 <span className="text-blue-500 font-medium">{ohlcv.low?.toFixed(2)}</span></span>
                  <span>종가 <span className="text-zinc-800 font-medium">{ohlcv.close?.toFixed(2)}</span></span>
                  <span>거래량 <span className="text-zinc-800 font-medium">{ohlcv.volume?.toLocaleString()}</span></span>
                </div>
              )}
            </div>
            <div ref={chartContainerRef} />
          </div>
        </div>

        {/* 오른쪽: 주문 패널 */}
        <div className="w-72 shrink-0">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 sticky top-8">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">{symbol} 주문</h2>

            {/* 현재가 */}
            <div className="bg-zinc-50 rounded-xl p-4 mb-4">
              <p className="text-xs text-zinc-500 mb-1">현재가</p>
              <p className="text-2xl font-bold text-zinc-900">
                {currentPrice ? `$${currentPrice.toLocaleString()}` : '로딩 중...'}
              </p>
              {currentPrice && (
                <p className="text-xs text-zinc-400 mt-1">
                  ≈ {(currentPrice * 1350).toLocaleString('ko-KR')}원
                </p>
              )}
            </div>

            {/* 수량 */}
            <div className="mb-4">
              <p className="text-xs text-zinc-500 mb-2">주문 수량</p>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-600"
              />
              {currentPrice && (
                <p className="text-xs text-zinc-400 mt-2">
                  예상금액: {(currentPrice * qty * 1350).toLocaleString('ko-KR')}원
                </p>
              )}
            </div>

            {/* 매수/매도 버튼 */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => handleOrder('BUY')}
                disabled={orderLoading}
                className="flex-1 rounded-lg bg-red-500 py-3 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                매수
              </button>
              <button
                onClick={() => handleOrder('SELL')}
                disabled={orderLoading}
                className="flex-1 rounded-lg bg-blue-500 py-3 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
              >
                매도
              </button>
            </div>

            {orderMessage && (
              <p className="text-xs text-zinc-600 text-center">{orderMessage}</p>
            )}
          </div>
        </div>
      </div>
      <NewsPanel symbol={symbol} />
    </div>
  );
}

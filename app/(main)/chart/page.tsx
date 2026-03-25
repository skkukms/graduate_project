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
  const initialMarket = initialSymbol.endsWith('.KS') || initialSymbol.endsWith('.KQ') ? 'KR' : 'US';

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [symbol, setSymbol] = useState(initialSymbol);
  const [input, setInput] = useState(initialSymbol);
  const [market, setMarket] = useState<'US' | 'KR'>(initialMarket);
  const [interval, setInterval] = useState('1d');
  const [period, setPeriod] = useState('1Y');
  const [showMA5, setShowMA5] = useState(true);
  const [showMA20, setShowMA20] = useState(true);
  const [showMA60, setShowMA60] = useState(true);
  const [ohlcv, setOhlcv] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<{ symbol: string; name: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [qty, setQty] = useState(1);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderMessage, setOrderMessage] = useState('');
  const [orderMessageType, setOrderMessageType] = useState<'success' | 'error'>('success');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [stockName, setStockName] = useState('');
  const [usdToKrw, setUsdToKrw] = useState(1350);
  const [change, setChange] = useState(0);
  const [changePercent, setChangePercent] = useState(0);
  const [watchlisted, setWatchlisted] = useState(false);

  useEffect(() => {
    fetch(`/api/stock/quote?symbol=${symbol}`)
      .then(r => r.json())
      .then(data => {
        setCurrentPrice(data.current);
        setStockName(data.name ?? symbol);
        setChange(data.change ?? 0);
        setChangePercent(data.changePercent ?? 0);
        if (data.usdToKrw) setUsdToKrw(data.usdToKrw);
      });

    fetch('/api/watchlist')
      .then(r => r.json())
      .then(data => {
        setWatchlisted((data.items ?? []).some((i: any) => i.symbol_code === symbol));
      });
  }, [symbol]);

  async function toggleWatchlist() {
    if (watchlisted) {
      await fetch('/api/watchlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      });
    } else {
      await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, name: stockName }),
      });
    }
    setWatchlisted(!watchlisted);
  }

  const formatPrice = (price?: number) => {
    if (!price) return '-';
    return market === 'KR'
      ? price.toLocaleString('ko-KR') + '원'
      : '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

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
      setOrderMessageType('error');
    } else {
      setOrderMessage(`${side === 'BUY' ? '매수' : '매도'} 완료! 체결가: ${data.fillPrice.toLocaleString('ko-KR')}원`);
      setOrderMessageType('success');
    }
    setOrderLoading(false);
  }

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: {
        background: { color: '#1a1a1a' },
        textColor: '#888888',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: '#222222' },
        horzLines: { color: '#222222' },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: '#2a2a2a' },
      timeScale: { borderColor: '#2a2a2a', timeVisible: true, secondsVisible: false },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#ff4b4b', downColor: '#4b9eff',
      borderUpColor: '#ff4b4b', borderDownColor: '#4b9eff',
      wickUpColor: '#ff4b4b', wickDownColor: '#4b9eff',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' }, priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    const ma5Series = chart.addSeries(LineSeries, {
      color: '#f59e0b', lineWidth: 1,
      priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
    });
    const ma20Series = chart.addSeries(LineSeries, {
      color: '#4b9eff', lineWidth: 1,
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
        volumeSeries.setData(
          data.volumes.map((v: any, i: number) => ({
            ...v,
            color: (data.candles[i]?.close ?? 0) >= (data.candles[i]?.open ?? 0)
              ? 'rgba(255,75,75,0.4)'
              : 'rgba(75,158,255,0.4)',
          }))
        );
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
    return () => { window.removeEventListener('resize', handleResize); chart.remove(); };
  }, [symbol, period, interval, showMA5, showMA20, showMA60]);

  return (
    <div className="min-h-screen bg-[#0e0e0e] p-6">
      <div className="flex gap-5">
        {/* 왼쪽: 차트 영역 */}
        <div className="flex-1 min-w-0">

          {/* 검색 + 컨트롤 */}
          <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-5 mb-4">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => { setMarket('US'); setInput('AAPL'); setSymbol('AAPL'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${market === 'US' ? 'bg-[#2a2a2a] text-[#f0f0f0]' : 'text-[#555555] hover:text-[#888888]'}`}
              >
                🇺🇸 미국
              </button>
              <button
                onClick={() => { setMarket('KR'); setInput('005930.KS'); setSymbol('005930.KS'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${market === 'KR' ? 'bg-[#2a2a2a] text-[#f0f0f0]' : 'text-[#555555] hover:text-[#888888]'}`}
              >
                🇰🇷 국내
              </button>
            </div>

            {/* 검색창 */}
            <div className="relative flex gap-2 mb-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => {
                    const val = market === 'US' ? e.target.value.toUpperCase() : e.target.value;
                    setInput(val);
                    if (val.length < 1) { setSuggestions([]); setShowSuggestions(false); return; }
                    if (debounceRef.current) clearTimeout(debounceRef.current);
                    debounceRef.current = setTimeout(async () => {
                      const url = market === 'KR' ? `/api/stock/kr-search?q=${val}` : `/api/stock/search?q=${val}`;
                      const res = await fetch(url);
                      const data = await res.json();
                      setSuggestions(data.results?.slice(0, 8) ?? []);
                      setShowSuggestions(true);
                    }, 500);
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { setSymbol(input); setShowSuggestions(false); } }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder={market === 'KR' ? '종목명 (예: 삼성전자)' : '종목명 또는 티커 (예: AAPL)'}
                  className="w-full rounded-xl bg-[#222222] border border-[#2a2a2a] px-4 py-2.5 text-sm text-[#f0f0f0] placeholder-[#555555] outline-none focus:border-[#4b9eff] transition-colors"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="absolute z-10 top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden">
                    {suggestions.map((s) => (
                      <li
                        key={s.symbol}
                        onMouseDown={() => { setInput(s.symbol); setSymbol(s.symbol); setShowSuggestions(false); }}
                        className="flex justify-between items-center px-4 py-2.5 text-sm hover:bg-[#222222] cursor-pointer border-b border-[#222222] last:border-0 transition-colors"
                      >
                        <span className="font-medium text-[#f0f0f0]">{s.name}</span>
                        <span className="text-[#555555] text-xs ml-4">{s.symbol}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                onClick={() => { setSymbol(input); setShowSuggestions(false); }}
                className="rounded-xl bg-[#2a2a2a] hover:bg-[#333333] px-5 py-2.5 text-sm font-medium text-[#f0f0f0] transition-colors"
              >
                조회
              </button>
            </div>

            {/* 봉 종류 */}
            <div className="flex gap-1.5 mb-3 flex-wrap">
              {INTERVALS.map((i) => (
                <button
                  key={i.value}
                  onClick={() => { setInterval(i.value); setPeriod(PERIOD_OPTIONS[i.value][0].value); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${interval === i.value ? 'bg-[#2a2a2a] text-[#f0f0f0]' : 'text-[#555555] hover:text-[#888888]'}`}
                >
                  {i.label}
                </button>
              ))}
            </div>

            {/* 기간 */}
            <div className="flex gap-1.5 mb-4 flex-wrap">
              {(PERIOD_OPTIONS[interval] ?? PERIOD_OPTIONS['1d']).map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${period === p.value ? 'bg-[#4b9eff]/20 text-[#4b9eff]' : 'text-[#555555] hover:text-[#888888]'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* 이동평균선 */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowMA5(!showMA5)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${showMA5 ? 'border-[#f59e0b]/40 text-[#f59e0b] bg-[#f59e0b]/10' : 'border-[#2a2a2a] text-[#444444]'}`}
              >
                <span className="w-3 h-0.5 bg-[#f59e0b] inline-block rounded" />MA5
              </button>
              <button
                onClick={() => setShowMA20(!showMA20)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${showMA20 ? 'border-[#4b9eff]/40 text-[#4b9eff] bg-[#4b9eff]/10' : 'border-[#2a2a2a] text-[#444444]'}`}
              >
                <span className="w-3 h-0.5 bg-[#4b9eff] inline-block rounded" />MA20
              </button>
              <button
                onClick={() => setShowMA60(!showMA60)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${showMA60 ? 'border-[#8b5cf6]/40 text-[#8b5cf6] bg-[#8b5cf6]/10' : 'border-[#2a2a2a] text-[#444444]'}`}
              >
                <span className="w-3 h-0.5 bg-[#8b5cf6] inline-block rounded" />MA60
              </button>
            </div>
          </div>

          {/* 차트 */}
          <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-5">
            {/* 종목 헤더 */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#f0f0f0]">{stockName || symbol}</h2>
                {currentPrice && (
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-[#f0f0f0]">{formatPrice(currentPrice)}</span>
                    <span className={`text-sm font-medium ${change >= 0 ? 'text-[#ff4b4b]' : 'text-[#4b9eff]'}`}>
                      {change >= 0 ? '+' : ''}{market === 'KR' ? change.toLocaleString('ko-KR') + '원' : '$' + change.toFixed(2)}
                      {' '}({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
                    </span>
                  </div>
                )}
              </div>
              {ohlcv && (
                <div className="flex gap-4 text-xs text-[#555555]">
                  <span>시가 <span className="text-[#888888] font-medium">{formatPrice(ohlcv.open)}</span></span>
                  <span>고가 <span className="text-[#ff4b4b] font-medium">{formatPrice(ohlcv.high)}</span></span>
                  <span>저가 <span className="text-[#4b9eff] font-medium">{formatPrice(ohlcv.low)}</span></span>
                  <span>종가 <span className="text-[#888888] font-medium">{formatPrice(ohlcv.close)}</span></span>
                  <span>거래량 <span className="text-[#888888] font-medium">{ohlcv.volume?.toLocaleString()}</span></span>
                </div>
              )}
            </div>
            <div ref={chartContainerRef} />
          </div>

          <NewsPanel symbol={symbol} name={stockName} />
        </div>

        {/* 오른쪽: 주문 패널 */}
        <div className="w-64 shrink-0">
          <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-5 sticky top-20">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-sm font-semibold text-[#888888] truncate">{stockName || symbol}</h2>
              <button
                onClick={toggleWatchlist}
                className={`shrink-0 text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                  watchlisted
                    ? 'border-[#f59e0b]/40 text-[#f59e0b] bg-[#f59e0b]/10'
                    : 'border-[#2a2a2a] text-[#555555] hover:text-[#888888]'
                }`}
              >
                {watchlisted ? '★' : '☆'}
              </button>
            </div>

            {/* 현재가 */}
            <div className="bg-[#222222] rounded-xl p-4 mb-4">
              <p className="text-xs text-[#555555] mb-1">현재가</p>
              <p className="text-xl font-bold text-[#f0f0f0]">
                {currentPrice
                  ? market === 'KR'
                    ? `${currentPrice.toLocaleString('ko-KR')}원`
                    : `$${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                  : '—'}
              </p>
              {currentPrice && market === 'US' && (
                <p className="text-xs text-[#555555] mt-1">
                  ≈ {(currentPrice * usdToKrw).toLocaleString('ko-KR')}원
                </p>
              )}
            </div>

            {/* 수량 */}
            <div className="mb-4">
              <p className="text-xs text-[#555555] mb-2">주문 수량</p>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                className="w-full rounded-xl bg-[#222222] border border-[#2a2a2a] px-3 py-2 text-sm text-[#f0f0f0] outline-none focus:border-[#4b9eff] transition-colors mb-2"
              />
              <div className="flex gap-1.5">
                {[1, 5, 10, 100].map((n) => (
                  <button
                    key={n}
                    onClick={() => setQty(q => q + n)}
                    className="flex-1 text-xs py-1.5 rounded-lg bg-[#222222] border border-[#2a2a2a] text-[#888888] hover:text-[#f0f0f0] hover:border-[#444444] transition-colors"
                  >
                    +{n}
                  </button>
                ))}
                <button
                  onClick={() => setQty(1)}
                  className="flex-1 text-xs py-1.5 rounded-lg bg-[#222222] border border-[#2a2a2a] text-[#555555] hover:text-[#ff4b4b] transition-colors"
                >
                  초기화
                </button>
              </div>
              {currentPrice && (
                <p className="text-xs text-[#555555] mt-2">
                  예상: {market === 'KR'
                    ? (currentPrice * qty).toLocaleString('ko-KR')
                    : (currentPrice * qty * usdToKrw).toLocaleString('ko-KR')}원
                </p>
              )}
            </div>

            {/* 매수/매도 버튼 */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => handleOrder('BUY')}
                disabled={orderLoading}
                className="flex-1 rounded-xl bg-[#ff4b4b] hover:bg-[#e03e3e] py-3 text-sm font-semibold text-white transition-colors disabled:opacity-40"
              >
                매수
              </button>
              <button
                onClick={() => handleOrder('SELL')}
                disabled={orderLoading}
                className="flex-1 rounded-xl bg-[#4b9eff] hover:bg-[#3a8ef0] py-3 text-sm font-semibold text-white transition-colors disabled:opacity-40"
              >
                매도
              </button>
            </div>

            {orderMessage && (
              <p className={`text-xs text-center ${orderMessageType === 'success' ? 'text-[#888888]' : 'text-[#ff4b4b]'}`}>
                {orderMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

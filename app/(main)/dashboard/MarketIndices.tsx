'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type IndexData = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  prices: number[];
};

function Sparkline({ prices, isUp }: { prices: number[]; isUp: boolean }) {
  if (prices.length < 2) return <div className="w-24 h-10" />;

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const W = 96, H = 40, PAD = 2;

  const points = prices.map((p, i) => {
    const x = PAD + (i / (prices.length - 1)) * (W - PAD * 2);
    const y = PAD + (1 - (p - min) / range) * (H - PAD * 2);
    return `${x},${y}`;
  });

  const color = isUp ? '#ff4b4b' : '#4b9eff';
  const fillId = `fill-${isUp ? 'up' : 'down'}`;

  // 영역 채우기용 path
  const areaPoints = [
    `${PAD},${H}`,
    ...points.map(p => p),
    `${W - PAD},${H}`,
  ].join(' ');

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="shrink-0">
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${fillId})`} />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function MarketIndices() {
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    fetch('/api/market/indices')
      .then(r => r.json())
      .then(data => { setIndices(data.indices ?? []); setLoading(false); })
      .catch(() => setLoading(false));

    // 5분마다 갱신
    const id = setInterval(() => {
      fetch('/api/market/indices')
        .then(r => r.json())
        .then(data => setIndices(data.indices ?? []))
        .catch(() => {});
    }, 5 * 60 * 1000);

    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-(--surface) rounded-2xl border border-(--border) p-4 h-[72px] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-3 mb-4">
      {indices.map((idx) => {
        const isUp = idx.change >= 0;
        const color = isUp ? 'text-[#ff4b4b]' : 'text-[#4b9eff]';
        const isKR = idx.symbol.startsWith('^KS') || idx.symbol.startsWith('^KQ');

        return (
          <div key={idx.symbol} onClick={() => router.push(`/chart?symbol=${idx.symbol}`)} className="bg-(--surface) rounded-2xl border border-(--border) px-4 py-3 flex items-center justify-between gap-3 card-hover cursor-pointer">
            <div className="min-w-0">
              <p className="text-xs text-(--text-subtle) mb-0.5">{idx.name}</p>
              <p className="text-sm font-semibold text-(--text-strong) tabular-nums">
                {idx.price > 0
                  ? isKR
                    ? idx.price.toLocaleString('ko-KR', { maximumFractionDigits: 2 })
                    : idx.price.toLocaleString('en-US', { maximumFractionDigits: 2 })
                  : '—'}
              </p>
              <p className={`text-xs font-medium tabular-nums mt-0.5 ${idx.price > 0 ? color : 'text-(--text-disabled)'}`}>
                {idx.price > 0
                  ? `${isUp ? '+' : ''}${idx.changePercent.toFixed(2)}%`
                  : '데이터 없음'}
              </p>
            </div>
            <Sparkline prices={idx.prices} isUp={isUp} />
          </div>
        );
      })}
    </div>
  );
}

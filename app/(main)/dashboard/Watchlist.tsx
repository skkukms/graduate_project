'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type WatchItem = {
  symbol_code: string;
  name: string;
  current?: number;
  changePercent?: number;
};

export default function Watchlist() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const router = useRouter();

  async function fetchWatchlist() {
    const res = await fetch('/api/watchlist');
    const data = await res.json();
    setItems(data.items ?? []);
  }

  async function handleDelete(symbol: string) {
    await fetch('/api/watchlist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol }),
    });
    fetchWatchlist();
  }

  useEffect(() => { fetchWatchlist(); }, []);

  return (
    <div className="bg-(--surface) rounded-2xl border border-(--border) p-6 mb-4 animate-fade-up card-hover">
      <h2 className="text-base font-semibold text-(--text-strong) mb-4">관심종목</h2>
      {items.length === 0 ? (
        <p className="text-sm text-(--text-subtle)">관심종목이 없습니다.</p>
      ) : (
        <div>
          {items.map((item) => (
            <div
              key={item.symbol_code}
              onClick={() => router.push(`/chart?symbol=${item.symbol_code}`)}
              className="group flex items-stretch cursor-pointer border-b border-(--surface-2) last:border-0"
            >
              {/* 왼쪽 셀 */}
              <div className="flex-1 flex items-center gap-3 py-3 pl-0 rounded-l-2xl group-hover:bg-white/[0.04] transition-all duration-150">
                <div className="w-[3px] self-stretch rounded-r-full bg-transparent group-hover:bg-[#4b9eff] transition-all duration-200 shrink-0" />
                {item.name && item.name !== item.symbol_code ? (
                  <>
                    <span className="font-medium text-sm text-(--text-strong) group-hover:text-white transition-colors duration-150">{item.name}</span>
                    <span className="text-(--text-subtle) text-xs">{item.symbol_code}</span>
                  </>
                ) : (
                  <span className="font-medium text-sm text-(--text-strong) group-hover:text-white transition-colors duration-150">{item.symbol_code}</span>
                )}
              </div>

              {/* 오른쪽 셀 */}
              <div className="flex items-center gap-4 py-3 pr-1 rounded-r-2xl group-hover:bg-white/[0.04] transition-all duration-150">
                <span className="text-sm font-medium text-(--text-strong) group-hover:text-white transition-colors duration-150">
                  {item.symbol_code.endsWith('.KS') || item.symbol_code.endsWith('.KQ')
                    ? `${(item.current ?? 0).toLocaleString('ko-KR')}원`
                    : `$${(item.current ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </span>
                <span className={`text-sm font-medium ${(item.changePercent ?? 0) >= 0 ? 'text-[#ff4b4b]' : 'text-[#4b9eff]'}`}>
                  {(item.changePercent ?? 0) >= 0 ? '+' : ''}{(item.changePercent ?? 0).toFixed(2)}%
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(item.symbol_code); }}
                  className="text-(--text-disabled) hover:text-(--text-muted) text-xs transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

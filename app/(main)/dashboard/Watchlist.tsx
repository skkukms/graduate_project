'use client';
import { useEffect, useState } from 'react';

type WatchItem = {
  symbol_code: string;
  name: string;
  current?: number;
  changePercent?: number;
};

export default function Watchlist() {
  const [items, setItems] = useState<WatchItem[]>([]);

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
    <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-6 mb-4">
      <h2 className="text-base font-semibold text-[#f0f0f0] mb-4">관심종목</h2>
      {items.length === 0 ? (
        <p className="text-sm text-[#555555]">관심종목이 없습니다.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.symbol_code} className="flex justify-between items-center py-3 border-b border-[#222222] last:border-0">
              <div>
                {item.name && item.name !== item.symbol_code ? (
                  <>
                    <span className="font-medium text-sm text-[#f0f0f0]">{item.name}</span>
                    <span className="text-[#555555] text-xs ml-2">{item.symbol_code}</span>
                  </>
                ) : (
                  <span className="font-medium text-sm text-[#f0f0f0]">{item.symbol_code}</span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-[#f0f0f0]">
                  {item.symbol_code.endsWith('.KS') || item.symbol_code.endsWith('.KQ')
                    ? `${(item.current ?? 0).toLocaleString('ko-KR')}원`
                    : `$${(item.current ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </span>
                <span className={`text-sm font-medium ${(item.changePercent ?? 0) >= 0 ? 'text-[#ff4b4b]' : 'text-[#4b9eff]'}`}>
                  {(item.changePercent ?? 0) >= 0 ? '+' : ''}{(item.changePercent ?? 0).toFixed(2)}%
                </span>
                <button
                  onClick={() => handleDelete(item.symbol_code)}
                  className="text-[#444444] hover:text-[#888888] text-xs transition-colors"
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

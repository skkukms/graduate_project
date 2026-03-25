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

    // 각 종목 현재가 조회
    const withQuotes = await Promise.all(
      data.items.map(async (item: WatchItem) => {
        const q = await fetch(`/api/stock/quote?symbol=${item.symbol_code}`);
        const qData = await q.json();
        return { ...item, current: qData.current, changePercent: qData.changePercent };
      })
    );
    setItems(withQuotes);
  }

  async function handleDelete(symbol: string) {
    await fetch('/api/watchlist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol }),
    });
    fetchWatchlist();
  }

  useEffect(() => {
    fetchWatchlist();
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
      <h2 className="text-lg font-semibold text-zinc-900 mb-4">관심종목</h2>
      {items.length === 0 ? (
        <p className="text-sm text-zinc-400">관심종목이 없습니다.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.symbol_code} className="flex justify-between items-center py-3 border-b border-zinc-100 last:border-0">
              <div>
                {item.name && item.name !== item.symbol_code ? (
                  <>
                    <span className="font-medium text-sm">{item.name}</span>
                    <span className="text-zinc-400 text-xs ml-2">{item.symbol_code}</span>
                  </>
                ) : (
                  <span className="font-medium text-sm">{item.symbol_code}</span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">
                  {item.symbol_code.endsWith('.KS') || item.symbol_code.endsWith('.KQ')
                    ? `${(item.current ?? 0).toLocaleString('ko-KR')}원`
                    : `$${(item.current ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </span>
                <span className={`text-sm ${(item.changePercent ?? 0) >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                  {(item.changePercent ?? 0) >= 0 ? '+' : ''}{item.changePercent?.toFixed(2)}%
                </span>
                <button
                  onClick={() => handleDelete(item.symbol_code)}
                  className="text-zinc-400 hover:text-zinc-700 text-xs"
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

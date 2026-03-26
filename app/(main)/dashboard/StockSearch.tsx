'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

type Stock = { symbol: string; name: string };

export default function StockSearch() {
  const router = useRouter();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [query, setQuery] = useState('');
  const [market, setMarket] = useState<'US' | 'KR'>('US');
  const [suggestions, setSuggestions] = useState<Stock[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  return (
    <div className="bg-(--surface) rounded-2xl border border-(--border) p-6 mb-4">
      <h2 className="text-base font-semibold text-(--text-strong) mb-4">종목 검색</h2>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setMarket('US'); setQuery(''); setSuggestions([]); }}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${market === 'US' ? 'bg-(--border) text-(--text-strong)' : 'text-(--text-subtle) hover:text-(--text-muted)'}`}
        >
          🇺🇸 미국
        </button>
        <button
          onClick={() => { setMarket('KR'); setQuery(''); setSuggestions([]); }}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${market === 'KR' ? 'bg-(--border) text-(--text-strong)' : 'text-(--text-subtle) hover:text-(--text-muted)'}`}
        >
          🇰🇷 국내
        </button>
      </div>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            const val = market === 'US' ? e.target.value.toUpperCase() : e.target.value;
            setQuery(val);
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
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={market === 'KR' ? '종목명 검색 (예: 삼성전자)' : '종목명 또는 티커 (예: AAPL)'}
          className="w-full rounded-xl bg-(--surface-2) border border-(--border) px-4 py-2.5 text-sm text-(--text-strong) placeholder-(--text-subtle) outline-none focus:border-[#4b9eff] transition-colors"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-10 top-full left-0 right-0 mt-1 bg-(--surface) border border-(--border) rounded-xl shadow-2xl overflow-hidden">
            {suggestions.map((s) => (
              <li
                key={s.symbol}
                onMouseDown={() => router.push(`/chart?symbol=${s.symbol}`)}
                className="flex justify-between items-center px-4 py-2.5 text-sm hover:bg-(--surface-2) cursor-pointer border-b border-(--surface-2) last:border-0 transition-colors"
              >
                <span className="font-medium text-(--text-strong)">{s.name}</span>
                <span className="text-(--text-subtle) text-xs ml-4">{s.symbol}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

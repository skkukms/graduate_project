'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

type Stock = { symbol: string; name: string };
type Props = { onOrderComplete: () => void };

export default function StockSearch({ onOrderComplete }: Props) {
  const router = useRouter();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [query, setQuery] = useState('');
  const [market, setMarket] = useState<'US' | 'KR'>('US');
  const [suggestions, setSuggestions] = useState<Stock[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
      <h2 className="text-lg font-semibold text-zinc-900 mb-4">종목 검색</h2>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setMarket('US'); setQuery(''); setSuggestions([]); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${market === 'US' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
        >
          🇺🇸 미국
        </button>
        <button
          onClick={() => { setMarket('KR'); setQuery(''); setSuggestions([]); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${market === 'KR' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
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
              const url = market === 'KR'
                ? `/api/stock/kr-search?q=${val}`
                : `/api/stock/search?q=${val}`;
              const res = await fetch(url);
              const data = await res.json();
              setSuggestions(data.results?.slice(0, 8) ?? []);
              setShowSuggestions(true);
            }, 500);
          }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={market === 'KR' ? '종목명 (예: 삼성전자)' : '종목명 또는 티커 (예: AAPL)'}
          className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm outline-none focus:border-zinc-600"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden">
            {suggestions.map((s) => (
              <li
                key={s.symbol}
                onMouseDown={() => router.push(`/chart?symbol=${s.symbol}`)}
                className="flex justify-between items-center px-4 py-2.5 text-sm hover:bg-zinc-50 cursor-pointer border-b border-zinc-100 last:border-0"
              >
                <span className="font-medium text-zinc-900">{s.name}</span>
                <span className="text-zinc-400 text-xs ml-4">{s.symbol}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

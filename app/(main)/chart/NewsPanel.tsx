'use client';
import { useEffect, useState } from 'react';

type News = {
  id: number;
  headline: string;
  summary: string;
  url: string;
  source: string;
  datetime: number;
  image: string;
};

type Props = { symbol: string; name?: string };

export default function NewsPanel({ symbol, name }: Props) {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const query = name ? `&name=${encodeURIComponent(name)}` : '';
    fetch(`/api/stock/news?symbol=${symbol}${query}`)
      .then(r => r.json())
      .then(data => {
        setNews(data.news ?? []);
        setLoading(false);
      });
  }, [symbol, name]);

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6 mt-6">
      <h2 className="text-lg font-semibold text-zinc-900 mb-4">{symbol} 관련 뉴스</h2>

      {loading ? (
        <p className="text-sm text-zinc-400">로딩 중...</p>
      ) : news.length === 0 ? (
        <p className="text-sm text-zinc-400">최근 뉴스가 없습니다.</p>
      ) : (
        <ul className="space-y-4">
          {news.map((item) => (
            <li key={item.id} className="border-b border-zinc-100 pb-4 last:border-0 last:pb-0">
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="group">
                <div className="flex gap-3">
                  {item.image && (
                    <img
                      src={item.image}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover shrink-0 bg-zinc-100"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 group-hover:text-blue-600 line-clamp-2 mb-1">
                      {item.headline}
                    </p>
                    <p className="text-xs text-zinc-400 line-clamp-2 mb-2">{item.summary}</p>
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <span>{item.source}</span>
                      <span>·</span>
                      <span>{new Date(item.datetime * 1000).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

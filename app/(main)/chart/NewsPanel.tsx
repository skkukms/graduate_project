'use client';
import { useEffect, useState } from 'react';

type News = { id: number; headline: string; summary: string; url: string; source: string; datetime: number; image: string };
type Props = { symbol: string; name?: string };

export default function NewsPanel({ symbol, name }: Props) {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const query = name ? `&name=${encodeURIComponent(name)}` : '';
    fetch(`/api/stock/news?symbol=${symbol}${query}`)
      .then(r => r.json())
      .then(data => { setNews(data.news ?? []); })
      .catch(() => { setNews([]); })
      .finally(() => { setLoading(false); });
  }, [symbol, name]);

  return (
    <div className="bg-(--surface) rounded-2xl border border-(--border) p-6 mt-4">
      <h2 className="text-base font-semibold text-(--text-strong) mb-4">관련 뉴스</h2>

      {loading ? (
        <p className="text-sm text-(--text-subtle)">로딩 중...</p>
      ) : news.length === 0 ? (
        <p className="text-sm text-(--text-subtle)">최근 뉴스가 없습니다.</p>
      ) : (
        <ul className="space-y-4">
          {news.map((item) => (
            <li key={item.id} className="border-b border-(--surface-2) pb-4 last:border-0 last:pb-0">
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="group">
                <p className="text-sm font-medium text-(--text) group-hover:text-[#4b9eff] line-clamp-2 mb-1 transition-colors">
                  {item.headline}
                </p>
                <div className="flex items-center gap-2 text-xs text-(--text-subtle)">
                  {item.source && <span>{item.source}</span>}
                  {item.source && <span>·</span>}
                  <span>{new Date(item.datetime * 1000).toLocaleDateString('ko-KR')}</span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

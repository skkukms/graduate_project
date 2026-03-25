import { NextRequest, NextResponse } from 'next/server';

async function fetchGoogleNews(query: string, lang: string, country: string) {
  const q = encodeURIComponent(query);
  const url = `https://news.google.com/rss/search?q=${q}&hl=${lang}&gl=${country}&ceid=${country}:${lang}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const xml = await res.text();

  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 10);
  return items.map((m, i) => {
    const block = m[1];
    const headline = (block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ?? block.match(/<title>(.*?)<\/title>/))?.[1] ?? '';
    const url = (block.match(/<link>(.*?)<\/link>/) ?? block.match(/<guid[^>]*>(.*?)<\/guid>/))?.[1] ?? '#';
    const source = block.match(/<source[^>]*>(.*?)<\/source>/)?.[1] ?? '';
    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? '';
    return {
      id: i,
      headline: headline.replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"'),
      summary: '',
      url,
      source,
      datetime: pubDate ? Math.floor(new Date(pubDate).getTime() / 1000) : Math.floor(Date.now() / 1000),
      image: '',
    };
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol');
  const name = searchParams.get('name') ?? '';

  if (!symbol) {
    return NextResponse.json({ error: '종목 코드를 입력하세요.' }, { status: 400 });
  }

  const isKorean = symbol.endsWith('.KS') || symbol.endsWith('.KQ');

  try {
    let news;
    if (isKorean) {
      const query = name ? `${name} 주식` : symbol.replace(/\.(KS|KQ)$/, '');
      news = await fetchGoogleNews(query, 'ko', 'KR');
    } else {
      const query = name ? `${name} stock` : `${symbol} stock`;
      news = await fetchGoogleNews(query, 'en', 'US');
    }
    return NextResponse.json({ news });
  } catch {
    return NextResponse.json({ news: [] });
  }
}

'use client';
import { useEffect, useState } from 'react';

type Order = {
  id: number;
  symbol_code: string;
  name: string;
  side: 'BUY' | 'SELL';
  qty: number;
  fill_price: number;
  fill_price_usd: number | null;
  realized_pnl: number | null;
  created_at: string;
};

function formatDate(str: string) {
  const d = new Date(str);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return { date: `${month}/${day}`, time: `${h}:${m}` };
}

export default function TradeHistory() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch('/api/orders')
      .then((r) => r.json())
      .then((data) => setOrders(data.orders ?? []));
  }, []);

  return (
    <div className="bg-(--surface) rounded-2xl border border-(--border) p-6 mb-4 animate-fade-up card-hover">
      <h2 className="text-base font-semibold text-(--text-strong) mb-4">거래 내역</h2>
      {orders.length === 0 ? (
        <p className="text-sm text-(--text-subtle)">거래 내역이 없습니다.</p>
      ) : (
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead>
            <tr className="text-(--text-subtle) text-xs">
              <th className="text-left pb-3 font-medium border-b border-(--border) w-[28%]">종목</th>
              <th className="text-center pb-3 font-medium border-b border-(--border) whitespace-nowrap px-3">구분</th>
              <th className="text-right pb-3 font-medium border-b border-(--border) whitespace-nowrap px-3">수량</th>
              <th className="text-right pb-3 font-medium border-b border-(--border) whitespace-nowrap px-3">체결가</th>
              <th className="text-right pb-3 font-medium border-b border-(--border) whitespace-nowrap px-3">총금액</th>
              <th className="text-right pb-3 font-medium border-b border-(--border) whitespace-nowrap px-3">실현손익</th>
              <th className="text-right pb-3 font-medium border-b border-(--border) whitespace-nowrap pl-3">일시</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const isUs = o.fill_price_usd != null;
              const priceStr = isUs
                ? `$${Number(o.fill_price_usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : `${Number(o.fill_price).toLocaleString('ko-KR')}원`;
              const totalStr = isUs
                ? `$${(Number(o.fill_price_usd) * o.qty).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : `${(Number(o.fill_price) * o.qty).toLocaleString('ko-KR')}원`;
              const { date, time } = formatDate(o.created_at);

              return (
                <tr key={o.id} className="group">
                  {/* 종목 */}
                  <td className="py-3 pl-0 border-b border-(--surface-2) group-last:border-0 rounded-l-2xl group-hover:bg-white/4 transition-all duration-150">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex items-baseline gap-1.5 min-w-0">
                        <span className="font-medium text-(--text-strong) group-hover:text-white truncate transition-colors duration-150">
                          {o.name && o.name !== o.symbol_code ? o.name : o.symbol_code}
                        </span>
                        {o.name && o.name !== o.symbol_code && (
                          <span className="text-[11px] text-(--text-disabled) shrink-0">{o.symbol_code}</span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* 구분 */}
                  <td className="text-center py-3 px-3 border-b border-(--surface-2) group-last:border-0 group-hover:bg-white/4 transition-all duration-150 whitespace-nowrap">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold ${
                      o.side === 'BUY'
                        ? 'bg-[#ff4b4b]/10 text-[#ff4b4b]'
                        : 'bg-[#4b9eff]/10 text-[#4b9eff]'
                    }`}>
                      {o.side === 'BUY' ? '매수' : '매도'}
                    </span>
                  </td>

                  {/* 수량 */}
                  <td className="text-right py-3 px-3 border-b border-(--surface-2) group-last:border-0 group-hover:bg-white/4 text-(--text-muted) group-hover:text-(--text) transition-all duration-150 whitespace-nowrap">
                    {o.qty}<span className="text-[11px] text-(--text-disabled) ml-0.5">주</span>
                  </td>

                  {/* 체결가 */}
                  <td className="text-right py-3 px-3 border-b border-(--surface-2) group-last:border-0 group-hover:bg-white/4 text-(--text-strong) group-hover:text-white transition-all duration-150 tabular-nums whitespace-nowrap">
                    {priceStr}
                  </td>

                  {/* 총금액 */}
                  <td className="text-right py-3 px-3 border-b border-(--surface-2) group-last:border-0 group-hover:bg-white/4 text-(--text-muted) group-hover:text-(--text) transition-all duration-150 tabular-nums whitespace-nowrap">
                    {totalStr}
                  </td>

                  {/* 실현손익 */}
                  <td className="text-right py-3 px-3 border-b border-(--surface-2) group-last:border-0 group-hover:bg-white/4 transition-all duration-150 tabular-nums whitespace-nowrap">
                    {o.side === 'SELL' && o.realized_pnl !== null ? (
                      <span className={`font-medium ${Number(o.realized_pnl) >= 0 ? 'text-[#ff4b4b]' : 'text-[#4b9eff]'}`}>
                        {Number(o.realized_pnl) >= 0 ? '+' : ''}{Number(o.realized_pnl).toLocaleString('ko-KR')}원
                      </span>
                    ) : (
                      <span className="text-(--text-disabled)">—</span>
                    )}
                  </td>

                  {/* 일시 */}
                  <td className="text-right py-3 pl-3 pr-1 border-b border-(--surface-2) group-last:border-0 rounded-r-2xl group-hover:bg-white/4 text-xs text-(--text-subtle) group-hover:text-(--text-muted) transition-all duration-150 whitespace-nowrap">
                    {date} {time}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

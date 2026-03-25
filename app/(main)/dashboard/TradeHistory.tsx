'use client';
import { useEffect, useState } from 'react';

type Order = {
  id: number;
  symbol_code: string;
  name: string;
  side: 'BUY' | 'SELL';
  qty: number;
  fill_price: number;
  created_at: string;
};

export default function TradeHistory() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch('/api/orders')
      .then((r) => r.json())
      .then((data) => setOrders(data.orders ?? []));
  }, []);

  return (
    <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-6 mb-4">
      <h2 className="text-base font-semibold text-[#f0f0f0] mb-4">거래 내역</h2>
      {orders.length === 0 ? (
        <p className="text-sm text-[#555555]">거래 내역이 없습니다.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[#555555] border-b border-[#2a2a2a]">
              <th className="text-left pb-3 font-medium">종목</th>
              <th className="text-center pb-3 font-medium">구분</th>
              <th className="text-right pb-3 font-medium">수량</th>
              <th className="text-right pb-3 font-medium">체결가</th>
              <th className="text-right pb-3 font-medium">총금액</th>
              <th className="text-right pb-3 font-medium">일시</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-[#222222] last:border-0">
                <td className="py-3">
                  {o.name && o.name !== o.symbol_code ? (
                    <>
                      <span className="font-medium text-[#f0f0f0]">{o.name}</span>
                      <span className="text-[#555555] text-xs ml-2">{o.symbol_code}</span>
                    </>
                  ) : (
                    <span className="font-medium text-[#f0f0f0]">{o.symbol_code}</span>
                  )}
                </td>
                <td className="text-center py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    o.side === 'BUY'
                      ? 'bg-[#ff4b4b]/10 text-[#ff4b4b]'
                      : 'bg-[#4b9eff]/10 text-[#4b9eff]'
                  }`}>
                    {o.side === 'BUY' ? '매수' : '매도'}
                  </span>
                </td>
                <td className="text-right py-3 text-[#888888]">{o.qty}주</td>
                <td className="text-right py-3 text-[#f0f0f0]">
                  {o.symbol_code.endsWith('.KS') || o.symbol_code.endsWith('.KQ')
                    ? `${Number(o.fill_price).toLocaleString('ko-KR')}원`
                    : `$${Number(o.fill_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </td>
                <td className="text-right py-3 text-[#f0f0f0]">
                  {o.symbol_code.endsWith('.KS') || o.symbol_code.endsWith('.KQ')
                    ? `${(Number(o.fill_price) * o.qty).toLocaleString('ko-KR')}원`
                    : `$${(Number(o.fill_price) * o.qty).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </td>
                <td className="text-right py-3 text-[#555555]">
                  {new Date(o.created_at).toLocaleString('ko-KR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

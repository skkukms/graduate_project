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
      .then((data) => setOrders(data.orders));
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
      <h2 className="text-lg font-semibold text-zinc-900 mb-4">거래 내역</h2>
      {orders.length === 0 ? (
        <p className="text-sm text-zinc-400">거래 내역이 없습니다.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-zinc-500 border-b border-zinc-100">
              <th className="text-left py-2">종목</th>
              <th className="text-center py-2">구분</th>
              <th className="text-right py-2">수량</th>
              <th className="text-right py-2">체결가</th>
              <th className="text-right py-2">총금액</th>
              <th className="text-right py-2">일시</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-zinc-50">
                <td className="py-2">
                  {o.name && o.name !== o.symbol_code ? (
                    <>
                      <span className="font-medium">{o.name}</span>
                      <span className="text-zinc-400 text-xs ml-2">{o.symbol_code}</span>
                    </>
                  ) : (
                    <span className="font-medium">{o.symbol_code}</span>
                  )}
                </td>
                <td className="text-center py-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${o.side === 'BUY' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    {o.side === 'BUY' ? '매수' : '매도'}
                  </span>
                </td>
                <td className="text-right py-2">{o.qty}주</td>
                <td className="text-right py-2">
                  {o.symbol_code.endsWith('.KS') || o.symbol_code.endsWith('.KQ')
                    ? `${Number(o.fill_price).toLocaleString('ko-KR')}원`
                    : `$${Number(o.fill_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </td>
                <td className="text-right py-2">
                  {o.symbol_code.endsWith('.KS') || o.symbol_code.endsWith('.KQ')
                    ? `${(Number(o.fill_price) * o.qty).toLocaleString('ko-KR')}원`
                    : `$${(Number(o.fill_price) * o.qty).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </td>
                <td className="text-right py-2 text-zinc-400">
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

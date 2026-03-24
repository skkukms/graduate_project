'use client';
import { useState } from 'react';

type Props = {
  symbol: string;
  currentPrice: number;
  onOrderComplete: () => void;
};

export default function OrderForm({ symbol, currentPrice, onOrderComplete }: Props) {
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleOrder(side: 'BUY' | 'SELL') {
    setLoading(true);
    setMessage('');

    const res = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, side, qty }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error);
    } else {
      setMessage(`${side === 'BUY' ? '매수' : '매도'} 완료! 체결가: ${data.fillPrice.toLocaleString('ko-KR')}원`);
      onOrderComplete();
    }

    setLoading(false);
  }

  return (
    <div className="bg-zinc-50 rounded-xl p-4 mt-4">
      <p className="text-sm text-zinc-500 mb-3">주문 수량</p>
      <div className="flex items-center gap-3 mb-3">
        <input
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          className="w-24 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-600"
        />
        <span className="text-sm text-zinc-500">
          예상금액: {(currentPrice * qty).toLocaleString('ko-KR')}원
        </span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => handleOrder('BUY')}
          disabled={loading}
          className="flex-1 rounded-lg bg-red-500 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
        >
          매수
        </button>
        <button
          onClick={() => handleOrder('SELL')}
          disabled={loading}
          className="flex-1 rounded-lg bg-blue-500 py-2.5 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
        >
          매도
        </button>
      </div>

      {message && (
        <p className="mt-3 text-sm text-zinc-700">{message}</p>
      )}
    </div>
  );
}

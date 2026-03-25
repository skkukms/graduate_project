'use client';
import { useEffect, useState, useCallback } from 'react';
import StockSearch from './StockSearch';
import Watchlist from './Watchlist';
import TradeHistory from './TradeHistory';
import PortfolioChart from './PortfolioChart';



type Position = {
  symbol_code: string;
  name: string;
  quantity: number;
  avg_price: number;
  realized_pnl: number;
  currentPrice: number;
  evalAmount: number;
  unrealizedPnl: number;
  unrealizedPnlRate: number;
};

export default function DashboardPage() {
  const [cashBalance, setCashBalance] = useState<number | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [totalEval, setTotalEval] = useState<number>(0);
  const [totalUnrealizedPnl, setTotalUnrealizedPnl] = useState<number>(0);
  const [resetting, setResetting] = useState(false);

  async function handleReset() {
    if (!confirm('계좌를 초기화하면 보유 종목과 거래 내역이 모두 삭제되고 초기 자금 1,000만원으로 돌아갑니다. 계속하시겠습니까?')) return;
    setResetting(true);
    await fetch('/api/account/reset', { method: 'POST' });
    await fetchDashboard();
    setResetting(false);
  }

  const fetchDashboard = useCallback(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((data) => {
        setCashBalance(data.cashBalance);
        setPositions(data.positions);
        setTotalEval(data.totalEval);
        setTotalUnrealizedPnl(data.totalUnrealizedPnl);
      });
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-zinc-900">대시보드</h1>
        <button
          onClick={handleReset}
          disabled={resetting}
          className="text-xs text-zinc-400 hover:text-red-500 border border-zinc-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {resetting ? '초기화 중...' : '계좌 초기화'}
        </button>
      </div>

      <StockSearch />

      {/* 잔고 요약 */}
    <div className="grid grid-cols-3 gap-4 mb-6">
    <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <p className="text-sm text-zinc-500 mb-1">보유 현금</p>
        <p className="text-2xl font-bold text-zinc-900">
        {cashBalance !== null ? Number(cashBalance).toLocaleString('ko-KR') + '원' : '로딩 중...'}
        </p>
    </div>
    <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <p className="text-sm text-zinc-500 mb-1">총 평가금액</p>
        <p className="text-2xl font-bold text-zinc-900">
        {Number(totalEval ?? 0).toLocaleString('ko-KR')}원
        </p>
    </div>
    <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <p className="text-sm text-zinc-500 mb-1">총 평가손익</p>
        <p className={`text-2xl font-bold ${(totalUnrealizedPnl ?? 0) >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
        {(totalUnrealizedPnl ?? 0) >= 0 ? '+' : ''}{Number(totalUnrealizedPnl ?? 0).toLocaleString('ko-KR')}원
        </p>
    </div>
    </div>
    {cashBalance !== null && (
    <PortfolioChart positions={positions} cashBalance={cashBalance} />
    )}



      {/* 보유 종목 */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">보유 종목</h2>
        {positions.length === 0 ? (
          <p className="text-sm text-zinc-400">보유 종목이 없습니다.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-100">
                <th className="text-left py-2">종목</th>
                <th className="text-right py-2">수량</th>
                <th className="text-right py-2">평균단가</th>
                <th className="text-right py-2">현재가</th>
                <th className="text-right py-2">평가손익</th>
                <th className="text-right py-2">수익률</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr key={p.symbol_code} className="border-b border-zinc-50">
                  <td className="py-2">
                    {p.name && p.name !== p.symbol_code ? (
                      <>
                        <span className="font-medium">{p.name}</span>
                        <span className="text-zinc-400 text-xs ml-2">{p.symbol_code}</span>
                      </>
                    ) : (
                      <span className="font-medium">{p.symbol_code}</span>
                    )}
                  </td>
                  <td className="text-right py-2">{p.quantity}주</td>
                  <td className="text-right py-2">{Number(p.avg_price).toLocaleString('ko-KR')}원</td>
                  <td className="text-right py-2">{Number(p.currentPrice).toLocaleString('ko-KR')}원</td>
                  <td className={`text-right py-2 ${p.unrealizedPnl >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                    {p.unrealizedPnl >= 0 ? '+' : ''}{Number(p.unrealizedPnl).toLocaleString('ko-KR')}원
                  </td>
                  <td className={`text-right py-2 ${p.unrealizedPnlRate >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                    {(p.unrealizedPnlRate ?? 0) >= 0 ? '+' : ''}{(p.unrealizedPnlRate ?? 0).toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Watchlist />
      <TradeHistory />
    </div>
  );
}

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
  const [loading, setLoading] = useState(true);
  const [cashBalance, setCashBalance] = useState<number | null>(null);
  const [totalAsset, setTotalAsset] = useState<number>(0);
  const [positions, setPositions] = useState<Position[]>([]);
  const [totalEval, setTotalEval] = useState<number>(0);
  const [totalUnrealizedPnl, setTotalUnrealizedPnl] = useState<number>(0);
  const [totalRealizedPnl, setTotalRealizedPnl] = useState<number>(0);
  const [resetting, setResetting] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const r = await fetch('/api/dashboard');
      if (!r.ok) return;
      const data = await r.json();
      setCashBalance(data.cashBalance ?? 0);
      setTotalAsset(data.totalAsset ?? 0);
      setPositions(data.positions ?? []);
      setTotalEval(data.totalEval ?? 0);
      setTotalUnrealizedPnl(data.totalUnrealizedPnl ?? 0);
      setTotalRealizedPnl(data.totalRealizedPnl ?? 0);
    } catch {
      // 네트워크 에러 무시
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  async function handleReset() {
    if (!confirm('계좌를 초기화하면 보유 종목과 거래 내역이 모두 삭제되고\n초기 자금 1,000만원으로 돌아갑니다. 계속하시겠습니까?')) return;
    setResetting(true);
    await fetch('/api/account/reset', { method: 'POST' });
    await fetchDashboard();
    setResetting(false);
  }

  return (
    <div className="min-h-screen bg-[#0e0e0e] p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#f0f0f0]">대시보드</h1>
        <button
          onClick={handleReset}
          disabled={resetting}
          className="text-xs text-[#555555] hover:text-[#ff4b4b] border border-[#2a2a2a] hover:border-[#ff4b4b]/30 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
        >
          {resetting ? '초기화 중...' : '계좌 초기화'}
        </button>
      </div>

      <StockSearch />

      {/* 잔고 요약 */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-5">
          <p className="text-xs text-[#555555] mb-2">총 자산</p>
          <p className="text-xl font-bold text-[#f0f0f0]">
            {loading ? <span className="text-[#333333]">——</span> : totalAsset.toLocaleString('ko-KR') + '원'}
          </p>
        </div>
        <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-5">
          <p className="text-xs text-[#555555] mb-2">보유 현금</p>
          <p className="text-xl font-bold text-[#f0f0f0]">
            {loading ? <span className="text-[#333333]">——</span> : (cashBalance ?? 0).toLocaleString('ko-KR') + '원'}
          </p>
        </div>
        <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-5">
          <p className="text-xs text-[#555555] mb-2">총 평가금액</p>
          <p className="text-xl font-bold text-[#f0f0f0]">
            {loading ? <span className="text-[#333333]">——</span> : totalEval.toLocaleString('ko-KR') + '원'}
          </p>
        </div>
        <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-5">
          <p className="text-xs text-[#555555] mb-2">총 평가손익</p>
          {loading ? (
            <p className="text-xl font-bold text-[#333333]">——</p>
          ) : (
            <p className={`text-xl font-bold ${totalUnrealizedPnl >= 0 ? 'text-[#ff4b4b]' : 'text-[#4b9eff]'}`}>
              {totalUnrealizedPnl >= 0 ? '+' : ''}{totalUnrealizedPnl.toLocaleString('ko-KR')}원
            </p>
          )}
        </div>
        <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-5">
          <p className="text-xs text-[#555555] mb-2">총 실현손익</p>
          {loading ? (
            <p className="text-xl font-bold text-[#333333]">——</p>
          ) : (
            <p className={`text-xl font-bold ${totalRealizedPnl >= 0 ? 'text-[#ff4b4b]' : 'text-[#4b9eff]'}`}>
              {totalRealizedPnl >= 0 ? '+' : ''}{totalRealizedPnl.toLocaleString('ko-KR')}원
            </p>
          )}
        </div>
      </div>

      {!loading && cashBalance !== null && (
        <PortfolioChart positions={positions} cashBalance={cashBalance} />
      )}

      {/* 보유 종목 */}
      <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-6 mb-4">
        <h2 className="text-base font-semibold text-[#f0f0f0] mb-4">보유 종목</h2>
        {loading ? (
          <p className="text-sm text-[#555555]">로딩 중...</p>
        ) : positions.length === 0 ? (
          <p className="text-sm text-[#555555]">보유 종목이 없습니다.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#555555] border-b border-[#2a2a2a]">
                <th className="text-left pb-3 font-medium">종목</th>
                <th className="text-right pb-3 font-medium">수량</th>
                <th className="text-right pb-3 font-medium">평균단가</th>
                <th className="text-right pb-3 font-medium">현재가</th>
                <th className="text-right pb-3 font-medium">평가손익</th>
                <th className="text-right pb-3 font-medium">수익률</th>
                <th className="text-right pb-3 font-medium">실현손익</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr key={p.symbol_code} className="border-b border-[#222222] last:border-0">
                  <td className="py-3">
                    {p.name && p.name !== p.symbol_code ? (
                      <>
                        <span className="font-medium text-[#f0f0f0]">{p.name}</span>
                        <span className="text-[#555555] text-xs ml-2">{p.symbol_code}</span>
                      </>
                    ) : (
                      <span className="font-medium text-[#f0f0f0]">{p.symbol_code}</span>
                    )}
                  </td>
                  <td className="text-right py-3 text-[#888888]">{p.quantity}주</td>
                  <td className="text-right py-3 text-[#888888]">{Number(p.avg_price).toLocaleString('ko-KR')}원</td>
                  <td className="text-right py-3 text-[#f0f0f0]">{Number(p.currentPrice).toLocaleString('ko-KR')}원</td>
                  <td className={`text-right py-3 ${p.unrealizedPnl >= 0 ? 'text-[#ff4b4b]' : 'text-[#4b9eff]'}`}>
                    {p.unrealizedPnl >= 0 ? '+' : ''}{Number(p.unrealizedPnl).toLocaleString('ko-KR')}원
                  </td>
                  <td className={`text-right py-3 ${p.unrealizedPnlRate >= 0 ? 'text-[#ff4b4b]' : 'text-[#4b9eff]'}`}>
                    {p.unrealizedPnlRate >= 0 ? '+' : ''}{p.unrealizedPnlRate.toFixed(2)}%
                  </td>
                  <td className={`text-right py-3 ${(p.realized_pnl ?? 0) >= 0 ? 'text-[#ff4b4b]' : 'text-[#4b9eff]'}`}>
                    {(p.realized_pnl ?? 0) >= 0 ? '+' : ''}{Math.round(Number(p.realized_pnl ?? 0)).toLocaleString('ko-KR')}원
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

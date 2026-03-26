'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import StockSearch from './StockSearch';
import Watchlist from './Watchlist';
import TradeHistory from './TradeHistory';
import PortfolioChart from './PortfolioChart';
import MarketIndices from './MarketIndices';

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
  const router = useRouter();
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
    <div className="min-h-screen bg-(--background) p-8 animate-fade-up">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-(--text-strong)">대시보드</h1>
        <button
          onClick={handleReset}
          disabled={resetting}
          className="text-xs text-(--text-subtle) hover:text-[#ff4b4b] border border-(--border) hover:border-[#ff4b4b]/30 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
        >
          {resetting ? '초기화 중...' : '계좌 초기화'}
        </button>
      </div>

      <MarketIndices />

      <StockSearch />

      {/* 잔고 요약 */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        {[
          { label: '총 자산', value: loading ? null : totalAsset, color: 'text-(--text-strong)' },
          { label: '보유 현금', value: loading ? null : (cashBalance ?? 0), color: 'text-(--text-strong)' },
          { label: '총 평가금액', value: loading ? null : totalEval, color: 'text-(--text-strong)' },
          { label: '총 평가손익', value: loading ? null : totalUnrealizedPnl, color: totalUnrealizedPnl >= 0 ? 'text-[#ff4b4b]' : 'text-[#4b9eff]' },
          { label: '총 실현손익', value: loading ? null : totalRealizedPnl, color: totalRealizedPnl >= 0 ? 'text-[#ff4b4b]' : 'text-[#4b9eff]' },
        ].map((card, i) => (
          <div key={card.label} className={`bg-(--surface) rounded-2xl border border-(--border) p-5 card-hover animate-fade-up stagger-${i + 1}`}>
            <p className="text-xs text-(--text-subtle) mb-2">{card.label}</p>
            {card.value === null ? (
              <p className="text-xl font-bold text-(--border-hover)">——</p>
            ) : (
              <p className={`text-xl font-bold ${card.color}`}>
                {i >= 3 && card.value > 0 ? '+' : ''}{card.value.toLocaleString('ko-KR')}원
              </p>
            )}
          </div>
        ))}
      </div>

      {!loading && cashBalance !== null && (
        <PortfolioChart positions={positions} cashBalance={cashBalance} />
      )}

      {/* 보유 종목 */}
      <div className="bg-(--surface) rounded-2xl border border-(--border) p-6 mb-4">
        <h2 className="text-base font-semibold text-(--text-strong) mb-4">보유 종목</h2>
        {loading ? (
          <p className="text-sm text-(--text-subtle)">로딩 중...</p>
        ) : positions.length === 0 ? (
          <p className="text-sm text-(--text-subtle)">보유 종목이 없습니다.</p>
        ) : (
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr className="text-(--text-subtle)">
                <th className="text-left pb-3 font-medium border-b border-(--border)">종목</th>
                <th className="text-right pb-3 font-medium border-b border-(--border)">수량</th>
                <th className="text-right pb-3 font-medium border-b border-(--border)">평균단가</th>
                <th className="text-right pb-3 font-medium border-b border-(--border)">현재가</th>
                <th className="text-right pb-3 font-medium border-b border-(--border)">평가손익</th>
                <th className="text-right pb-3 font-medium border-b border-(--border)">수익률</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr
                  key={p.symbol_code}
                  onClick={() => router.push(`/chart?symbol=${p.symbol_code}`)}
                  className="cursor-pointer group"
                >
                  <td className="py-0 pl-0 border-b border-(--surface-2) group-last:border-0 rounded-l-2xl group-hover:bg-white/[0.04] transition-all duration-150">
                    <div className="flex items-center gap-3 py-3">
                      <div className="w-[3px] self-stretch rounded-r-full bg-transparent group-hover:bg-[#4b9eff] transition-all duration-200" />
                      {p.name && p.name !== p.symbol_code ? (
                        <>
                          <span className="font-medium text-(--text-strong) group-hover:text-white transition-colors duration-150">{p.name}</span>
                          <span className="text-(--text-subtle) text-xs">{p.symbol_code}</span>
                        </>
                      ) : (
                        <span className="font-medium text-(--text-strong) group-hover:text-white transition-colors duration-150">{p.symbol_code}</span>
                      )}
                    </div>
                  </td>
                  <td className="text-right py-3 border-b border-(--surface-2) group-last:border-0 group-hover:bg-white/[0.04] text-(--text-muted) group-hover:text-(--text) transition-all duration-150">{p.quantity}주</td>
                  <td className="text-right py-3 border-b border-(--surface-2) group-last:border-0 group-hover:bg-white/[0.04] text-(--text-muted) group-hover:text-(--text) transition-all duration-150">{Number(p.avg_price).toLocaleString('ko-KR')}원</td>
                  <td className="text-right py-3 border-b border-(--surface-2) group-last:border-0 group-hover:bg-white/[0.04] text-(--text-strong) group-hover:text-white transition-all duration-150">{Number(p.currentPrice).toLocaleString('ko-KR')}원</td>
                  <td className={`text-right py-3 border-b border-(--surface-2) group-last:border-0 group-hover:bg-white/[0.04] transition-all duration-150 ${p.unrealizedPnl >= 0 ? 'text-[#ff4b4b]' : 'text-[#4b9eff]'}`}>
                    {p.unrealizedPnl >= 0 ? '+' : ''}{Number(p.unrealizedPnl).toLocaleString('ko-KR')}원
                  </td>
                  <td className={`text-right py-3 pr-1 border-b border-(--surface-2) group-last:border-0 rounded-r-2xl group-hover:bg-white/[0.04] transition-all duration-150 ${p.unrealizedPnlRate >= 0 ? 'text-[#ff4b4b]' : 'text-[#4b9eff]'}`}>
                    {p.unrealizedPnlRate >= 0 ? '+' : ''}{p.unrealizedPnlRate.toFixed(2)}%
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

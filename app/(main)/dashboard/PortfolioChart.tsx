'use client';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';

type Position = { symbol_code: string; name: string; evalAmount: number };
type Props = { positions: Position[]; cashBalance: number };

const COLORS = ['#4b9eff', '#ff4b4b', '#f59e0b', '#10b981', '#8b5cf6', '#f97316', '#06b6d4', '#84cc16'];

export default function PortfolioChart({ positions, cashBalance }: Props) {
  const data = [
    ...positions.map((p) => ({ name: p.name || p.symbol_code, value: Math.round(p.evalAmount) })),
    { name: '현금', value: Math.round(cashBalance) },
  ].map((item, index) => ({ ...item, color: COLORS[index % COLORS.length] }))
   .sort((a, b) => b.value - a.value);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="bg-(--surface) rounded-2xl border border-(--border) p-6 mb-4">
        <h2 className="text-base font-semibold text-(--text-strong) mb-4">포트폴리오 비중</h2>
        <p className="text-sm text-(--text-subtle)">보유 종목 또는 현금이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-(--surface) rounded-2xl border border-(--border) p-6 mb-4">
      <h2 className="text-base font-semibold text-(--text-strong) mb-5">포트폴리오 비중</h2>

      <div className="flex items-center gap-6">
        {/* 파이차트 - 크기 축소 */}
        <div className="shrink-0">
          <PieChart width={160} height={160}>
            <Pie data={data} cx="50%" cy="50%" innerRadius={42} outerRadius={72} paddingAngle={2} dataKey="value">
              {data.map((item, index) => (
                <Cell key={index} fill={item.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#1c2230', border: '1px solid #2a3444', borderRadius: 8 }}
              labelStyle={{ color: '#7d8590' }}
              itemStyle={{ color: '#eaeef2' }}
              formatter={(value: any) => [
                `${Number(value).toLocaleString('ko-KR')}원 (${((Number(value) / total) * 100).toFixed(1)}%)`,
              ]}
            />
          </PieChart>
        </div>

        {/* 리스트 + 퍼센트 바 */}
        <div className="flex-1 space-y-2">
          {data.map((item, index) => {
            const pct = (item.value / total) * 100;
            return (
              <div key={item.name}>
                {/* 종목명 + 금액 */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-(--text-muted)">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-(--text-subtle)">{pct.toFixed(1)}%</span>
                    <span className="text-sm font-medium text-(--text-strong) w-28 text-right">
                      {item.value.toLocaleString('ko-KR')}원
                    </span>
                  </div>
                </div>
                {/* 퍼센트 바 */}
                <div className="h-1.5 rounded-full bg-(--surface-2) overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

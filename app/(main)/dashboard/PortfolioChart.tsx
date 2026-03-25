'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type Position = {
  symbol_code: string;
  name: string;
  evalAmount: number;
};

type Props = {
  positions: Position[];
  cashBalance: number;
};

const COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#f97316', '#06b6d4', '#84cc16'];

export default function PortfolioChart({ positions, cashBalance }: Props) {
  const data = [
    ...positions.map((p) => ({
      name: p.name || p.symbol_code,
      value: Math.round(p.evalAmount),
    })),
    { name: '현금', value: Math.round(cashBalance) },
  ];

  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">포트폴리오 비중</h2>
        <p className="text-sm text-zinc-400">보유 종목 또는 현금이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
      <h2 className="text-lg font-semibold text-zinc-900 mb-6">포트폴리오 비중</h2>

      <div className="flex items-center gap-8">
        {/* 도넛 차트 */}
        <div style={{ width: 256, height: 256 }} className="shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => [
                    `${Number(value).toLocaleString('ko-KR')}원 (${((Number(value) / total) * 100).toFixed(1)}%)`,
                ]}
                />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 범례 */}
        <div className="flex-1">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-zinc-700">{item.name}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-zinc-900">{item.value.toLocaleString('ko-KR')}원</p>
                <p className="text-xs text-zinc-400">{((item.value / total) * 100).toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

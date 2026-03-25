'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

type Position = { symbol_code: string; name: string; evalAmount: number };
type Props = { positions: Position[]; cashBalance: number };

const COLORS = ['#4b9eff', '#ff4b4b', '#f59e0b', '#10b981', '#8b5cf6', '#f97316', '#06b6d4', '#84cc16'];

export default function PortfolioChart({ positions, cashBalance }: Props) {
  const data = [
    ...positions.map((p) => ({ name: p.name || p.symbol_code, value: Math.round(p.evalAmount) })),
    { name: '현금', value: Math.round(cashBalance) },
  ];

  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-6 mb-4">
        <h2 className="text-base font-semibold text-[#f0f0f0] mb-4">포트폴리오 비중</h2>
        <p className="text-sm text-[#555555]">보유 종목 또는 현금이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-6 mb-4">
      <h2 className="text-base font-semibold text-[#f0f0f0] mb-6">포트폴리오 비중</h2>

      <div className="flex items-center gap-8">
        <div style={{ width: 220, height: 220 }} className="shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={2} dataKey="value">
                {data.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8 }}
                labelStyle={{ color: '#888888' }}
                itemStyle={{ color: '#f0f0f0' }}
                formatter={(value: any) => [
                  `${Number(value).toLocaleString('ko-KR')}원 (${((Number(value) / total) * 100).toFixed(1)}%)`,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-1">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between py-2 border-b border-[#222222] last:border-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-sm text-[#888888]">{item.name}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-[#f0f0f0]">{item.value.toLocaleString('ko-KR')}원</p>
                <p className="text-xs text-[#555555]">{((item.value / total) * 100).toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

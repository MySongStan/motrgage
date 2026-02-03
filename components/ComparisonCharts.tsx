
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, ReferenceLine, Label } from 'recharts';
import { Comparison } from '../types';

interface Props {
  comparison: Comparison;
}

export const ComparisonCharts: React.FC<Props> = ({ comparison }) => {
  // 1. 资产回收（剩余本金）趋势数据
  const balanceData = useMemo(() => {
    return comparison.baseline.schedule.filter((_, i) => i % 12 === 0 || i === comparison.baseline.schedule.length - 1).map(b => {
      const o = comparison.optimized.schedule.find(item => item.month === b.month) || { remainingBalance: 0 };
      return {
        name: `第${Math.floor(b.month / 12)}年`,
        '原计划余额': Math.round(b.remainingBalance),
        '提前还款余额': Math.round(o.remainingBalance),
      };
    });
  }, [comparison]);

  // 2. 核心：月供本息博弈全量数据
  // 注意：这里仅展示“标准月供”中的本息构成，排除了额外的一次性/月度提前还款，
  // 这样可以清晰看到标准还款额中，本金占比如何随时间（及提前还款带来的本金减少）而提升。
  const compositionData = useMemo(() => {
    return comparison.optimized.schedule.map(row => ({
      month: row.month,
      name: `第${row.month}期`,
      '本金部分': Math.round(row.principalPaid),
      '利息部分': Math.round(row.interestPaid),
      '标准月供': Math.round(row.principalPaid + row.interestPaid)
    }));
  }, [comparison]);

  // 寻找博弈分水岭：标准月供中本金超过利息的月份
  const crossoverMonth = useMemo(() => {
    const crossover = comparison.optimized.schedule.find(s => s.principalPaid > s.interestPaid);
    return crossover ? crossover.month : null;
  }, [comparison]);

  const crossoverLabel = crossoverMonth ? `第${crossoverMonth}期 (约${(crossoverMonth / 12).toFixed(1)}年)` : null;

  // 3. 总体支出构成饼图
  const pieData = [
    { name: '总本金', value: comparison.optimized.totalPayment - comparison.optimized.totalInterest },
    { name: '总利息', value: comparison.optimized.totalInterest },
  ];

  const PIE_COLORS = ['#3b82f6', '#f87171']; 

  return (
    <div className="space-y-8 mt-8">
      {/* 顶部简报 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 下降曲线 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
            <i className="fas fa-chart-line text-blue-500"></i>
            本金消减速度对比
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={balanceData}>
                <defs>
                  <linearGradient id="colorOptimized" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${(val / 10000).toFixed(0)}万`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => [`¥${(value / 10000).toFixed(2)}万元`, '']}
                />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '11px', paddingBottom: '20px' }} />
                <Area type="monotone" dataKey="原计划余额" stroke="#cbd5e1" fill="transparent" strokeWidth={2} strokeDasharray="4 4" name="原计划" />
                <Area type="monotone" dataKey="提前还款余额" stroke="#3b82f6" fillOpacity={1} fill="url(#colorOptimized)" strokeWidth={3} name="优化方案" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 饼图比例 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
            <i className="fas fa-chart-pie text-indigo-500"></i>
            结清后总资金流向
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => `¥${(value / 10000).toFixed(2)}万元`} 
                />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-[46%] left-[50%] -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">累计支出</div>
              <div className="text-lg font-black text-slate-800 tabular-nums">¥{(comparison.optimized.totalPayment / 10000).toFixed(1)}万</div>
            </div>
          </div>
        </div>
      </div>

      {/* 核心：每一期的标准月供博弈变幻图 */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <i className="fas fa-balance-scale text-blue-600"></i>
              标准月供成分动态博弈 (本金 vs 利息)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              展示标准还款额中，本金与利息的比例演变。提前还款会通过消灭本金来减少后续利息，加速该曲线的优化。
            </p>
          </div>
          {crossoverLabel && (
            <div className="bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-emerald-100 flex items-center gap-3">
               <i className="fas fa-flag-checkered animate-bounce"></i>
               <div>
                  <div className="text-[10px] font-bold uppercase opacity-80 leading-none">本金反超点 (分水岭)</div>
                  <div className="text-sm font-black">{crossoverLabel}</div>
               </div>
            </div>
          )}
        </div>

        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={compositionData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.6}/>
                </linearGradient>
                <linearGradient id="gradI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.6}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="month" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(val) => `第${val}期`}
                interval={Math.floor(compositionData.length / 10)}
              />
              <YAxis 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(val) => `¥${val}`}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '16px' }}
                itemStyle={{ fontSize: '13px', fontWeight: 'bold' }}
                labelStyle={{ marginBottom: '8px', color: '#64748b', fontWeight: 'bold' }}
                cursor={{ stroke: '#94a3b8', strokeWidth: 1 }}
                formatter={(value: number) => [`¥${value.toLocaleString()}`, '']}
              />
              
              {/* 分水岭参考线 */}
              {crossoverMonth && (
                <ReferenceLine x={crossoverMonth} stroke="#10b981" strokeDasharray="5 5" strokeWidth={2}>
                  <Label value="转折点" position="top" fill="#059669" fontSize={10} fontWeight="bold" />
                </ReferenceLine>
              )}

              {/* 堆叠结构：利息（底部，成本）-> 本金（顶部，资产） */}
              <Area 
                type="monotone" 
                dataKey="利息部分" 
                stackId="1" 
                stroke="#ef4444" 
                fill="url(#gradI)" 
                strokeWidth={2}
                name="利息支出 (纯成本)"
              />
              <Area 
                type="monotone" 
                dataKey="本金部分" 
                stackId="1" 
                stroke="#3b82f6" 
                fill="url(#gradP)" 
                strokeWidth={2}
                name="本金还款 (存资产)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
           <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1">
                 <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
                   <i className="fas fa-lightbulb text-amber-500"></i>
                   为什么不展示“额外还款”？
                 </h4>
                 <p className="text-xs text-slate-500 mb-4">为了保持图表比例清晰，我们移除了大额一次性还款造成的视觉尖峰。本图专注于展示您的“常规月供”内部结构的优化过程。</p>
                 <ul className="text-xs text-slate-600 space-y-2">
                   <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1 shrink-0"></span>
                      <span><b>利息部分：</b>随着提前还款的注入，剩余本金减少，每月的利息支出会迅速萎缩。</span>
                   </li>
                   <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 shrink-0"></span>
                      <span><b>本金部分：</b>利息减少后，月供中会有更多份额用于归还本金，形成良性循环。</span>
                   </li>
                 </ul>
              </div>
              <div className="hidden md:block w-px h-24 bg-slate-200"></div>
              <div className="flex-1 text-center md:text-left">
                 <p className="text-xs font-medium text-slate-500 mb-1">博弈结论：</p>
                 <p className="text-sm font-bold text-slate-800">
                   提前还款最大的意义不在于“少交钱”，而是在于强行改变了还款模型，让您更早进入“大部分月供都在归还本金”的黄金期。
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

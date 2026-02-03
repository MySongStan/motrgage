
import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { MortgageInputs, EarlyRepaymentInputs, Comparison, RateChange, RepaymentMethod } from './types';
import { simulateMortgage } from './services/mortgageUtils';
import { ComparisonCharts } from './components/ComparisonCharts';
import { getMortgageAdvice } from './services/geminiAdvice';

const App: React.FC = () => {
  const [mortgage, setMortgage] = useState<MortgageInputs>({
    principal: 1000000,
    annualRate: 4.2,
    totalMonths: 360,
    startDate: new Date().toISOString().split('T')[0],
    rateChanges: [],
    repaymentMethod: 'EMI',
  });

  const [early, setEarly] = useState<EarlyRepaymentInputs>({
    oneTimeAmount: 100000,
    oneTimeMonth: 12,
    monthlyExtra: 2000,
    strategy: 'REDUCE_TERM',
  });

  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAdviceExpanded, setIsAdviceExpanded] = useState(true);
  
  // Table pagination state
  const INITIAL_VISIBLE_ROWS = 24;
  const [visibleRows, setVisibleRows] = useState(INITIAL_VISIBLE_ROWS);

  // Rate Change Management
  const addRateChange = () => {
    const lastRate = mortgage.rateChanges.length > 0 
      ? mortgage.rateChanges[mortgage.rateChanges.length - 1].newRate 
      : mortgage.annualRate;
    
    const newChange: RateChange = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      newRate: lastRate,
    };
    setMortgage({ ...mortgage, rateChanges: [...mortgage.rateChanges, newChange] });
  };

  const removeRateChange = (id: string) => {
    setMortgage({ ...mortgage, rateChanges: mortgage.rateChanges.filter(rc => rc.id !== id) });
  };

  const updateRateChange = (id: string, field: keyof RateChange, value: any) => {
    setMortgage({
      ...mortgage,
      rateChanges: mortgage.rateChanges.map(rc => rc.id === id ? { ...rc, [field]: value } : rc)
    });
  };

  // Calculate both scenarios for comparison
  const scenarios = useMemo(() => {
    const baseline = simulateMortgage(mortgage);
    const reduceTerm = simulateMortgage(mortgage, { ...early, strategy: 'REDUCE_TERM' });
    const reduceMonthly = simulateMortgage(mortgage, { ...early, strategy: 'REDUCE_MONTHLY' });
    
    return {
      baseline,
      reduceTerm,
      reduceMonthly,
      bestStrategy: reduceTerm.totalInterest < reduceMonthly.totalInterest ? 'REDUCE_TERM' : 'REDUCE_MONTHLY',
      interestGap: Math.abs(reduceTerm.totalInterest - reduceMonthly.totalInterest)
    };
  }, [mortgage, early]);

  const comparison = useMemo<Comparison>(() => {
    const currentOptimized = early.strategy === 'REDUCE_TERM' ? scenarios.reduceTerm : scenarios.reduceMonthly;
    return {
      baseline: scenarios.baseline,
      optimized: currentOptimized,
      savings: {
        interest: scenarios.baseline.totalInterest - currentOptimized.totalInterest,
        months: scenarios.baseline.totalMonths - currentOptimized.totalMonths,
        money: (scenarios.baseline.totalInterest - currentOptimized.totalInterest)
      }
    };
  }, [scenarios, early.strategy]);

  const fetchAdvice = async () => {
    setIsAiLoading(true);
    setIsAdviceExpanded(true);
    const advice = await getMortgageAdvice(comparison);
    setAiAdvice(advice);
    setIsAiLoading(false);
  };

  const handleLoadMore = () => {
    setVisibleRows(prev => prev + 24);
  };

  const handleShowAll = () => {
    setVisibleRows(comparison.optimized.schedule.length);
  };

  const handleCollapse = () => {
    setVisibleRows(INITIAL_VISIBLE_ROWS);
    const tableElement = document.getElementById('repayment-table');
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <i className="fas fa-hand-holding-dollar"></i>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              房贷提前还款决策器
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-100">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest">智能最优解已就绪</span>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Controls Sidebar */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
                <i className="fas fa-file-invoice-dollar text-blue-500"></i>
                贷款基本信息
              </h2>
              <div className="space-y-4">
                {/* Repayment Method Switch */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">还款方式</label>
                  <div className="flex p-1 bg-slate-100 rounded-xl">
                    <button 
                      onClick={() => setMortgage({...mortgage, repaymentMethod: 'EMI'})}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mortgage.repaymentMethod === 'EMI' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      等额本息
                    </button>
                    <button 
                      onClick={() => setMortgage({...mortgage, repaymentMethod: 'EQUAL_PRINCIPAL'})}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mortgage.repaymentMethod === 'EQUAL_PRINCIPAL' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      等额本金
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 px-1">
                    {mortgage.repaymentMethod === 'EMI' ? '每月还款金额固定，利息总额较高。' : '每月还款本金固定，还款额逐月递减。'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">贷款总额 (元)</label>
                  <input 
                    type="number" 
                    value={mortgage.principal} 
                    onChange={e => setMortgage({...mortgage, principal: Number(e.target.value)})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">初始年利率 (%)</label>
                    <input 
                      type="number" step="0.01"
                      value={mortgage.annualRate} 
                      onChange={e => setMortgage({...mortgage, annualRate: Number(e.target.value)})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">贷款期限 (期)</label>
                    <input 
                      type="number" 
                      value={mortgage.totalMonths} 
                      onChange={e => setMortgage({...mortgage, totalMonths: Number(e.target.value)})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Rate Changes */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">利率调整</label>
                    <button onClick={addRateChange} className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded transition-colors">+ 添加</button>
                  </div>
                  <div className="space-y-3">
                    {mortgage.rateChanges.map(rc => (
                      <div key={rc.id} className="flex gap-2 items-end bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">执行日期</label>
                          <input type="date" value={rc.date} onChange={e => updateRateChange(rc.id, 'date', e.target.value)} className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded outline-none" />
                        </div>
                        <div className="w-20">
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">新利率%</label>
                          <input type="number" step="0.01" value={rc.newRate} onChange={e => updateRateChange(rc.id, 'newRate', Number(e.target.value))} className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded outline-none" />
                        </div>
                        <button onClick={() => removeRateChange(rc.id)} className="p-2 text-slate-300 hover:text-red-500"><i className="fas fa-trash-can text-xs"></i></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
                <i className="fas fa-bolt text-amber-500"></i>
                提前还款方案
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">一次性还款 (元)</label>
                    <input type="number" value={early.oneTimeAmount} onChange={e => setEarly({...early, oneTimeAmount: Number(e.target.value)})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">还款期数</label>
                    <input type="number" min="1" max={mortgage.totalMonths} value={early.oneTimeMonth} onChange={e => setEarly({...early, oneTimeMonth: Math.max(1, Number(e.target.value))})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">每月追加 (元)</label>
                  <input type="number" value={early.monthlyExtra} onChange={e => setEarly({...early, monthlyExtra: Number(e.target.value)})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">还款策略</label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button onClick={() => setEarly({...early, strategy: 'REDUCE_TERM'})} className={`relative px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${early.strategy === 'REDUCE_TERM' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'}`}>缩短年限</button>
                    <button onClick={() => setEarly({...early, strategy: 'REDUCE_MONTHLY'})} className={`relative px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${early.strategy === 'REDUCE_MONTHLY' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'}`}>减少月供</button>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Results Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Best Strategy Card */}
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-trophy text-amber-400"></i>
                    <span className="text-sm font-bold uppercase tracking-widest text-indigo-200">最优还款分析</span>
                  </div>
                  <div className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-mono">还款方式: {mortgage.repaymentMethod === 'EMI' ? '等额本息' : '等额本金'}</div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div>
                    <h3 className="text-xl font-bold mb-2">选择 <span className="text-amber-400">“{scenarios.bestStrategy === 'REDUCE_TERM' ? '缩短年限' : '减少月供'}”</span></h3>
                    <p className="text-indigo-200 text-sm leading-relaxed">相比另一种提前还款策略，此方案可再省利息约 <span className="text-white font-bold text-lg">¥{Math.round(scenarios.interestGap).toLocaleString()}</span>。</p>
                  </div>
                  <div className="flex gap-4">
                     <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                        <div className="text-[10px] text-indigo-300 mb-1">缩短年限利息</div>
                        <div className="text-lg font-bold">¥{(scenarios.reduceTerm.totalInterest / 10000).toFixed(1)}万</div>
                     </div>
                     <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                        <div className="text-[10px] text-indigo-300 mb-1">减少月供利息</div>
                        <div className="text-lg font-bold">¥{(scenarios.reduceMonthly.totalInterest / 10000).toFixed(1)}万</div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="text-slate-400 text-xs font-medium uppercase mb-1">利息节省</div>
                <div className="text-3xl font-bold text-blue-600">¥{(comparison.savings.interest).toLocaleString()}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="text-slate-400 text-xs font-medium uppercase mb-1">提前结清</div>
                <div className="text-3xl font-bold text-slate-800">{comparison.savings.months} 期</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="text-slate-400 text-xs font-medium uppercase mb-1">最后月供</div>
                <div className="text-3xl font-bold text-slate-800">¥{Math.round(comparison.optimized.schedule[comparison.optimized.schedule.length - 1]?.payment || 0).toLocaleString()}</div>
              </div>
            </div>

            {/* AI Advice */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setIsAdviceExpanded(!isAdviceExpanded)}>
                  <i className="fas fa-robot text-indigo-600"></i>
                  <span className="font-semibold text-indigo-900">AI 理财建议</span>
                </div>
                <button onClick={fetchAdvice} disabled={isAiLoading} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
                  {isAiLoading ? <i className="fas fa-spinner fa-spin"></i> : '获取分析'}
                </button>
              </div>
              {isAdviceExpanded && aiAdvice && (
                <div className="p-6 prose prose-slate prose-sm max-w-none">
                  <ReactMarkdown>{aiAdvice}</ReactMarkdown>
                </div>
              )}
            </div>

            <ComparisonCharts comparison={comparison} />

            {/* Repayment Table */}
            <div id="repayment-table" className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">还款明细 (共 {comparison.optimized.totalMonths} 期)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500">
                      <th className="px-6 py-3 whitespace-nowrap">期数</th>
                      <th className="px-6 py-3 whitespace-nowrap">月供 (元)</th>
                      <th className="px-6 py-3 whitespace-nowrap">本金/利息</th>
                      <th className="px-6 py-3 whitespace-nowrap">额外还款</th>
                      <th className="px-6 py-3 whitespace-nowrap">余额</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {comparison.optimized.schedule.slice(0, visibleRows).map((row) => (
                      <tr key={row.month} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-400">#{row.month}</td>
                        <td className="px-6 py-4 font-semibold text-slate-800">¥{Math.round(row.payment).toLocaleString()}</td>
                        <td className="px-6 py-4 text-xs whitespace-nowrap">
                           <div className="flex items-center gap-2">
                              <span className="text-blue-600">本:¥{Math.round(row.principalPaid)}</span>
                              <span className="text-red-400">利:¥{Math.round(row.interestPaid)}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                          {row.extraPaid > 0 ? (
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold">+¥{row.extraPaid.toLocaleString()}</span>
                          ) : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">¥{Math.round(row.remainingBalance).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-slate-50/50 border-t border-slate-50 flex flex-col items-center gap-4">
                {visibleRows < comparison.optimized.schedule.length ? (
                  <button onClick={handleLoadMore} className="px-6 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-full shadow-sm hover:bg-slate-50 transition-all">查看更多 (24期)</button>
                ) : visibleRows > INITIAL_VISIBLE_ROWS && (
                  <button onClick={handleCollapse} className="px-6 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-full">收起明细</button>
                )}
                <p className="text-[10px] text-slate-400 italic">当前展示 {Math.min(visibleRows, comparison.optimized.schedule.length)} / {comparison.optimized.totalMonths} 期</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="text-center py-10 text-slate-400 text-xs">© 2024 Mortgage Optimizer Pro - 专业房贷决策支持系统</footer>
      <SpeedInsights />
    </div>
  );
};

export default App;

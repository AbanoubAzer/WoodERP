import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';

interface SalesAndProfitsProps {
  salesTotal: number;
  purchasesTotal: number;
  expensesTotal: number;
  salesTrend: { date: string; sales: number }[];
}

export function SalesAndProfits({ salesTotal, purchasesTotal, expensesTotal, salesTrend }: SalesAndProfitsProps) {
  // Simple profit calculation for demonstration (Sales - Purchases - Expenses)
  const estimatedProfit = salesTotal - purchasesTotal - expensesTotal;
  const isProfitable = estimatedProfit >= 0;

  // Format data for chart
  const chartData = salesTrend?.map(item => {
    const d = new Date(item.date);
    return {
      name: `${d.getDate()}/${d.getMonth() + 1}`,
      المبيعات: item.sales
    };
  }) || [];

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 rounded-xl">
            <BarChart3 className="text-emerald-600" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">المبيعات والأرباح</h2>
            <p className="text-sm text-slate-500 font-medium">نظرة عامة على أداء المبيعات وصافي الأرباح التقديرية</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-slate-100">
        
        {/* KPI Summaries */}
        <div className="p-6 space-y-6 lg:col-span-1 bg-slate-50/30">
          <div>
            <p className="text-sm font-bold text-slate-500 mb-1">إجمالي المبيعات (الشهر)</p>
            <div className="text-2xl font-black text-slate-900" dir="ltr">
              {salesTotal?.toLocaleString() || 0} <span className="text-sm text-slate-400">ج.م</span>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-bold text-slate-500 mb-1">صافي الربح التقديري</p>
            <div className="flex items-center gap-2">
              {isProfitable ? (
                <div className="bg-emerald-100 text-emerald-700 p-1.5 rounded-lg">
                  <TrendingUp size={20} />
                </div>
              ) : (
                <div className="bg-rose-100 text-rose-700 p-1.5 rounded-lg">
                  <TrendingDown size={20} />
                </div>
              )}
              <div className={`text-2xl font-black ${isProfitable ? 'text-emerald-600' : 'text-rose-600'}`} dir="ltr">
                {isProfitable ? '+' : ''}{estimatedProfit?.toLocaleString() || 0} <span className="text-sm opacity-60">ج.م</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              * محسوب كالتالي: المبيعات - (المشتريات + المصروفات)
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="p-6 lg:col-span-2 h-72">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} tickFormatter={(value) => `${value}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="المبيعات" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium">
              لا توجد بيانات مبيعات لعرضها حالياً
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

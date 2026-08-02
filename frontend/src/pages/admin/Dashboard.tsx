import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { TrendingUp, ShoppingBag, Receipt, Users, Building2, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function Dashboard() {
  const token = useAuthStore(state => state.token);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setData(data);
      setLoading(false);
    });
  }, [token]);

  if (loading || !data) {
    return <div className="p-8 text-center text-slate-500 font-bold text-lg animate-pulse">جاري تجميع بيانات لوحة القيادة...</div>;
  }

  const profit = data.salesTotal - data.purchasesTotal - data.expensesTotal;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">نظرة عامة على الأعمال</h1>
          <p className="text-slate-500 font-medium mt-1">ملخص الأداء المالي والتشغيلي (للشهر الحالي)</p>
        </div>
        <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <div className={`p-3 rounded-xl flex items-center justify-center ${profit >= 0 ? 'bg-emerald-100' : 'bg-rose-100'}`}>
            {profit >= 0 ? <ArrowUpRight className="text-emerald-600" size={24} /> : <ArrowDownRight className="text-rose-600" size={24} />}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400">صافي الربح التقديري</p>
            <p className={`text-xl font-black ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {profit.toLocaleString()} ج.م
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        
        {/* Sales */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden group text-white">
          <div className="absolute -left-6 -bottom-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
            <TrendingUp size={140} />
          </div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-indigo-100 font-bold text-sm mb-2">المبيعات (الشهر)</p>
              <h3 className="text-3xl font-black">{data.salesTotal.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
              <TrendingUp className="text-white" size={24} />
            </div>
          </div>
        </div>

        {/* Purchases */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden group text-white">
          <div className="absolute -left-6 -bottom-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
            <ShoppingBag size={140} />
          </div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-blue-100 font-bold text-sm mb-2">المشتريات (الشهر)</p>
              <h3 className="text-3xl font-black">{data.purchasesTotal.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
              <ShoppingBag className="text-white" size={24} />
            </div>
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-gradient-to-br from-orange-400 to-rose-500 p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden group text-white">
          <div className="absolute -left-6 -bottom-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
            <Receipt size={140} />
          </div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-orange-50 font-bold text-sm mb-2">المصروفات (الشهر)</p>
              <h3 className="text-3xl font-black">{data.expensesTotal.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
              <Receipt className="text-white" size={24} />
            </div>
          </div>
        </div>

        {/* Cash Position */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden group col-span-1 md:col-span-2 lg:col-span-1 xl:col-span-1 text-white border border-slate-700">
          <div className="absolute -left-6 -bottom-6 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity transform group-hover:scale-110 duration-500">
            <Wallet size={140} />
          </div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-slate-400 font-bold text-sm mb-2">السيولة النقدية (الخزائن والبنوك)</p>
              <h3 className="text-3xl font-black text-emerald-400">{data.cashPosition.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
              <Wallet className="text-emerald-400" size={24} />
            </div>
          </div>
        </div>

      </div>

      {/* Second Row: Debts & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Debts Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-emerald-50 p-2 rounded-xl"><Users className="text-emerald-600" size={20} /></div>
              <h3 className="font-bold text-slate-800">الديون المستحقة (لنا)</h3>
            </div>
            <p className="text-3xl font-black text-slate-900 mb-2">{data.receivables.toLocaleString()}</p>
            <p className="text-sm font-bold text-slate-500">مستحقات على العملاء</p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-rose-50 p-2 rounded-xl"><Building2 className="text-rose-600" size={20} /></div>
              <h3 className="font-bold text-slate-800">الديون المطلوبة (علينا)</h3>
            </div>
            <p className="text-3xl font-black text-slate-900 mb-2">{data.payables.toLocaleString()}</p>
            <p className="text-sm font-bold text-slate-500">مستحقات للموردين</p>
          </div>
        </div>

        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-xl text-slate-800">مؤشر المبيعات (آخر 30 يوم)</h3>
          </div>
          
          <div className="flex-1 w-full min-h-[300px]">
            {data.salesTrend && data.salesTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.salesTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dx={-10} tickFormatter={(val) => `${val / 1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 'bold' }}
                    labelStyle={{ color: '#64748b', marginBottom: '8px' }}
                  />
                  <Area type="monotone" dataKey="sales" name="المبيعات" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <TrendingUp size={48} className="mb-4 opacity-20" />
                <p>لا توجد بيانات مبيعات كافية لعرض المؤشر</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

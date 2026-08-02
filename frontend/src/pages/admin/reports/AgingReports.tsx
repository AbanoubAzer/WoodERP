import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { Clock, Download, TrendingUp, TrendingDown, Users, Building2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export function AgingReports() {
  const token = useAuthStore(state => state.token);
  const [activeTab, setActiveTab] = useState<'ar' | 'ap'>('ar');
  const [arData, setArData] = useState<any>(null);
  const [apData, setApData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [arRes, apRes] = await Promise.all([
        fetch('/api/reports/ar-aging', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/reports/ap-aging', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setArData(await arRes.json());
      setApData(await apRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !arData || !apData) {
    return <div className="p-12 text-center text-slate-500">جاري تحميل التقارير...</div>;
  }

  const currentData = activeTab === 'ar' ? arData : apData;
  const isAr = activeTab === 'ar';
  
  const chartData = [
    { name: '0-30 يوم', amount: currentData.summary['0-30'] },
    { name: '31-60 يوم', amount: currentData.summary['31-60'] },
    { name: '61-90 يوم', amount: currentData.summary['61-90'] },
    { name: 'أكثر من 90 يوم', amount: currentData.summary['90+'] }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className={`p-3 rounded-xl ${isAr ? 'bg-emerald-100' : 'bg-rose-100'}`}>
            <Clock className={isAr ? 'text-emerald-600' : 'text-rose-600'} size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">تقارير أعمار الديون</h1>
            <p className="text-sm text-slate-500">تحليل أعمار المديونيات المستحقة للعملاء والموردين</p>
          </div>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('ar')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all ${isAr ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <TrendingUp size={18} /> ديون العملاء (AR)
          </button>
          <button 
            onClick={() => setActiveTab('ap')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all ${!isAr ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <TrendingDown size={18} /> ديون الموردين (AP)
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm font-semibold mb-1">إجمالي المتأخرات</p>
              <h3 className="text-3xl font-black text-slate-900">{currentData.summary.totalOverdue.toLocaleString()} <span className="text-sm font-normal text-slate-500">ج.م</span></h3>
            </div>
            <div className={`p-3 rounded-xl ${isAr ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {isAr ? <Users size={24} /> : <Building2 size={24} />}
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm font-semibold mb-1">أكثر من 90 يوم (مخاطر عالية)</p>
              <h3 className="text-3xl font-black text-rose-600">{currentData.summary['90+'].toLocaleString()} <span className="text-sm font-normal text-rose-400">ج.م</span></h3>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
              <Clock size={24} />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm flex flex-col justify-center items-center cursor-pointer hover:bg-slate-800 transition-colors">
          <Download size={28} className="mb-2 text-indigo-400" />
          <span className="font-bold">تصدير التقرير PDF</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 mb-6">تحليل أعمار الديون (بالأيام)</h2>
          <div className="h-80 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(val) => `${val / 1000}k`} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="amount" fill={isAr ? '#10b981' : '#f43f5e'} radius={[6, 6, 0, 0]} maxBarSize={60} name="المبلغ المستحق (ج.م)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown Details */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 mb-6">الملخص المالي</h2>
          <div className="space-y-4">
            {[
              { label: 'متأخر 0 - 30 يوم', key: '0-30', color: 'text-orange-500' },
              { label: 'متأخر 31 - 60 يوم', key: '31-60', color: 'text-orange-600' },
              { label: 'متأخر 61 - 90 يوم', key: '61-90', color: 'text-rose-500' },
              { label: 'متأخر أكثر من 90 يوم', key: '90+', color: 'text-rose-700' },
            ].map(item => (
              <div key={item.key} className="flex justify-between items-center p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-50">
                <span className="font-semibold text-slate-700">{item.label}</span>
                <span className={`font-black ${item.color}`}>{currentData.summary[item.key].toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">تفاصيل الديون حسب {isAr ? 'العميل' : 'المورد'}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="py-4 px-6 font-semibold text-slate-600">{isAr ? 'العميل' : 'المورد'}</th>
                <th className="py-4 px-6 font-semibold text-slate-600 text-center">0 - 30</th>
                <th className="py-4 px-6 font-semibold text-slate-600 text-center">31 - 60</th>
                <th className="py-4 px-6 font-semibold text-slate-600 text-center">61 - 90</th>
                <th className="py-4 px-6 font-semibold text-slate-600 text-center">+90</th>
                <th className="py-4 px-6 font-semibold text-slate-600 text-left">إجمالي المتأخرات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(isAr ? currentData.customers : currentData.suppliers).map((person: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6">
                    <p className="font-bold text-slate-900">{person.name}</p>
                    <p className="text-xs text-slate-500">{person.phone || 'لا يوجد رقم'}</p>
                  </td>
                  <td className="py-4 px-6 text-center font-medium text-orange-500">{person['0-30'].toLocaleString()}</td>
                  <td className="py-4 px-6 text-center font-medium text-orange-600">{person['31-60'].toLocaleString()}</td>
                  <td className="py-4 px-6 text-center font-medium text-rose-500">{person['61-90'].toLocaleString()}</td>
                  <td className="py-4 px-6 text-center font-bold text-rose-700">{person['90+'].toLocaleString()}</td>
                  <td className="py-4 px-6 text-left font-black text-slate-900">{person.total.toLocaleString()}</td>
                </tr>
              ))}
              {(isAr ? currentData.customers : currentData.suppliers).length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">لا توجد أي مديونيات متأخرة! 🎉</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

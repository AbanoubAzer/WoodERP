import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { PieChart, Clock, ArrowRight, ArrowLeft } from 'lucide-react';

interface AgingData {
  summary: {
    '0-30': number;
    '31-60': number;
    '61-90': number;
    '90+': number;
    totalOverdue: number;
  };
}

export function DebtAging() {
  const token = useAuthStore(state => state.token);
  const [arData, setArData] = useState<AgingData | null>(null);
  const [apData, setApData] = useState<AgingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgingData();
  }, []);

  const fetchAgingData = async () => {
    try {
      const [arRes, apRes] = await Promise.all([
        fetch('/api/reports/ar-aging', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/reports/ap-aging', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const arJson = await arRes.json();
      const apJson = await apRes.json();
      setArData(arJson);
      setApData(apJson);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex justify-center items-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[var(--color-brand-primary)] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const renderAgingBars = (data: AgingData, isPayable: boolean) => {
    const total = data.summary?.totalOverdue || 1; // Prevent division by zero
    const colors = isPayable ?
      ['bg-rose-400', 'bg-rose-500', 'bg-rose-600', 'bg-rose-700'] :
      ['bg-blue-400', 'bg-blue-500', 'bg-blue-600', 'bg-blue-700'];

    return (
      <div className="space-y-4 mt-6">
        <div className="flex justify-between items-center text-sm">
          <span className="font-bold text-slate-700">0-30 يوم</span>
          <span className="font-bold">{(data.summary?.['0-30'] ?? 0).toLocaleString()} ج.م</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div className={`${colors[0]} h-2 rounded-full`} style={{ width: `${Math.min(((data.summary?.['0-30'] ?? 0) / total) * 100, 100)}%` }}></div>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="font-bold text-slate-700">31-60 يوم</span>
          <span className="font-bold">{(data.summary?.['31-60'] ?? 0).toLocaleString()} ج.م</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div className={`${colors[1]} h-2 rounded-full`} style={{ width: `${Math.min(((data.summary?.['31-60'] ?? 0) / total) * 100, 100)}%` }}></div>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="font-bold text-slate-700">61-90 يوم</span>
          <span className="font-bold">{(data.summary?.['61-90'] ?? 0).toLocaleString()} ج.م</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div className={`${colors[2]} h-2 rounded-full`} style={{ width: `${Math.min(((data.summary?.['61-90'] ?? 0) / total) * 100, 100)}%` }}></div>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="font-bold text-rose-600">أكثر من 90 يوم</span>
          <span className="font-bold">{(data.summary?.['90+'] ?? 0).toLocaleString()} ج.م</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div className={`${colors[3]} h-2 rounded-full`} style={{ width: `${Math.min(((data.summary?.['90+'] ?? 0) / total) * 100, 100)}%` }}></div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded-xl">
            <PieChart className="text-indigo-600" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">أعمار الديون (AR / AP)</h2>
            <p className="text-sm text-slate-500 font-medium">تحليل أعمار المستحقات والالتزامات</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-100">

        {/* AR - Accounts Receivable */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-2 text-blue-600">
            <ArrowLeft size={20} />
            <h3 className="font-black text-lg">مستحقات العملاء (AR)</h3>
          </div>
          <p className="text-sm text-slate-500 mb-4">إجمالي المبالغ المتأخرة على العملاء</p>
          <div className="text-3xl font-black text-slate-900 mb-6" dir="ltr">
            {arData?.summary?.totalOverdue.toLocaleString() || 0} <span className="text-lg text-slate-400">ج.م</span>
          </div>

          {arData && renderAgingBars(arData, false)}
        </div>

        {/* AP - Accounts Payable */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-2 text-rose-600">
            <ArrowRight size={20} />
            <h3 className="font-black text-lg">التزامات الموردين (AP)</h3>
          </div>
          <p className="text-sm text-slate-500 mb-4">إجمالي المبالغ المتأخرة لصالح الموردين</p>
          <div className="text-3xl font-black text-slate-900 mb-6" dir="ltr">
            {apData?.summary?.totalOverdue.toLocaleString() || 0} <span className="text-lg text-slate-400">ج.م</span>
          </div>

          {apData && renderAgingBars(apData, true)}
        </div>

      </div>
    </div>
  );
}

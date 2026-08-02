import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { FileText, Download } from 'lucide-react';

export function SalesReports() {
  const token = useAuthStore(state => state.token);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/reports/sales', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setData(data));
  }, [token]);

  if (!data) return <div className="p-8 text-center animate-pulse text-slate-500">جاري تحميل تقارير المبيعات...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">تقارير المبيعات</h1>
          <p className="text-slate-500 font-medium mt-1">تحليل مفصل للمبيعات والأرباح</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-bold hover:bg-indigo-100 transition-colors">
            <Download size={20} />
            تصدير Excel
          </button>
          <button className="flex items-center gap-2 bg-rose-50 text-rose-700 px-4 py-2 rounded-xl font-bold hover:bg-rose-100 transition-colors">
            <FileText size={20} />
            تصدير PDF
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-xl font-bold mb-4">فواتير المبيعات الأخيرة</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 text-sm">
                <th className="pb-3 font-semibold">رقم الفاتورة</th>
                <th className="pb-3 font-semibold">العميل</th>
                <th className="pb-3 font-semibold">التاريخ</th>
                <th className="pb-3 font-semibold">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {data.data?.map((invoice: any) => (
                <tr key={invoice.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-4 font-bold text-slate-800">{invoice.invoiceNumber}</td>
                  <td className="py-4 text-slate-600">{invoice.customer?.name}</td>
                  <td className="py-4 text-slate-600">{new Date(invoice.issuedAt).toLocaleDateString()}</td>
                  <td className="py-4 font-bold text-emerald-600">{invoice.totalAmount} ج.م</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

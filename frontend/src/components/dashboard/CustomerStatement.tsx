import React from 'react';
import { Activity, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function CustomerStatement({ recentActivity = [] }: { recentActivity?: any[] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Activity className="text-blue-500" size={20} />
            أحدث العمليات
          </h2>
          <p className="text-xs text-slate-500 mt-1">آخر المعاملات المالية للعملاء في النظام</p>
        </div>
        <Link to="/customers" className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors flex items-center gap-1">
          عرض الكل
          <ArrowLeft size={14} />
        </Link>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-sm text-right">
          <thead className="bg-[#111827] text-white">
            <tr>
              <th className="px-6 py-3 font-semibold rounded-tr-lg">التاريخ</th>
              <th className="px-6 py-3 font-semibold">العميل</th>
              <th className="px-6 py-3 font-semibold">البيان</th>
              <th className="px-6 py-3 font-semibold text-red-400">مدين (عليه)</th>
              <th className="px-6 py-3 font-semibold text-emerald-400">دائن (له)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {recentActivity.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-500">لا توجد معاملات حديثة</td>
              </tr>
            ) : (
              recentActivity.map((transaction, index) => (
                <tr key={index} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">
                    {new Date(transaction.date).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800">
                    <Link to={`/customers/${transaction.customerId}/statement`} className="hover:text-blue-600 transition-colors">
                      {transaction.customer?.name || 'غير معروف'}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{transaction.reason || (transaction.type === 'DEBIT' ? 'فاتورة' : 'تحصيل')}</td>
                  <td className="px-6 py-4 text-red-500 font-bold">
                    {transaction.type === 'DEBIT' ? transaction.amount.toLocaleString() + ' ج.م' : '-'}
                  </td>
                  <td className="px-6 py-4 text-emerald-500 font-bold">
                    {transaction.type === 'CREDIT' ? transaction.amount.toLocaleString() + ' ج.م' : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

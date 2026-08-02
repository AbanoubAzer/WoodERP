import React, { useState } from 'react';
import { Activity, ArrowLeft, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export function CustomerStatement({ recentActivity = [] }: { recentActivity?: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const displayActivity = recentActivity.slice(0, 5);

  const TableContent = ({ data }: { data: any[] }) => (
    <div className="flex-1 overflow-x-auto">
      <table className="w-full text-sm text-right">
        <thead className="bg-[#111827] text-white">
          <tr>
            <th className="px-6 py-3 font-semibold rounded-tr-lg">التاريخ</th>
            <th className="px-6 py-3 font-semibold">العميل / المورد</th>
            <th className="px-6 py-3 font-semibold">البيان</th>
            <th className="px-6 py-3 font-semibold text-red-400">مدين (عليه)</th>
            <th className="px-6 py-3 font-semibold text-emerald-400">دائن (له)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-8 text-slate-500">لا توجد معاملات حديثة</td>
            </tr>
          ) : (
            data.map((transaction, index) => (
              <tr key={index} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">
                  {new Date(transaction.date).toLocaleDateString('ar-EG')}
                </td>
                <td className="px-6 py-4 font-bold text-slate-800">
                  {transaction.customer ? (
                    <Link to={`/customers/${transaction.customerId}/statement`} className="hover:text-blue-600 transition-colors">
                      {transaction.customer.name} <span className="text-xs text-blue-500">(عميل)</span>
                    </Link>
                  ) : transaction.supplier ? (
                    <Link to={`/suppliers/${transaction.supplierId}/statement`} className="hover:text-purple-600 transition-colors">
                      {transaction.supplier.name} <span className="text-xs text-purple-500">(مورد)</span>
                    </Link>
                  ) : (
                    'غير معروف'
                  )}
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
  );

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Activity className="text-blue-500" size={20} />
              أحدث العمليات
            </h2>
            <p className="text-xs text-slate-500 mt-1">آخر المعاملات المالية في النظام</p>
          </div>
          <button 
              onClick={() => setIsModalOpen(true)}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
            >
              عرض الكل
              <ArrowLeft size={14} />
            </button>
        </div>

        {/* Table */}
        <TableContent data={displayActivity} />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <Activity size={24} />
                </div>
                <h2 className="text-2xl font-black text-slate-800">سجل أحدث العمليات</h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 bg-slate-200 text-slate-600 hover:bg-slate-300 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              <TableContent data={recentActivity} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import React from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface OverdueAlertsProps {
  installments: any[];
}

export function OverdueAlerts({ installments }: OverdueAlertsProps) {
  if (!installments || installments.length === 0) {
    return null; // Don't show if there are no overdue installments
  }

  return (
    <div className="bg-red-50 border border-red-100 rounded-3xl p-6 shadow-sm mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 text-red-700">
          <AlertCircle size={24} className="animate-pulse" />
          <h2 className="text-lg font-black tracking-tight">تنبيهات أقساط متأخرة!</h2>
        </div>
        <Link to="/installments" className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1 rounded-lg transition-colors flex items-center gap-1">
          عرض الكل
          <ArrowLeft size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {installments.slice(0, 3).map((inst, index) => (
          <div key={index} className="bg-white rounded-2xl p-4 border border-red-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold px-2 py-1 bg-red-100 text-red-700 rounded-lg">
                  قسط متأخر
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {new Date(inst.dueDate).toLocaleDateString('ar-EG')}
                </span>
              </div>
              <p className="font-bold text-slate-900 mb-1 line-clamp-1">
                {inst.plan.customer?.name || inst.plan.supplier?.name || 'غير معروف'}
              </p>
              <p className="text-xl font-black text-red-600 mb-3" dir="ltr">
                {inst.amount.toLocaleString()} ج.م
              </p>
            </div>
            <Link to={`/installments/${inst.planId}`} className="text-sm font-bold text-red-600 hover:text-red-700 flex items-center justify-between group">
              عرض التفاصيل
              <ArrowLeft size={16} className="transform transition-transform group-hover:-translate-x-1" />
            </Link>
          </div>
        ))}
      </div>
      {installments.length > 3 && (
        <div className="mt-4 text-center">
          <Link to="/installments" className="text-red-600 hover:text-red-700 font-bold text-sm">
            عرض كل الأقساط المتأخرة ({installments.length})
          </Link>
        </div>
      )}
    </div>
  );
}

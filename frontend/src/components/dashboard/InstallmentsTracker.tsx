import React from 'react';
import { CreditCard, AlertTriangle, TrendingDown, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function InstallmentsTracker({ 
  upcomingInstallments = [],
  supplierInstallments = []
}: { 
  upcomingInstallments?: any[],
  supplierInstallments?: any[]
}) {

  const displayInstallments = upcomingInstallments.length > 0 ? upcomingInstallments : [];
  const displaySupplierDebts = supplierInstallments.length > 0 ? supplierInstallments : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* Customer Installments (Middle/1 Col) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <CreditCard className="text-emerald-500" size={18} />
            أقساط التحصيل (لصالحنا)
          </h3>
          <Link to="/installments?tab=CUSTOMERS" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-lg transition-colors flex items-center gap-1">
            عرض الكل
            <ArrowLeft size={14} />
          </Link>
        </div>
        <div className="p-4 flex-1 space-y-3 overflow-y-auto max-h-[300px]">
          {displayInstallments.length === 0 ? (
             <div className="text-center text-slate-500 py-6 text-sm">لا توجد أقساط مستحقة قريباً</div>
          ) : (
            displayInstallments.map((inst, idx) => {
              const isOverdue = new Date(inst.dueDate) < new Date();
              return (
                <Link 
                  key={idx} 
                  to={`/installments/${inst.planId}`} 
                  className={`border rounded-lg p-3 flex justify-between items-center transition-colors cursor-pointer group ${isOverdue ? 'bg-rose-50 border-rose-100 hover:bg-rose-100' : 'bg-slate-50 border-slate-100 hover:bg-emerald-50'}`}
                >
                  <div>
                    <p className={`font-bold text-sm group-hover:text-[var(--color-brand-primary)] ${isOverdue ? 'text-rose-700' : 'text-slate-700'}`}>
                      {inst.plan?.customer?.name || 'بدون اسم'}
                    </p>
                    <p className={`text-xs mt-1 flex gap-2 items-center ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                      <span className={`inline-block w-2 h-2 rounded-full ${isOverdue ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                      {isOverdue ? 'متأخر منذ:' : 'استحقاق:'} {new Date(inst.dueDate).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                  <span className={`font-black text-sm ${isOverdue ? 'text-rose-700' : 'text-slate-800'}`}>{inst.amount.toLocaleString()} ج.م</span>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* Supplier Debts (Right/1 Col) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <TrendingDown className="text-rose-500" size={18} />
            الديون المستحقة الدفع (علينا)
          </h3>
          <Link to="/installments?tab=SUPPLIERS" className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1 rounded-lg transition-colors flex items-center gap-1">
            عرض الكل
            <ArrowLeft size={14} />
          </Link>
        </div>
        <div className="p-4 flex-1 space-y-3 overflow-y-auto max-h-[300px]">
          {displaySupplierDebts.length === 0 ? (
             <div className="text-center text-slate-500 py-6 text-sm">لا توجد أقساط موردين مستحقة قريباً</div>
          ) : (
            displaySupplierDebts.map((debt, idx) => {
              const isOverdue = new Date(debt.dueDate) < new Date();
              return (
                <Link 
                  key={idx} 
                  to={`/installments/${debt.planId}`} 
                  className={`border rounded-lg p-3 flex justify-between items-center transition-colors cursor-pointer group ${isOverdue ? 'bg-rose-50 border-rose-100 hover:bg-rose-100' : 'bg-slate-50 border-slate-100 hover:bg-rose-50'}`}
                >
                  <div>
                    <p className={`font-bold text-sm group-hover:text-rose-600 ${isOverdue ? 'text-rose-700' : 'text-slate-700'}`}>
                      {debt.plan?.supplier?.name || 'بدون اسم'}
                    </p>
                    <p className={`text-xs mt-1 flex gap-2 items-center ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                      <span className={`inline-block w-2 h-2 rounded-full ${isOverdue ? 'bg-rose-500 animate-pulse' : 'bg-orange-500'}`}></span>
                      {isOverdue ? 'متأخر منذ:' : 'استحقاق:'} {new Date(debt.dueDate).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                  <span className={`font-black text-sm ${isOverdue ? 'text-rose-700' : 'text-slate-800'}`}>{debt.amount.toLocaleString()} ج.م</span>
                </Link>
              );
            })
          )}
        </div>
      </div>
      
    </div>
  );
}

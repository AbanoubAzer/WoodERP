import React, { useState } from 'react';
import { CreditCard, AlertTriangle, TrendingDown, ArrowLeft, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export function InstallmentsTracker({ 
  upcomingInstallments = [],
  supplierInstallments = []
}: { 
  upcomingInstallments?: any[],
  supplierInstallments?: any[]
}) {
  const [activeModal, setActiveModal] = useState<'NONE' | 'CUSTOMERS' | 'SUPPLIERS'>('NONE');

  const displayInstallments = upcomingInstallments.slice(0, 5);
  const displaySupplierDebts = supplierInstallments.slice(0, 5);

  const ListContent = ({ data, type }: { data: any[], type: 'CUSTOMER' | 'SUPPLIER' }) => (
    <div className="p-4 flex-1 space-y-3 overflow-y-auto">
      {data.length === 0 ? (
         <div className="text-center text-slate-500 py-6 text-sm">لا توجد أقساط مستحقة قريباً</div>
      ) : (
        data.map((item, idx) => {
          const isOverdue = item.dueDate && new Date(item.dueDate) < new Date();
          return (
            <Link 
              key={idx} 
              to={`/installments/${item.planId}`} 
              className={`border rounded-lg p-3 flex justify-between items-center transition-colors cursor-pointer group ${isOverdue ? 'bg-rose-50 border-rose-100 hover:bg-rose-100' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
            >
              <div>
                <p className={`font-bold text-sm ${type === 'CUSTOMER' ? 'group-hover:text-emerald-600' : 'group-hover:text-rose-600'} ${isOverdue ? 'text-rose-700' : 'text-slate-700'}`}>
                  {type === 'CUSTOMER' ? (item.plan?.customer?.name || 'بدون اسم') : (item.plan?.supplier?.name || 'بدون اسم')}
                </p>
                <p className={`text-xs mt-1 flex gap-2 items-center ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                  <span className={`inline-block w-2 h-2 rounded-full ${isOverdue ? 'bg-rose-500 animate-pulse' : (type === 'CUSTOMER' ? 'bg-emerald-500' : 'bg-orange-500')}`}></span>
                  {item.dueDate ? `${isOverdue ? 'متأخر منذ:' : 'استحقاق:'} ${new Date(item.dueDate).toLocaleDateString('ar-EG')}` : 'دفعة بدون تاريخ'}
                </p>
              </div>
              <span className={`font-black text-sm ${isOverdue ? 'text-rose-700' : 'text-slate-800'}`}>{item.amount.toLocaleString()} ج.م</span>
            </Link>
          );
        })
      )}
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Customer Installments */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <CreditCard className="text-emerald-500" size={18} />
              أقساط التحصيل (لصالحنا)
            </h3>
            <button 
                onClick={() => setActiveModal('CUSTOMERS')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
              >
                عرض الكل
                <ArrowLeft size={14} />
              </button>
          </div>
          <div className="max-h-[300px] overflow-hidden flex flex-col">
            <ListContent data={displayInstallments} type="CUSTOMER" />
          </div>
        </div>

        {/* Supplier Debts */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <TrendingDown className="text-rose-500" size={18} />
              الديون المستحقة الدفع (علينا)
            </h3>
            <button 
                onClick={() => setActiveModal('SUPPLIERS')}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
              >
                عرض الكل
                <ArrowLeft size={14} />
              </button>
          </div>
          <div className="max-h-[300px] overflow-hidden flex flex-col">
            <ListContent data={displaySupplierDebts} type="SUPPLIER" />
          </div>
        </div>
        
      </div>

      {activeModal !== 'NONE' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className={`p-6 border-b flex items-center justify-between ${activeModal === 'CUSTOMERS' ? 'border-emerald-100 bg-emerald-50' : 'border-rose-100 bg-rose-50'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${activeModal === 'CUSTOMERS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {activeModal === 'CUSTOMERS' ? <CreditCard size={24} /> : <TrendingDown size={24} />}
                </div>
                <h2 className="text-2xl font-black text-slate-800">
                  {activeModal === 'CUSTOMERS' ? 'كل أقساط التحصيل' : 'كل الديون المستحقة'}
                </h2>
              </div>
              <button 
                onClick={() => setActiveModal('NONE')}
                className={`p-2 rounded-full transition-colors ${activeModal === 'CUSTOMERS' ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-rose-100 text-rose-600 hover:bg-rose-200'}`}
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <ListContent 
                data={activeModal === 'CUSTOMERS' ? upcomingInstallments : supplierInstallments} 
                type={activeModal === 'CUSTOMERS' ? 'CUSTOMER' : 'SUPPLIER'} 
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

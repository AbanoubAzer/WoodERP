import React from 'react';
import { Plus, Receipt, ShoppingBag, Banknote, UserPlus, ArrowRightLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function QuickActions() {
  const actions = [
    { name: 'فاتورة مبيعات', icon: Receipt, link: '/sales/invoices/new', color: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:border-indigo-200 border border-transparent' },
    { name: 'فاتورة مشتريات', icon: ShoppingBag, link: '/purchases/invoices/new', color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-200 border border-transparent' },
    { name: 'تحويل داخلي', icon: ArrowRightLeft, link: '/inventory/transfer', color: 'bg-purple-50 text-purple-600 hover:bg-purple-100 hover:border-purple-200 border border-transparent' },
    { name: 'سند قبض / دفع', icon: Banknote, link: '/treasury/transfer', color: 'bg-amber-50 text-amber-600 hover:bg-amber-100 hover:border-amber-200 border border-transparent' },
    { name: 'عميل جديد', icon: UserPlus, link: '/customers/new', color: 'bg-sky-50 text-sky-600 hover:bg-sky-100 hover:border-sky-200 border border-transparent' },
  ];

  return (
    <div className="mb-8">
      <h3 className="text-sm font-bold text-slate-500 mb-3 px-1">إجراءات سريعة</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <Link key={i} to={action.link} className={`flex items-center gap-3 p-4 rounded-2xl transition-all duration-200 ${action.color} shadow-sm hover:shadow-md`}>
              <div className="bg-white/60 p-2 rounded-xl">
                <Icon size={20} />
              </div>
              <span className="font-bold text-sm">{action.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

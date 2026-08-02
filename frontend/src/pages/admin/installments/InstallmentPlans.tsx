import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { CalendarClock, Plus, Search, Eye } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import { Pagination } from '../../../components/ui/Pagination';

export function InstallmentPlans() {
  const token = useAuthStore(state => state.token);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'ALL' | 'CUSTOMERS' | 'SUPPLIERS') || 'ALL';
  const [activeTab, setActiveTab] = useState<'ALL' | 'CUSTOMERS' | 'SUPPLIERS'>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/installments/plans', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setPlans(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlans = plans
    .filter(p => activeTab === 'ALL' ? true : activeTab === 'CUSTOMERS' ? p.customerId : p.supplierId)
    .filter(p => 
      (p.customer?.name?.toLowerCase()?.includes(searchTerm.toLowerCase())) ||
      (p.supplier?.name?.toLowerCase()?.includes(searchTerm.toLowerCase()))
    );

  const totalPages = Math.ceil(filteredPlans.length / itemsPerPage);
  const paginatedPlans = filteredPlans.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="bg-orange-100 p-3 rounded-xl">
            <CalendarClock className="text-orange-600" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">خطط التقسيط والمديونيات</h1>
            <p className="text-sm text-slate-500">إدارة جداول السداد ومتابعة تحصيل الأقساط</p>
          </div>
        </div>
        <Link 
          to="/installments/new"
          className="flex items-center space-x-2 space-x-reverse bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          <Plus size={20} />
          <span>إنشاء خطة تقسيط</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button 
              onClick={() => { setActiveTab('ALL'); setCurrentPage(1); }}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              عرض الكل
            </button>
            <button 
              onClick={() => { setActiveTab('CUSTOMERS'); setCurrentPage(1); }}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'CUSTOMERS' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              أقساط العملاء (تحصيل)
            </button>
            <button 
              onClick={() => { setActiveTab('SUPPLIERS'); setCurrentPage(1); }}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'SUPPLIERS' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              أقساط الموردين (دفع)
            </button>
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="بحث بالاسم..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-4 pr-10 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500/20 text-sm"
            />
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : (
        <>
        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="py-4 px-6 font-semibold text-slate-600">العميل / المورد</th>
              <th className="py-4 px-6 font-semibold text-slate-600">إجمالي المديونية</th>
              <th className="py-4 px-6 font-semibold text-slate-600">المدة</th>
              <th className="py-4 px-6 font-semibold text-slate-600">تاريخ البدء</th>
              <th className="py-4 px-6 font-semibold text-slate-600">الحالة</th>
              <th className="py-4 px-6 font-semibold text-slate-600 text-center">التفاصيل</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedPlans.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-500">لا توجد خطط تقسيط مسجلة</td></tr>
            ) : (
              paginatedPlans.map(plan => (
                <tr key={plan.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6">
                    <p className="font-bold text-slate-900">{plan.customer?.name || plan.supplier?.name}</p>
                    <p className="text-xs text-slate-500">{plan.customer?.phone || plan.supplier?.phone || 'لا يوجد رقم'}</p>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-bold text-slate-900">
                      {plan.totalAmount.toLocaleString()} ج.م
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-600">{plan.numberOfMonths} شهور</td>
                  <td className="py-4 px-6 text-slate-600 text-sm">
                    {new Date(plan.startDate).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      plan.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {plan.status === 'COMPLETED' ? 'مكتمل' : 'نشط'}
                    </span>
                  </td>
                  <td className="py-4 px-6 flex justify-center">
                    <Link 
                      to={`/installments/${plan.id}`}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center space-x-1 space-x-reverse"
                    >
                      <Eye size={18} />
                      <span className="text-sm font-bold">الجدول والتسديد</span>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredPlans.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
        </>
        )}
      </div>
    </div>
  );
}


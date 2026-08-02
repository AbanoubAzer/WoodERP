import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { Users, Search, Plus, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import { Pagination } from '../../../components/ui/Pagination';

export function Customers() {
  const token = useAuthStore(state => state.token);
  const [customers, setCustomers] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, searchTerm, warehouseId]);

  const fetchWarehouses = async () => {
    try {
      const res = await fetch('/api/warehouses', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setWarehouses(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm ? { search: searchTerm } : {}),
        ...(warehouseId ? { warehouseId } : {})
      });
      const res = await fetch(`/api/customers?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const resData = await res.json();
      if (Array.isArray(resData)) {
        setCustomers(resData);
        setTotalItems(resData.length);
        setTotalPages(Math.ceil(resData.length / itemsPerPage));
      } else {
        setCustomers(resData.data || []);
        setTotalItems(resData.total || 0);
        setTotalPages(resData.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="bg-[var(--color-brand-primary)]/10 p-3 rounded-xl">
            <Users className="text-[var(--color-brand-primary)]" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">العملاء</h1>
            <p className="text-sm text-slate-500">إدارة حسابات العملاء، الأرصدة، والحد الائتماني</p>
          </div>
        </div>
        <Link 
          to="/customers/new"
          className="flex items-center space-x-2 space-x-reverse bg-[var(--color-brand-sidebar)] hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          <Plus size={20} />
          <span>عميل جديد</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden p-6">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="بحث عن عميل (الاسم، الكود، الجوال)..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-4 pr-10 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-[var(--color-brand-primary)]/20"
            />
          </div>
          <select
            value={warehouseId}
            onChange={(e) => { setWarehouseId(e.target.value); setCurrentPage(1); }}
            className="w-64 bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-brand-primary)]/20"
          >
            <option value="">كل المخازن</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : (
        <>
        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="py-4 px-6 font-semibold text-slate-600">كود العميل</th>
              <th className="py-4 px-6 font-semibold text-slate-600">اسم العميل / الشركة</th>
              <th className="py-4 px-6 font-semibold text-slate-600">رقم الجوال</th>
              <th className="py-4 px-6 font-semibold text-slate-600">الرصيد الحالي</th>
              <th className="py-4 px-6 font-semibold text-slate-600">الحد الائتماني</th>
              <th className="py-4 px-6 font-semibold text-slate-600 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-500">لا يوجد عملاء مسجلين</td></tr>
            ) : (
              customers.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 font-mono text-sm text-slate-500">{c.code}</td>
                  <td className="py-4 px-6">
                    <p className="font-bold text-slate-900">{c.name}</p>
                    {c.companyName && <p className="text-xs text-slate-500">{c.companyName}</p>}
                  </td>
                  <td className="py-4 px-6 text-slate-600" dir="ltr">{c.phone || '-'}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full font-bold ${c.balance > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'}`}>
                      {c.balance.toLocaleString()} ج.م
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-600">
                    {c.creditLimit > 0 ? `${c.creditLimit.toLocaleString()} ج.م` : 'بدون حد'}
                  </td>
                  <td className="py-4 px-6 flex justify-center">
                    <Link 
                      to={`/customers/${c.id}/statement`}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center space-x-1 space-x-reverse"
                    >
                      <FileText size={18} />
                      <span className="text-sm font-bold">كشف الحساب</span>
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
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
        </>
        )}
      </div>
    </div>
  );
}


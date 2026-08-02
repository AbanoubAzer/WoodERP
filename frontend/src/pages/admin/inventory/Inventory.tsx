import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { Package, Search, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import { Pagination } from '../../../components/ui/Pagination';
import { toast } from '../../../store/toastStore';

export function Inventory() {
  const token = useAuthStore(state => state.token);
  const [stock, setStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    try {
      const res = await fetch('/api/inventory/balance', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setStock(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (stock.length === 0) {
      toast.warning('لا توجد بيانات للتصدير');
      return;
    }
    const headers = ['المنتج', 'السُمك', 'العرض', 'الطول', 'المخزن', 'الرصيد الفعلي', 'المحجوز'];
    const rows = stock.map(item => [
      item.variant?.product?.name || '',
      item.variant?.thickness || '',
      item.variant?.width || '',
      item.variant?.length || '',
      item.warehouse?.name || '',
      item.physicalQty,
      item.reservedQty
    ]);

    const csvContent = '\uFEFF' + [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('تم تصدير البيانات بنجاح');
  };

  const filteredStock = stock.filter(item => 
    (item.variant?.product?.name?.toLowerCase()?.includes(searchTerm.toLowerCase())) ||
    (item.warehouse?.name?.toLowerCase()?.includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredStock.length / itemsPerPage);
  const paginatedStock = filteredStock.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="bg-[var(--color-brand-primary)]/10 p-3 rounded-xl">
            <Package className="text-[var(--color-brand-primary)]" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">أرصدة المخزون</h1>
            <p className="text-sm text-slate-500">مراقبة الرصيد الفعلي للأخشاب في جميع المستودعات</p>
          </div>
        </div>
        <div className="flex space-x-3 space-x-reverse">
          <button onClick={exportToCSV} className="flex items-center space-x-2 space-x-reverse bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-semibold hover:bg-slate-50 transition-colors">
            <Download size={20} />
            <span>تصدير Excel</span>
          </button>
          <Link to="/inventory/transfer" className="flex items-center space-x-2 space-x-reverse bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
            <span>تحويل مخزني</span>
          </Link>
          <Link to="/inventory/receive" className="flex items-center space-x-2 space-x-reverse bg-[var(--color-brand-sidebar)] hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
            <span>استلام بضاعة</span>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden p-6">
        <div className="relative mb-6">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="بحث في المخزون (صنف، مقاس، مخزن)..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-4 pr-10 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-[var(--color-brand-primary)]/20"
          />
        </div>

        {loading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : (
        <>
        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="py-4 px-6 font-semibold text-slate-600">المنتج الأساسي</th>
              <th className="py-4 px-6 font-semibold text-slate-600">الأبعاد (سُمك × عرض × طول)</th>
              <th className="py-4 px-6 font-semibold text-slate-600">المخزن / المنطقة</th>
              <th className="py-4 px-6 font-semibold text-slate-600">الرصيد الفعلي</th>
              <th className="py-4 px-6 font-semibold text-slate-600">الرصيد المحجوز</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedStock.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center">
                  <Package size={48} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500 text-lg font-semibold">المخازن فارغة حالياً</p>
                  <p className="text-slate-400 text-sm mt-1">قم بتسجيل إذن استلام لإضافة بضاعة للمخزن</p>
                </td>
              </tr>
            ) : (
              paginatedStock.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-900">{item.variant?.product?.name}</td>
                  <td className="py-4 px-6 text-slate-700 font-mono" dir="ltr">
                    {item.variant?.thickness} × {item.variant?.width} × {item.variant?.length}
                  </td>
                  <td className="py-4 px-6 text-slate-600">
                    {item.warehouse?.name} 
                    {item.location && <span className="text-slate-400 text-sm"> / {item.location.zone}</span>}
                  </td>
                  <td className="py-4 px-6">
                    <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold">
                      {item.physicalQty}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-bold">
                      {item.reservedQty}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredStock.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
        </>
        )}
      </div>
    </div>
  );
}


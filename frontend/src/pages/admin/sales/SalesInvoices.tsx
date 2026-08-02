import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { Receipt, Plus, Search, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import { Pagination } from '../../../components/ui/Pagination';

export function SalesInvoices() {
  const token = useAuthStore(state => state.token);
  const activeLocation = useAuthStore(state => state.activeLocation);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchInvoices();
  }, [activeLocation]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      let url = '/api/sales/invoices';
      if (activeLocation && activeLocation.id !== 'ALL') {
        url += `?locationId=${activeLocation.id}&locationType=${activeLocation.type === 'فرع' ? 'BRANCH' : 'WAREHOUSE'}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      setInvoices(json.data || json); // Handle paginated or unpaginated response
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    (inv.invoiceNumber?.toLowerCase()?.includes(searchTerm.toLowerCase())) ||
    (inv.customer?.name?.toLowerCase()?.includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="bg-emerald-100 p-3 rounded-xl">
            <Receipt className="text-emerald-600" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">فواتير المبيعات</h1>
            <p className="text-sm text-slate-500">إدارة ومتابعة فواتير البيع للعملاء</p>
          </div>
        </div>
        <Link 
          to="/sales/invoices/new"
          className="flex items-center space-x-2 space-x-reverse bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          <Plus size={20} />
          <span>فاتورة جديدة</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden p-6">
        <div className="relative mb-6">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="بحث برقم الفاتورة أو اسم العميل..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-4 pr-10 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : (
        <>
        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="py-4 px-6 font-semibold text-slate-600">رقم الفاتورة</th>
              <th className="py-4 px-6 font-semibold text-slate-600">التاريخ</th>
              <th className="py-4 px-6 font-semibold text-slate-600">العميل</th>
              <th className="py-4 px-6 font-semibold text-slate-600">القيمة الإجمالية</th>
              <th className="py-4 px-6 font-semibold text-slate-600">بواسطة</th>
              <th className="py-4 px-6 font-semibold text-slate-600">الحالة</th>
              <th className="py-4 px-6 font-semibold text-slate-600 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedInvoices.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-500">لا توجد فواتير مبيعات</td></tr>
            ) : (
              paginatedInvoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 font-mono text-sm font-bold text-slate-700">{inv.invoiceNumber}</td>
                  <td className="py-4 px-6 text-slate-600 text-sm">
                    {new Date(inv.issuedAt).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-bold text-slate-900">{inv.customer?.name}</p>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-bold text-emerald-600">
                      {inv.totalAmount.toLocaleString()} ج.م
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-600 font-medium">
                    {inv.createdBy?.name || 'غير محدد'}
                  </td>
                  <td className="py-4 px-6">
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">
                      {inv.status === 'COMPLETED' ? 'مكتملة' : inv.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 flex justify-center">
                    <Link 
                      to={`/sales/invoices/${inv.id}`}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center space-x-1 space-x-reverse"
                    >
                      <FileText size={18} />
                      <span className="text-sm font-bold">عرض الفاتورة</span>
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
          totalItems={filteredInvoices.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
        </>
        )}
      </div>
    </div>
  );
}


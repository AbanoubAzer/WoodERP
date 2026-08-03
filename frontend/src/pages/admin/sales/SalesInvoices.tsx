import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { Receipt, Plus, Search, FileText, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import { Pagination } from '../../../components/ui/Pagination';
import { PageLoader } from '../../../components/ui/Spinner';
import { downloadCSV } from '../../../utils/exportUtils';

export function SalesInvoices() {
  const token = useAuthStore(state => state.token);
  const activeLocation = useAuthStore(state => state.activeLocation);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchInvoices = useCallback(async () => {
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
      setInvoices(Array.isArray(json) ? json : Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      console.error(err);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [token, activeLocation]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const filteredInvoices = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return invoices.filter(inv => {
      const matchSearch = !term || (
        (inv.invoiceNumber?.toLowerCase()?.includes(term)) ||
        (inv.customer?.name?.toLowerCase()?.includes(term))
      );
      
      const pName = inv.paymentMethod?.name || (inv.amountPaid >= inv.totalAmount ? 'نقدي' : inv.amountPaid > 0 ? 'دفع جزئي' : 'آجل / تقسيط');
      const matchPayment = selectedPaymentFilter === 'ALL' || pName.includes(selectedPaymentFilter);

      return matchSearch && matchPayment;
    });
  }, [invoices, searchTerm, selectedPaymentFilter]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredInvoices.length / itemsPerPage)), [filteredInvoices.length, itemsPerPage]);

  const paginatedInvoices = useMemo(() => {
    return filteredInvoices.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredInvoices, currentPage, itemsPerPage]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }, []);

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
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="بحث برقم الفاتورة أو اسم العميل..." 
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-4 pr-10 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
            />
          </div>

          <div className="w-full md:w-64">
            <select
              value={selectedPaymentFilter}
              onChange={(e) => { setSelectedPaymentFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-700 font-semibold focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL">جميع طرق السداد</option>
              <option value="نقدي">نقدي</option>
              <option value="InstaPay">InstaPay</option>
              <option value="تحويل">تحويل بنكي</option>
              <option value="آجل">آجل / تقسيط</option>
            </select>
          </div>

          <button
            onClick={() => {
              const rows: (string | number)[][] = [
                ['رقم الفاتورة', 'التاريخ', 'العميل', 'طريقة السداد', 'القيمة الإجمالية', 'المسدد', 'الباقي', 'الحالة']
              ];
              filteredInvoices.forEach(inv => {
                const pName = inv.paymentMethod?.name || (inv.amountPaid >= inv.totalAmount ? 'نقدي' : inv.amountPaid > 0 ? 'دفع جزئي' : 'آجل / تقسيط');
                rows.push([
                  inv.invoiceNumber,
                  new Date(inv.issuedAt).toLocaleDateString('ar-EG'),
                  inv.customer?.name || '-',
                  pName,
                  inv.totalAmount,
                  inv.amountPaid,
                  inv.totalAmount - inv.amountPaid,
                  inv.status === 'COMPLETED' ? 'مكتملة' : inv.status === 'PENDING' ? 'قيد الانتظار' : 'ملغاة'
                ]);
              });
              downloadCSV('فواتير_المبيعات', rows);
            }}
            className="flex items-center justify-center space-x-2 space-x-reverse bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 rounded-xl font-bold transition-colors whitespace-nowrap"
          >
            <Download size={18} />
            <span>تصدير Excel</span>
          </button>
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
              <th className="py-4 px-6 font-semibold text-slate-600">طريقة السداد</th>
              <th className="py-4 px-6 font-semibold text-slate-600">القيمة الإجمالية</th>
              <th className="py-4 px-6 font-semibold text-slate-600">بواسطة</th>
              <th className="py-4 px-6 font-semibold text-slate-600">الحالة</th>
              <th className="py-4 px-6 font-semibold text-slate-600 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedInvoices.length === 0 ? (
              <tr><td colSpan={8} className="py-8 text-center text-slate-500">لا توجد فواتير مبيعات</td></tr>
            ) : (
              paginatedInvoices.map((inv: any) => (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 font-mono text-sm font-bold text-slate-700">{inv.invoiceNumber}</td>
                  <td className="py-4 px-6 text-slate-600 text-sm">
                    {new Date(inv.issuedAt).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-bold text-slate-900">{inv.customer?.name}</p>
                  </td>
                  <td className="py-4 px-6 text-sm font-semibold text-indigo-700">
                    {inv.paymentMethod?.name || (inv.amountPaid >= inv.totalAmount ? 'نقدي' : inv.amountPaid > 0 ? 'دفع جزئي' : 'آجل / تقسيط')}
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
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      inv.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                      inv.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                      inv.status === 'CANCELLED' ? 'bg-rose-100 text-rose-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {inv.status === 'COMPLETED' ? 'مكتملة' : inv.status === 'PENDING' ? 'قيد الانتظار' : inv.status === 'CANCELLED' ? 'ملغاة' : inv.status}
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


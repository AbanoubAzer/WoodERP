import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { FileText, Calendar, Filter, TrendingUp, DollarSign, Receipt, Clock, Download } from 'lucide-react';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import { toast } from '../../../store/toastStore';

interface SalesKPIs {
  totalSales: number;
  totalInvoices: number;
  totalCollected: number;
  totalOutstanding: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  issuedAt: string;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  status: string;
}

interface TopProduct {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
}

export function SalesDateRangeReport() {
  const token = useAuthStore((state) => state.token);
  
  const [loading, setLoading] = useState(false);
  const [kpis, setKpis] = useState<SalesKPIs>({ totalSales: 0, totalInvoices: 0, totalCollected: 0, totalOutstanding: 0 });
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState<'INVOICES' | 'PRODUCTS'>('INVOICES');
  const [productSortBy, setProductSortBy] = useState<'REVENUE' | 'QUANTITY'>('REVENUE');

  useEffect(() => {
    // Set default dates to current month on initial load
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    setStartDate(formatDate(firstDay));
    setEndDate(formatDate(lastDay));
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchReportData();
    }
  }, [startDate, endDate]);

  const formatDate = (d: Date) => {
    return d.toISOString().split('T')[0];
  };

  const setQuickFilter = (type: 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'THIS_YEAR') => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (type) {
      case 'TODAY':
        break;
      case 'THIS_WEEK':
        const day = today.getDay(); // 0 is Sunday
        const diff = today.getDate() - day; // adjust to Sunday
        start = new Date(today.setDate(diff));
        break;
      case 'THIS_MONTH':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'THIS_YEAR':
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
        break;
    }

    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reports/sales?startDate=${startDate}&endDate=${endDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('فشل جلب بيانات التقرير');
      const data = await res.json();
      setKpis(data.kpis);
      setInvoices(data.invoices);
      setTopProducts(data.topProducts);
    } catch (err: any) {
      toast.error('خطأ', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Sort top products based on selected mode
  const sortedProducts = [...topProducts].sort((a, b) => {
    if (productSortBy === 'REVENUE') return b.revenue - a.revenue;
    return b.quantity - a.quantity;
  });

  return (
    <div className="space-y-6 print:space-y-4 print:bg-white print:text-black">
      {/* Print Only Header */}
      <div className="hidden print:flex flex-col items-center justify-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-3xl font-black text-black">تقرير المبيعات المتقدم</h1>
        <p className="text-lg text-gray-700 mt-2">WoodERP Management System</p>
        <div className="flex justify-between w-full mt-4 text-sm font-bold text-gray-600">
          <span>تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</span>
          <span>الفترة: من {startDate} إلى {endDate}</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4 print:hidden">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="bg-indigo-100 p-3 rounded-xl">
            <TrendingUp className="text-indigo-700" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">تقرير المبيعات المتقدم</h1>
            <p className="text-sm text-slate-500">تحليل المبيعات، الأرباح، حركة الأصناف حسب الفترة الزمنية</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={handlePrint} className="flex items-center space-x-2 space-x-reverse bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-semibold hover:bg-slate-50 transition-colors">
            <FileText size={20} />
            <span>طباعة التقرير</span>
          </button>
        </div>
      </div>

      {/* Date Filters Control Panel */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 print:hidden">
        <div className="flex items-center gap-2 mb-4 text-slate-700 font-bold">
          <Filter size={20} />
          <h2>تصفية الفترة الزمنية</h2>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex gap-2 w-full md:w-auto">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1">من تاريخ</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1">إلى تاريخ</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 text-sm"
              />
            </div>
          </div>
          
          <div className="hidden md:block w-px h-10 bg-slate-200"></div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button onClick={() => setQuickFilter('TODAY')} className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-100 transition-colors">اليوم</button>
            <button onClick={() => setQuickFilter('THIS_WEEK')} className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-100 transition-colors">هذا الأسبوع</button>
            <button onClick={() => setQuickFilter('THIS_MONTH')} className="px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors">هذا الشهر</button>
            <button onClick={() => setQuickFilter('THIS_YEAR')} className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-100 transition-colors">هذه السنة</button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:grid-cols-4 print:gap-4 print:border-b-2 print:border-black print:pb-6 print:mb-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 relative overflow-hidden print:border-gray-400 print:shadow-none">
          <div className="absolute left-0 top-0 w-1 h-full bg-indigo-500 rounded-l-2xl print:hidden"></div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-500 font-semibold text-sm print:text-black">إجمالي المبيعات</span>
            <DollarSign size={20} className="text-indigo-400 print:hidden" />
          </div>
          <p className="text-2xl font-black text-slate-900 print:text-black">{kpis.totalSales.toLocaleString()} <span className="text-sm font-normal text-slate-500 print:text-black">ج.م</span></p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 relative overflow-hidden print:border-gray-400 print:shadow-none">
          <div className="absolute left-0 top-0 w-1 h-full bg-emerald-500 rounded-l-2xl print:hidden"></div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-500 font-semibold text-sm print:text-black">التحصيلات (الكاش)</span>
            <Receipt size={20} className="text-emerald-400 print:hidden" />
          </div>
          <p className="text-2xl font-black text-emerald-700 print:text-black">{kpis.totalCollected.toLocaleString()} <span className="text-sm font-normal text-emerald-600 print:text-black">ج.م</span></p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100 relative overflow-hidden print:border-gray-400 print:shadow-none">
          <div className="absolute left-0 top-0 w-1 h-full bg-rose-500 rounded-l-2xl print:hidden"></div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-500 font-semibold text-sm print:text-black">المتبقي (الآجل)</span>
            <Clock size={20} className="text-rose-400 print:hidden" />
          </div>
          <p className="text-2xl font-black text-rose-700 print:text-black">{kpis.totalOutstanding.toLocaleString()} <span className="text-sm font-normal text-rose-600 print:text-black">ج.م</span></p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-sky-100 relative overflow-hidden print:border-gray-400 print:shadow-none">
          <div className="absolute left-0 top-0 w-1 h-full bg-sky-500 rounded-l-2xl print:hidden"></div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-500 font-semibold text-sm print:text-black">إجمالي الفواتير</span>
            <FileText size={20} className="text-sky-400 print:hidden" />
          </div>
          <p className="text-2xl font-black text-sky-700 print:text-black">{kpis.totalInvoices.toLocaleString()} <span className="text-sm font-normal text-sky-600 print:text-black">فاتورة</span></p>
        </div>
      </div>

      {/* Tabs and Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print:shadow-none print:border-0 print:border-t-2 print:border-black print:rounded-none">
        
        <div className="flex border-b border-slate-200 print:hidden">
          <button 
            onClick={() => setActiveTab('INVOICES')}
            className={`flex-1 py-4 text-center font-bold text-sm transition-colors ${activeTab === 'INVOICES' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            سجل الفواتير
          </button>
          <button 
            onClick={() => setActiveTab('PRODUCTS')}
            className={`flex-1 py-4 text-center font-bold text-sm transition-colors ${activeTab === 'PRODUCTS' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            الأصناف الأكثر مبيعاً
          </button>
        </div>

        <div className="p-0">
          {loading ? (
            <div className="p-6">
              <TableSkeleton rows={5} cols={5} />
            </div>
          ) : activeTab === 'INVOICES' ? (
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-right print:text-black print:border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100 print:bg-gray-100 print:border-2 print:border-black">
                  <tr>
                    <th className="py-4 px-6 font-semibold text-slate-600 print:text-black print:border print:border-gray-400 print:py-2">رقم الفاتورة</th>
                    <th className="py-4 px-6 font-semibold text-slate-600 print:text-black print:border print:border-gray-400 print:py-2">العميل</th>
                    <th className="py-4 px-6 font-semibold text-slate-600 print:text-black print:border print:border-gray-400 print:py-2">التاريخ</th>
                    <th className="py-4 px-6 font-semibold text-slate-600 text-center print:text-black print:border print:border-gray-400 print:py-2">الإجمالي</th>
                    <th className="py-4 px-6 font-semibold text-slate-600 text-center print:text-black print:border print:border-gray-400 print:py-2">المدفوع</th>
                    <th className="py-4 px-6 font-semibold text-slate-600 text-center print:text-black print:border print:border-gray-400 print:py-2">المتبقي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">لا توجد مبيعات في هذه الفترة</td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50 print:break-inside-avoid">
                        <td className="py-4 px-6 font-mono text-sm font-bold text-slate-700 print:text-black print:border print:border-gray-300 print:py-2">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-900 print:text-black print:border print:border-gray-300 print:py-2">
                          {inv.customerName}
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-600 print:text-black print:border print:border-gray-300 print:py-2">
                          {new Date(inv.issuedAt).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="py-4 px-6 text-center font-bold text-slate-800 print:text-black print:border print:border-gray-300 print:py-2">
                          {inv.totalAmount.toLocaleString()}
                        </td>
                        <td className="py-4 px-6 text-center font-bold text-emerald-600 print:text-black print:border print:border-gray-300 print:py-2">
                          {inv.amountPaid.toLocaleString()}
                        </td>
                        <td className="py-4 px-6 text-center font-bold text-rose-600 print:text-black print:border print:border-gray-300 print:py-2">
                          {inv.balance.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div>
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center print:hidden">
                <span className="font-semibold text-slate-700 text-sm">ترتيب المنتجات حسب:</span>
                <select 
                  value={productSortBy} 
                  onChange={(e) => setProductSortBy(e.target.value as any)}
                  className="px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 text-sm font-bold bg-white"
                >
                  <option value="REVENUE">الأعلى إيراداً</option>
                  <option value="QUANTITY">الأكثر مبيعاً (كمية)</option>
                </select>
              </div>
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full text-right print:text-black print:border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-100 print:bg-gray-100 print:border-2 print:border-black">
                    <tr>
                      <th className="py-4 px-6 font-semibold text-slate-600 print:text-black print:border print:border-gray-400 print:py-2">المنتج / الصنف</th>
                      <th className="py-4 px-6 font-semibold text-slate-600 text-center print:text-black print:border print:border-gray-400 print:py-2">الكمية المباعة</th>
                      <th className="py-4 px-6 font-semibold text-slate-600 text-left print:text-black print:border print:border-gray-400 print:py-2">إجمالي الإيرادات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedProducts.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-slate-500">لا توجد مبيعات في هذه الفترة</td>
                      </tr>
                    ) : (
                      sortedProducts.map((p, idx) => (
                        <tr key={p.id} className="hover:bg-slate-50 print:break-inside-avoid">
                          <td className="py-4 px-6 print:border print:border-gray-300 print:py-2">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs print:hidden">{idx + 1}</div>
                              <span className="font-bold text-slate-900 print:text-black">{p.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center font-bold text-slate-800 print:text-black print:border print:border-gray-300 print:py-2">
                            {p.quantity.toLocaleString()}
                          </td>
                          <td className="py-4 px-6 text-left font-bold text-emerald-600 print:text-black print:border print:border-gray-300 print:py-2">
                            {p.revenue.toLocaleString()} ج.م
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { Package, Search, Calendar, User, Printer } from 'lucide-react';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { PageLoader } from '../../../components/ui/Spinner';

export function CustomerDispatchReport() {
  const token = useAuthStore(state => state.token);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState<string>('');
  const [dispatchData, setDispatchData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 50;

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (customerId) {
      fetchDispatchHistory();
    } else {
      setDispatchData(null);
    }
  }, [customerId, page]);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        setCustomers(list);
      }
    } catch (e) {
      console.error(e);
      setCustomers([]);
    }
  };

  const fetchDispatchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reports/customers/${customerId}/dispatch-history?page=${page}&limit=${limit}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (res.ok) {
        setDispatchData(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const customerList = Array.isArray(customers) ? customers : [];

  return (
    <div className="space-y-6">
      <div className="print:hidden flex flex-col md:flex-row justify-between items-start md:items-center bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-white/50 gap-4 transition-all hover:shadow-md">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="bg-indigo-100 p-3 rounded-xl transform transition-transform hover:scale-110">
            <Package className="text-indigo-700" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">تسليمات العملاء (Dispatch History)</h1>
            <p className="text-sm text-slate-500 font-medium">سجل حركة البضائع المنصرفة لكل عميل</p>
          </div>
        </div>
        <div className="w-full md:w-96 relative group">
          <label className="block text-xs font-bold text-indigo-900 mb-1">اختر العميل</label>
          <SearchableSelect
            options={customerList.map(c => ({ value: c.id, label: `${c.name} - ${c.code}` }))}
            value={customerId}
            onChange={(val) => { setCustomerId(val); setPage(1); }}
            placeholder="ابحث عن عميل..."
          />
        </div>
      </div>

      {loading && !dispatchData ? (
        <PageLoader text="جاري استدعاء سجل التسليمات..." />
      ) : dispatchData ? (
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden print:shadow-none print:border-none print:p-0 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
          <div className="p-6 md:p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <User size={20} className="text-indigo-600" />
                سجل تسليمات: {customers.find(c => c.id === customerId)?.name}
              </h2>
              <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                إجمالي الحركات المسجلة: <span className="font-bold text-indigo-700">{dispatchData.total}</span>
              </p>
            </div>
            <button 
              onClick={() => window.print()}
              className="print:hidden bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Printer size={18} />
              <span>طباعة السجل</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-100 backdrop-blur-sm">
                <tr>
                  <th className="py-4 px-6 font-bold text-slate-700 whitespace-nowrap">التاريخ والوقت</th>
                  <th className="py-4 px-6 font-bold text-slate-700">الصنف</th>
                  <th className="py-4 px-6 font-bold text-slate-700 text-center">الكمية</th>
                  <th className="py-4 px-6 font-bold text-slate-700">المستودع</th>
                  <th className="py-4 px-6 font-bold text-slate-700">المرجع (الفاتورة/الإذن)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {dispatchData.movements.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-3">
                        <Package size={48} className="text-slate-200" />
                        <p className="text-lg font-medium">لا توجد حركات منصرفة لهذا العميل</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  dispatchData.movements.map((m: any, idx: number) => (
                    <tr key={m.id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="py-4 px-6 text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-slate-400 group-hover:text-indigo-400 transition-colors" />
                          <span className="font-medium">{new Date(m.date).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-800">{m.productName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{m.size}</div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 font-black rounded-lg">
                          {m.quantity}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-medium">{m.warehouse || '-'}</td>
                      <td className="py-4 px-6">
                        <span className="font-mono text-sm text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                          {m.reason || '-'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {dispatchData.totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/50 print:hidden">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                السابق
              </button>
              <span className="text-sm font-bold text-slate-600">
                صفحة {page} من {dispatchData.totalPages}
              </span>
              <button 
                disabled={page === dispatchData.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                التالي
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-16 flex flex-col items-center justify-center text-slate-400">
          <User size={64} className="text-slate-200 mb-4" />
          <h3 className="text-xl font-bold text-slate-500">اختر العميل لعرض التسليمات</h3>
          <p className="text-sm mt-2 text-slate-400">قم باختيار العميل من القائمة بالأعلى لرؤية كافة حركات البضاعة المنصرفة له.</p>
        </div>
      )}
    </div>
  );
}

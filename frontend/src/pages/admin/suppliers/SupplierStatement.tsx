import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { FileText, ArrowRight, Printer } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { PageLoader } from '../../../components/ui/Spinner';

export function SupplierStatement() {
  const { id } = useParams();
  const token = useAuthStore(state => state.token);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatement();
  }, [id]);

  const fetchStatement = async () => {
    try {
      const res = await fetch(`/api/supplier-ledger/${id}/statement`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageLoader text="جاري تحميل كشف حساب المورد..." />;
  if (!data?.supplier) return <div className="p-12 text-center text-rose-500">المورد غير موجود</div>;

  const { supplier, transactions } = data;
  const currentBalance = transactions.length > 0 ? transactions[transactions.length - 1].runningBalance : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <Link to="/suppliers" className="inline-flex items-center space-x-2 space-x-reverse text-[var(--color-brand-primary)] hover:underline mb-4 font-semibold text-sm">
            <ArrowRight size={16} />
            <span>العودة لقائمة الموردين</span>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{supplier.name}</h1>
          <div className="text-slate-500 flex items-center space-x-4 space-x-reverse font-mono text-sm">
            <span>كود: {supplier.code}</span>
            {supplier.phone && <span>جوال: {supplier.phone}</span>}
            {supplier.taxNumber && <span>الرقم الضريبي: {supplier.taxNumber}</span>}
          </div>
        </div>
        <div className="text-left">
          <p className="text-sm text-slate-500 mb-1">إجمالي المستحقات للمورد</p>
          <p className={`text-4xl font-bold ${currentBalance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {currentBalance.toLocaleString()} ج.م
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-[var(--color-brand-primary)]" />
            حركة الحساب (دفتر الموردين)
          </h2>
          <button onClick={() => window.print()} className="flex items-center space-x-2 space-x-reverse bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold transition-colors">
            <Printer size={18} />
            <span>طباعة كشف الحساب</span>
          </button>
        </div>

        <table className="w-full text-right border border-slate-200">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 font-semibold text-slate-600 border-l border-slate-200">التاريخ</th>
              <th className="py-3 px-4 font-semibold text-slate-600 border-l border-slate-200">البيان / رقم المرجع</th>
              <th className="py-3 px-4 font-semibold text-slate-600 border-l border-slate-200 bg-emerald-50 text-emerald-800">مدفوعات (لنا)</th>
              <th className="py-3 px-4 font-semibold text-slate-600 border-l border-slate-200 bg-amber-50 text-amber-800">مشتريات (له)</th>
              <th className="py-3 px-4 font-bold text-slate-800 bg-slate-100">الرصيد المستحق</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {transactions.length === 0 ? (
              <tr><td colSpan={5} className="py-12 text-center text-slate-500">لا توجد حركات مالية مسجلة حتى الآن</td></tr>
            ) : (
              transactions.map((tx: any) => (
                <tr key={tx.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm text-slate-600 border-l border-slate-200">
                    {new Date(tx.date).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="py-3 px-4 border-l border-slate-200">
                    <p className="font-semibold text-slate-800">{tx.reason || 'حركة مالية'}</p>
                    {tx.referenceId && <p className="text-xs text-slate-400 font-mono" dir="ltr">رقم المرجع: #{tx.referenceId.split('-')[0].toUpperCase()}</p>}
                  </td>
                  <td className="py-3 px-4 text-emerald-600 font-bold border-l border-slate-200">
                    {tx.type === 'PAYMENT' || tx.type === 'RETURN' ? tx.amount.toLocaleString() : ''}
                  </td>
                  <td className="py-3 px-4 text-amber-600 font-bold border-l border-slate-200">
                    {tx.type === 'PURCHASE' ? tx.amount.toLocaleString() : ''}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 bg-slate-50">
                    {tx.runningBalance.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

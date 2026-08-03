import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { FileText, ArrowRight, Printer, Download } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { PageLoader } from '../../../components/ui/Spinner';
import { toArabicDigits } from '../../../utils/numberUtils';
import { downloadCSV } from '../../../utils/exportUtils';

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
    <div className="space-y-6" dir="rtl">
      <div className="print:hidden flex justify-between items-start bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <Link to="/suppliers" className="inline-flex items-center space-x-2 space-x-reverse text-[var(--color-brand-primary)] hover:underline mb-4 font-semibold text-sm">
            <ArrowRight size={16} />
            <span>العودة لقائمة الموردين</span>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{supplier.name}</h1>
          <div className="text-slate-500 flex items-center space-x-4 space-x-reverse font-mono text-sm">
            <span>كود: {toArabicDigits(supplier.code)}</span>
            {supplier.phone && <span>جوال: {toArabicDigits(supplier.phone)}</span>}
            {supplier.taxNumber && <span>الرقم الضريبي: {toArabicDigits(supplier.taxNumber)}</span>}
          </div>
        </div>
        <div className="text-left">
          <p className="text-sm text-slate-500 mb-1">إجمالي المستحقات للمورد</p>
          <p className={`text-4xl font-bold ${currentBalance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {toArabicDigits(currentBalance.toLocaleString('ar-EG'))} ج.م
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 overflow-hidden print:border-none print:shadow-none print:p-0">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-[var(--color-brand-primary)]" />
            حركة الحساب (دفتر الموردين)
          </h2>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                const rows: (string | number)[][] = [
                  ['التاريخ', 'البيان / رقم المرجع', 'مدفوعات (لنا - مدين)', 'مشتريات (له - دائن)', 'طريقة الدفع', 'الرصيد المستحق']
                ];
                transactions.forEach((tx: any) => {
                  rows.push([
                    new Date(tx.date).toLocaleDateString('ar-EG'),
                    tx.reason || 'حركة مالية',
                    tx.type === 'PAYMENT' || tx.type === 'RETURN' ? tx.amount : '',
                    tx.type === 'PURCHASE' ? tx.amount : '',
                    tx.paymentMethod?.name || ((tx.type === 'PAYMENT' || tx.type === 'RETURN') ? 'نقدي / دفع' : 'آجل / تقسيط'),
                    tx.runningBalance
                  ]);
                });
                downloadCSV(`كشف_حساب_مورد_${supplier.name}`, rows);
              }} 
              className="print:hidden flex items-center space-x-2 space-x-reverse bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm"
            >
              <Download size={18} />
              <span>تصدير Excel</span>
            </button>
            <button onClick={() => window.print()} className="print:hidden flex items-center space-x-2 space-x-reverse bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold transition-colors">
              <Printer size={18} />
              <span>طباعة كشف الحساب</span>
            </button>
          </div>
        </div>

        <table className="w-full text-right border border-slate-300 text-sm">
          <thead className="bg-slate-100 border-b border-slate-300 font-bold">
            <tr>
              <th className="py-3 px-4 text-center border-l border-slate-300 w-28 whitespace-nowrap">التاريخ</th>
              <th className="py-3 px-4 border-l border-slate-300">البيان / رقم المرجع</th>
              <th className="py-3 px-4 text-center border-l border-slate-300 bg-emerald-50 text-emerald-900 w-32">مدفوعات (لنا - مدين)</th>
              <th className="py-3 px-4 text-center border-l border-slate-300 bg-amber-50 text-amber-900 w-32">مشتريات (له - دائن)</th>
              <th className="py-3 px-4 text-center border-l border-slate-300 w-32">طريقة الدفع</th>
              <th className="py-3 px-4 text-center bg-slate-200 text-slate-900 w-36">الرصيد المستحق</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {transactions.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-500">لا توجد حركات مالية مسجلة حتى الآن</td></tr>
            ) : (
              transactions.map((tx: any) => (
                <tr key={tx.id} className="hover:bg-slate-50 page-break-inside-avoid">
                  <td className="py-3 px-4 text-center text-slate-600 border-l border-slate-300 whitespace-nowrap">
                    {toArabicDigits(new Date(tx.date).toLocaleDateString('ar-EG'))}
                  </td>
                  <td className="py-3 px-4 border-l border-slate-300">
                    <p className="font-semibold text-slate-800">{tx.reason || 'حركة مالية'}</p>
                    {tx.referenceId && <p className="text-xs text-slate-500 font-mono" dir="ltr">رقم المرجع: #{toArabicDigits(tx.referenceId.split('-')[0].toUpperCase())}</p>}
                  </td>
                  <td className="py-3 px-4 text-center text-emerald-700 font-bold border-l border-slate-300">
                    {tx.type === 'PAYMENT' || tx.type === 'RETURN' ? toArabicDigits(Number(tx.amount).toFixed(2)) : '-'}
                  </td>
                  <td className="py-3 px-4 text-center text-amber-700 font-bold border-l border-slate-300">
                    {tx.type === 'PURCHASE' ? toArabicDigits(Number(tx.amount).toFixed(2)) : '-'}
                  </td>
                  <td className="py-3 px-4 text-center border-l border-slate-300 text-xs font-semibold text-slate-800">
                    {tx.paymentMethod?.name ? (
                      <span className="font-bold text-indigo-700">{tx.paymentMethod.name}</span>
                    ) : (
                      <span className="text-slate-500">{(tx.type === 'PAYMENT' || tx.type === 'RETURN') ? 'نقدي / دفع' : 'آجل / تقسيط'}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-slate-900 bg-slate-50">
                    {toArabicDigits(Number(tx.runningBalance).toFixed(2))}
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

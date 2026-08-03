import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { FileText, ArrowRight, Printer, Download, PlusCircle, X, Calendar, Filter, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { PageLoader } from '../../../components/ui/Spinner';
import { toArabicDigits } from '../../../utils/numberUtils';
import { downloadCSV } from '../../../utils/exportUtils';
import { toast } from '../../../store/toastStore';
import { PaymentMethodBadge } from '../../../components/ui/PaymentMethodBadge';

export function SupplierStatement() {
  const { id } = useParams();
  const token = useAuthStore(state => state.token);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Date Filter State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal State for Direct Payment / Advance Payment to Supplier / Settlement
  const [showModal, setShowModal] = useState(false);
  const [txType, setTxType] = useState<'PAYMENT' | 'PURCHASE'>('PAYMENT');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [treasuryAccountId, setTreasuryAccountId] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [treasuryAccounts, setTreasuryAccounts] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchStatement();
    fetchOptions();
  }, [id]);

  const filteredTransactions = useMemo(() => {
    if (!data?.transactions) return [];
    return data.transactions.filter((tx: any) => {
      const d = new Date(tx.date);
      if (startDate && d < new Date(startDate)) return false;
      if (endDate && d > new Date(endDate + 'T23:59:59')) return false;
      return true;
    });
  }, [data, startDate, endDate]);

  const totalPurchases = useMemo(() => {
    return filteredTransactions.reduce((sum: number, tx: any) => sum + (tx.type === 'PURCHASE' ? tx.amount : 0), 0);
  }, [filteredTransactions]);

  const totalPayments = useMemo(() => {
    return filteredTransactions.reduce((sum: number, tx: any) => sum + (tx.type === 'PAYMENT' || tx.type === 'RETURN' ? tx.amount : 0), 0);
  }, [filteredTransactions]);

  const currentBalance = useMemo(() => {
    if (filteredTransactions.length === 0) return 0;
    return filteredTransactions[filteredTransactions.length - 1].runningBalance;
  }, [filteredTransactions]);

  const fetchOptions = async () => {
    try {
      const [pmRes, trRes] = await Promise.all([
        fetch('/api/payment-methods', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/treasury/accounts', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (pmRes.ok) {
        const pmJson = await pmRes.json();
        const pms = Array.isArray(pmJson) ? pmJson : pmJson.data || [];
        setPaymentMethods(pms);
        if (pms.length > 0) setPaymentMethodId(pms[0].id);
      }
      if (trRes.ok) {
        const trJson = await trRes.json();
        const accs = Array.isArray(trJson) ? trJson : trJson.data || [];
        setTreasuryAccounts(accs);
        if (accs.length > 0) setTreasuryAccountId(accs[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

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

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast.warning('يرجى إدخال مبلغ صحيح');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/supplier-ledger/${id}/transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: txType,
          amount: Number(amount),
          reason: reason || (txType === 'PAYMENT' ? 'دفعة / سداد للمورد' : 'تسوية مستحقات مورد (دائن)'),
          paymentMethodId,
          treasuryAccountId
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'فشلت عملية التسجيل');
      }
      toast.success('تم تسجيل الحركة المالية للمورد بنجاح!');
      setShowModal(false);
      setAmount('');
      setReason('');
      fetchStatement();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء حفظ الحركة');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <PageLoader text="جاري تحميل كشف حساب المورد..." />;
  if (!data?.supplier) return <div className="p-12 text-center text-rose-500">المورد غير موجود</div>;

  const { supplier, transactions } = data;

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

      {/* KPI Cards: Hidden when printing */}
      <div className="print:hidden grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 mb-1">إجمالي المشتريات (له - دائن)</p>
            <p className="text-2xl font-black text-amber-600">{toArabicDigits(totalPurchases.toLocaleString('ar-EG'))} ج.م</p>
          </div>
          <div className="bg-amber-50 p-3.5 rounded-xl text-amber-600">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 mb-1">إجمالي السدادات والدفعات (لنا - مدين)</p>
            <p className="text-2xl font-black text-emerald-600">{toArabicDigits(totalPayments.toLocaleString('ar-EG'))} ج.م</p>
          </div>
          <div className="bg-emerald-50 p-3.5 rounded-xl text-emerald-600">
            <TrendingDown size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 mb-1">صافي المستحقات للمورد</p>
            <p className={`text-2xl font-black ${currentBalance > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
              {toArabicDigits(currentBalance.toLocaleString('ar-EG'))} ج.م
            </p>
          </div>
          <div className="bg-sky-50 p-3.5 rounded-xl text-sky-600">
            <DollarSign size={24} />
          </div>
        </div>
      </div>

      {/* Date Filter Bar: Hidden when printing */}
      <div className="print:hidden bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-4" dir="rtl">
        <div className="flex items-center space-x-2 space-x-reverse text-slate-700 font-bold text-sm">
          <Filter size={18} className="text-sky-600" />
          <span>تصفية كشف حساب المورد بالفترة الزمنية:</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-2 space-x-reverse bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <Calendar size={16} className="text-slate-400" />
            <span className="text-xs text-slate-500 font-semibold">من:</span>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-2 space-x-reverse bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <Calendar size={16} className="text-slate-400" />
            <span className="text-xs text-slate-500 font-semibold">إلى:</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none"
            />
          </div>

          {(startDate || endDate) && (
            <button 
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-xl transition-colors"
            >
              إلغاء التصفية
            </button>
          )}
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
              onClick={() => setShowModal(true)}
              className="print:hidden flex items-center space-x-2 space-x-reverse bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm"
            >
              <PlusCircle size={18} />
              <span>إضافة دفعة للمورد / تسوية</span>
            </button>
            <button 
              onClick={() => {
                const rows: (string | number)[][] = [
                  ['التاريخ', 'البيان / رقم المرجع', 'مدفوعات (لنا - مدين)', 'مشتريات (له - دائن)', 'طريقة الدفع', 'الرصيد المستحق']
                ];
                filteredTransactions.forEach((tx: any) => {
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
            {filteredTransactions.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-500">لا توجد حركات مالية مسجلة حتى الآن</td></tr>
            ) : (
              filteredTransactions.map((tx: any) => (
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
                  <td className="py-3 px-4 text-center border-l border-slate-300 text-xs font-semibold">
                    <PaymentMethodBadge name={tx.paymentMethod?.name} isPayment={tx.type === 'PAYMENT' || tx.type === 'RETURN'} />
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

      {/* Modal for Supplier Advance Payment / Settlement */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">إضافة دفعة للمورد / تسوية رصيد</h3>
                <p className="text-xs text-slate-300">المورد: {supplier.name}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">نوع الحركة المالية</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTxType('PAYMENT')}
                    className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all ${
                      txType === 'PAYMENT' 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    سداد / دفعة للمورد (خصم من الدين)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxType('PURCHASE')}
                    className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all ${
                      txType === 'PURCHASE' 
                        ? 'bg-amber-50 border-amber-500 text-amber-700 ring-2 ring-amber-500/20' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    تسوية دائن (إضافة مستحقات للمورد)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">المبلغ (ج.م)</label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="أدخل المبلغ..."
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-sky-500/20 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">طريقة السداد</label>
                <select
                  value={paymentMethodId}
                  onChange={(e) => setPaymentMethodId(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-sky-500/20 font-semibold text-slate-800"
                >
                  {paymentMethods.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">الخزينة / البنك (للمبيعات والصرف)</label>
                <select
                  value={treasuryAccountId}
                  onChange={(e) => setTreasuryAccountId(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-sky-500/20 font-semibold text-slate-800"
                >
                  {treasuryAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} (الرصيد: {acc.balance})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">البيان / سبب الحركة</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={txType === 'PAYMENT' ? 'مثال: دفعة مقدمة لحساب مشتريات قادمة' : 'مثال: تسوية مستحقات توريد'}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري التسجيل...' : 'تأكيد وحفظ الحركة'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-3 border rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

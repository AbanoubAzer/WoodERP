import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { FileText, ArrowRight, Printer, Download, PlusCircle, X, Calendar, Filter, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { PageLoader } from '../../../components/ui/Spinner';
import { toArabicDigits } from '../../../utils/numberUtils';
import { downloadCSV } from '../../../utils/exportUtils';
import { toast } from '../../../store/toastStore';
import { PaymentMethodBadge } from '../../../components/ui/PaymentMethodBadge';

export function CustomerStatement() {
  const { id } = useParams();
  const token = useAuthStore((state) => state.token);
  const [statementData, setStatementData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Date Filter State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal State for Direct Payment / Down Payment / Adjustment
  const [showModal, setShowModal] = useState(false);
  const [txType, setTxType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [treasuryAccountId, setTreasuryAccountId] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [treasuryAccounts, setTreasuryAccounts] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Installment Payment Modal State
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
  const [payAmount, setPayAmount] = useState('');

  useEffect(() => {
    fetchStatement();
    fetchOptions();
  }, [id]);

  const filteredStatement = useMemo(() => {
    if (!statementData?.statement) return [];
    return statementData.statement.filter((row: any) => {
      const d = new Date(row.date);
      if (startDate && d < new Date(startDate)) return false;
      if (endDate && d > new Date(endDate + 'T23:59:59')) return false;
      return true;
    });
  }, [statementData, startDate, endDate]);

  const totalValue = useMemo(() => {
    return filteredStatement.reduce((sum: number, r: any) => sum + (r.value || 0), 0);
  }, [filteredStatement]);

  const totalPayments = useMemo(() => {
    return filteredStatement.reduce((sum: number, r: any) => sum + (r.payment || 0), 0);
  }, [filteredStatement]);

  const currentBalance = useMemo(() => {
    if (filteredStatement.length === 0) return 0;
    return filteredStatement[filteredStatement.length - 1].balance;
  }, [filteredStatement]);

  const fetchOptions = async () => {
    try {
      const [pmRes, trRes] = await Promise.all([
        fetch('/api/payment-methods', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/treasury/accounts', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (pmRes.ok) {
        const pmJson = await pmRes.json();
        setPaymentMethods(Array.isArray(pmJson) ? pmJson : pmJson.data || []);
        if (pmJson.length > 0) setPaymentMethodId(pmJson[0].id);
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
      const res = await fetch(`/api/reports/customers/${id}/statement`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      setStatementData(json);
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
      const res = await fetch(`/api/customer-ledger/${id}/transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: txType,
          amount: Number(amount),
          reason: reason || (txType === 'CREDIT' ? 'دفعة مقدمة / تحصيل' : 'تسوية رصيد (مدين)'),
          paymentMethodId,
          treasuryAccountId
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'فشلت عملية التسجيل');
      }
      toast.success('تم تسجل الحركة المالية بنجاح!');
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

  const handlePayInstallmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstallment || !payAmount || Number(payAmount) <= 0) {
      toast.warning('يرجى إدخال مبلغ سداد صحيح');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/installments/${selectedInstallment.id}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: Number(payAmount),
          paymentMethodId,
          treasuryAccountId
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'فشلت عملية سداد القسط');
      }
      toast.success('تم سداد القسط وتحديث الخزينة وحساب العميل بنجاح!');
      setSelectedInstallment(null);
      setPayAmount('');
      fetchStatement();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء سداد القسط');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <PageLoader text="جاري تحميل كشف حساب العميل..." />;
  if (!statementData?.customer) return <div className="p-12 text-center text-rose-500">العميل غير موجود</div>;

  return (
    <div className="space-y-6">
      {/* Controls: Hidden when printing */}
      <div className="print:hidden flex justify-between items-start bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <Link to="/customers" className="inline-flex items-center space-x-2 space-x-reverse text-[var(--color-brand-primary)] hover:underline mb-4 font-semibold text-sm">
            <ArrowRight size={16} />
            <span>العودة لقائمة العملاء</span>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{statementData.customer.name}</h1>
          <div className="text-slate-500 flex items-center space-x-4 space-x-reverse font-mono text-sm">
            <span>كود: {toArabicDigits(statementData.customer.code)}</span>
            {statementData.customer.phone && <span>جوال: {toArabicDigits(statementData.customer.phone)}</span>}
            {statementData.customer.taxNumber && <span>الرقم الضريبي: {toArabicDigits(statementData.customer.taxNumber)}</span>}
          </div>
        </div>
        <div className="text-left flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 space-x-reverse bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-bold transition-colors shadow-sm"
          >
            <PlusCircle size={18} />
            <span>إضافة دفعة مقدمة / تسوية</span>
          </button>
          <button 
            onClick={() => {
              const rows: (string | number)[][] = [
                ['التاريخ', 'البيان / الصنف', 'الكمية', 'سعر المتر', 'القيمة (مدين)', 'المدفوع (دائن)', 'طريقة الدفع', 'الرصيد']
              ];
              statementData.statement.forEach((row: any) => {
                if (row.items && row.items.length > 0) {
                  row.items.forEach((item: any, itemIdx: number) => {
                    rows.push([
                      itemIdx === 0 ? new Date(row.date).toLocaleDateString('ar-EG') : '',
                      item.productName,
                      item.quantity,
                      item.price,
                      item.subtotal,
                      itemIdx === 0 && row.payment > 0 ? row.payment : '',
                      itemIdx === 0 ? (row.paymentMethodName || (row.payment > 0 ? 'نقدي / تحصيل' : 'آجل / تقسيط')) : '',
                      itemIdx === 0 ? row.balance : ''
                    ]);
                  });
                } else {
                  rows.push([
                    new Date(row.date).toLocaleDateString('ar-EG'),
                    row.description,
                    '-',
                    '-',
                    row.value > 0 ? row.value : '',
                    row.payment > 0 ? row.payment : '',
                    row.paymentMethodName || (row.payment > 0 ? 'نقدي / تحصيل' : 'آجل'),
                    row.balance
                  ]);
                }
              });
              downloadCSV(`كشف_حساب_${statementData.customer.name}`, rows);
            }}
            className="flex items-center space-x-2 space-x-reverse bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold transition-colors shadow-sm"
          >
            <Download size={18} />
            <span>تصدير Excel</span>
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center space-x-2 space-x-reverse bg-slate-800 hover:bg-slate-700 text-white px-5 py-3 rounded-xl font-bold transition-colors shadow-lg"
          >
            <Printer size={18} />
            <span>طباعة الكشف</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Hidden when printing */}
      <div className="print:hidden grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 mb-1">إجمالي المبيعات / المسحوبات (مدين)</p>
            <p className="text-2xl font-black text-rose-600">{toArabicDigits(totalValue.toLocaleString('ar-EG'))} ج.م</p>
          </div>
          <div className="bg-rose-50 p-3.5 rounded-xl text-rose-600">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 mb-1">إجمالي التحصيلات والسدادات (دائن)</p>
            <p className="text-2xl font-black text-emerald-600">{toArabicDigits(totalPayments.toLocaleString('ar-EG'))} ج.م</p>
          </div>
          <div className="bg-emerald-50 p-3.5 rounded-xl text-emerald-600">
            <TrendingDown size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 mb-1">صافي الدين المستحق الحالي</p>
            <p className={`text-2xl font-black ${currentBalance > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
              {toArabicDigits(currentBalance.toLocaleString('ar-EG'))} ج.م
            </p>
          </div>
          <div className="bg-amber-50 p-3.5 rounded-xl text-amber-600">
            <DollarSign size={24} />
          </div>
        </div>
      </div>

      {/* Date Filter Bar: Hidden when printing */}
      <div className="print:hidden bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-4" dir="rtl">
        <div className="flex items-center space-x-2 space-x-reverse text-slate-700 font-bold text-sm">
          <Filter size={18} className="text-indigo-600" />
          <span>تصفية كشف الحساب بالفترة الزمنية:</span>
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

      {/* Print Document Layout */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 print:shadow-none print:border-none print:p-0 w-full" dir="rtl">
        
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-2xl font-bold mb-2">كشف حساب عميل</h1>
          <h2 className="text-xl font-semibold">{statementData.customer.name}</h2>
          {statementData.customer.phone && <p className="text-gray-600 text-sm mt-1">تليفون: {toArabicDigits(statementData.customer.phone)}</p>}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-400 text-[13px] print:text-[11px]">
            <thead className="bg-slate-100 print:bg-slate-100 font-bold">
              <tr>
                <th className="border border-slate-400 px-3 py-2 text-center w-28 whitespace-nowrap">التاريخ</th>
                <th className="border border-slate-400 px-3 py-2 text-center">البيان / الصنف</th>
                <th className="border border-slate-400 px-3 py-2 text-center w-16">كمية</th>
                <th className="border border-slate-400 px-3 py-2 text-center w-20">سعر المتر</th>
                <th className="border border-slate-400 px-3 py-2 text-center w-24">القيمة (مدين)</th>
                <th className="border border-slate-400 px-3 py-2 text-center w-24 text-emerald-800">المدفوع (دائن)</th>
                <th className="border border-slate-400 px-3 py-2 text-center w-28">طريقة الدفع</th>
                <th className="border border-slate-400 px-3 py-2 text-center w-28">الرصيد</th>
              </tr>
            </thead>
            <tbody>
              {filteredStatement.map((row: any, idx: number) => {
                const hasItems = row.items && row.items.length > 0;
                
                if (hasItems) {
                  return (
                    <React.Fragment key={`inv-group-${row.id}`}>
                      {/* Invoice Summary Header Row */}
                      <tr className="bg-slate-100/90 font-bold border-b border-slate-400 page-break-inside-avoid">
                        <td className="border border-slate-400 px-3 py-2 text-center font-bold text-slate-800">
                          {toArabicDigits(new Date(row.date).toLocaleDateString('ar-EG'))}
                        </td>
                        <td className="border border-slate-400 px-3 py-2 text-right text-indigo-900 font-black" colSpan={3}>
                          {row.description}
                        </td>
                        <td className="border border-slate-400 px-3 py-2 text-center text-xs font-bold text-rose-700">
                          {toArabicDigits(Number(row.totalAmount || row.value).toFixed(2))} ج.م
                        </td>
                        <td className="border border-slate-400 px-3 py-2 text-center text-xs font-bold text-emerald-700">
                          {row.amountPaid !== undefined ? toArabicDigits(Number(row.amountPaid).toFixed(2)) : (row.payment > 0 ? toArabicDigits(Number(row.payment).toFixed(2)) : '-')}
                        </td>
                        <td className="border border-slate-400 px-3 py-2 text-center text-xs font-semibold">
                          <PaymentMethodBadge name={row.paymentMethodName} isPayment={row.payment > 0 || (row.amountPaid && row.amountPaid > 0)} />
                        </td>
                        <td className="border border-slate-400 px-3 py-2 text-center font-bold bg-slate-200 text-slate-900">
                          {toArabicDigits(Number(row.balance).toFixed(2))}
                        </td>
                      </tr>

                      {/* Itemized Rows */}
                      {row.items.map((item: any, itemIdx: number) => (
                        <tr key={`${row.id}-${itemIdx}`} className="page-break-inside-avoid bg-white hover:bg-slate-50 text-xs">
                          <td className="border border-slate-300 px-3 py-1.5 text-center text-slate-400 text-[11px]">
                            {toArabicDigits(itemIdx + 1)}
                          </td>
                          <td className="border border-slate-300 px-3 py-1.5 text-right font-medium text-slate-800 pr-6">
                            ↳ {item.productName}
                          </td>
                          <td className="border border-slate-300 px-3 py-1.5 text-center">{toArabicDigits(item.quantity)}</td>
                          <td className="border border-slate-300 px-3 py-1.5 text-center">{toArabicDigits(Number(item.price).toFixed(2))}</td>
                          <td className="border border-slate-300 px-3 py-1.5 text-center font-semibold text-rose-600">{toArabicDigits(Number(item.subtotal).toFixed(2))}</td>
                          <td className="border border-slate-300 px-3 py-1.5 text-center text-slate-400">-</td>
                          <td className="border border-slate-300 px-3 py-1.5 text-center text-slate-400">-</td>
                          <td className="border border-slate-300 px-3 py-1.5 text-center text-slate-400 bg-slate-50/50">-</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                } else {
                  return (
                    <tr key={row.id} className="page-break-inside-avoid bg-slate-50/50">
                      <td className="border border-slate-400 px-3 py-2 text-center whitespace-nowrap">{toArabicDigits(new Date(row.date).toLocaleDateString('ar-EG'))}</td>
                      <td className="border border-slate-400 px-3 py-2 text-right font-medium">{row.description}</td>
                      <td className="border border-slate-400 px-3 py-2 text-center">-</td>
                      <td className="border border-slate-400 px-3 py-2 text-center">-</td>
                      <td className="border border-slate-400 px-3 py-2 text-center text-rose-700 font-semibold">{row.value > 0 ? toArabicDigits(Number(row.value).toFixed(2)) : '-'}</td>
                      <td className="border border-slate-400 px-3 py-2 text-center text-emerald-700 font-bold">{row.payment > 0 ? toArabicDigits(Number(row.payment).toFixed(2)) : '-'}</td>
                      <td className="border border-slate-400 px-3 py-2 text-center text-xs font-semibold">
                        <PaymentMethodBadge name={row.paymentMethodName} isPayment={row.payment > 0} />
                      </td>
                      <td className="border border-slate-400 px-3 py-2 text-center font-bold bg-slate-100">{toArabicDigits(Number(row.balance).toFixed(2))}</td>
                    </tr>
                  );
                }
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Signature Area */}
        <div className="mt-12 flex justify-between px-12 print:mt-12 page-break-inside-avoid">
          <div className="text-center">
            <p className="font-bold border-b-2 border-slate-400 w-32 pb-1 mb-2 text-sm">توقيع المستلم</p>
          </div>
          <div className="text-center">
            <p className="font-bold border-b-2 border-slate-400 w-32 pb-1 mb-2 text-sm">توقيع المحاسب</p>
          </div>
        </div>
      </div>

      {statementData.pendingInstallments && statementData.pendingInstallments.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mt-6 print:border-none print:shadow-none print:p-0">
          <h3 className="text-lg font-bold text-slate-900 mb-4 border-b pb-2 print:border-b-2 print:border-black">الأقساط المتبقية للعميل</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 print:bg-slate-100 print:border-slate-400">
                <tr>
                  <th className="py-3 px-4 font-semibold text-slate-700 print:border print:border-slate-400">رقم القسط</th>
                  <th className="py-3 px-4 font-semibold text-slate-700 print:border print:border-slate-400 text-center">تاريخ الاستحقاق</th>
                  <th className="py-3 px-4 font-semibold text-slate-700 print:border print:border-slate-400 text-center">المبلغ المستحق</th>
                  <th className="py-3 px-4 font-semibold text-slate-700 print:border print:border-slate-400 text-center">المدفوع</th>
                  <th className="py-3 px-4 font-semibold text-slate-700 print:border print:border-slate-400 text-center">حالة القسط</th>
                  <th className="py-3 px-4 font-semibold text-slate-700 print:hidden text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {statementData.pendingInstallments.map((inst: any) => (
                  <tr key={inst.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-800 print:border print:border-slate-400">قسط رقم {toArabicDigits(inst.installmentNumber)}</td>
                    <td className="py-3 px-4 text-center print:border print:border-slate-400">
                      {inst.dueDate ? toArabicDigits(new Date(inst.dueDate).toLocaleDateString('ar-EG')) : <span className="text-amber-600 font-semibold bg-amber-50 px-2 py-1 rounded">دفعة بدون تاريخ (مرنة)</span>}
                    </td>
                    <td className="py-3 px-4 text-center font-bold print:border print:border-slate-400">{toArabicDigits(inst.amount.toLocaleString('ar-EG'))} ج.م</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold print:border print:border-slate-400">{toArabicDigits(inst.paidAmount.toLocaleString('ar-EG'))} ج.م</td>
                    <td className="py-3 px-4 text-center print:border print:border-slate-400">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        inst.status === 'OVERDUE' ? 'bg-rose-100 text-rose-700' :
                        inst.status === 'PARTIAL' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {inst.status === 'OVERDUE' ? 'متأخر' : inst.status === 'PARTIAL' ? 'مدفوع جزئياً' : 'قيد الانتظار'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center print:hidden">
                      <button
                        onClick={() => {
                          setSelectedInstallment(inst);
                          setPayAmount((inst.amount - inst.paidAmount).toString());
                        }}
                        className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                      >
                        سداد
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for Advance Payment / Settlement */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">إضافة دفعة مقدمة / تسوية رصيد</h3>
                <p className="text-xs text-slate-300">العميل: {statementData.customer.name}</p>
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
                    onClick={() => setTxType('CREDIT')}
                    className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all ${
                      txType === 'CREDIT' 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    تحصيل / دفعة مقدمة (خصم من الدين)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxType('DEBIT')}
                    className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all ${
                      txType === 'DEBIT' 
                        ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/20' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    تسوية مدين (إضافة على الدين)
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
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">طريقة السداد</label>
                <select
                  value={paymentMethodId}
                  onChange={(e) => setPaymentMethodId(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-semibold text-slate-800"
                >
                  {paymentMethods.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">الخزينة / البنك</label>
                <select
                  value={treasuryAccountId}
                  onChange={(e) => setTreasuryAccountId(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-semibold text-slate-800"
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
                  placeholder={txType === 'CREDIT' ? 'مثال: دفعة مقدمة لحساب فاتورة قادمة' : 'مثال: تسوية فروق حسابات'}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
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

      {/* Modal for Installment Payment */}
      {selectedInstallment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="bg-emerald-700 p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">سداد قسط رقم #{toArabicDigits(selectedInstallment.installmentNumber)}</h3>
                <p className="text-xs text-emerald-100">المبلغ المستحق: {toArabicDigits(selectedInstallment.amount - selectedInstallment.paidAmount)} ج.م</p>
              </div>
              <button onClick={() => setSelectedInstallment(null)} className="text-emerald-200 hover:text-white p-1 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePayInstallmentSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">مبلغ السداد (ج.م)</label>
                <input
                  type="number"
                  min="0.01"
                  max={selectedInstallment.amount - selectedInstallment.paidAmount}
                  step="any"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500/20 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">طريقة السداد</label>
                <select
                  value={paymentMethodId}
                  onChange={(e) => setPaymentMethodId(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500/20 font-semibold text-slate-800"
                >
                  {paymentMethods.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">إيداع في الخزينة / البنك</label>
                <select
                  value={treasuryAccountId}
                  onChange={(e) => setTreasuryAccountId(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500/20 font-semibold text-slate-800"
                >
                  {treasuryAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} (الرصيد: {acc.balance})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري السداد...' : 'تأكيد وحفظ سداد القسط'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInstallment(null)}
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

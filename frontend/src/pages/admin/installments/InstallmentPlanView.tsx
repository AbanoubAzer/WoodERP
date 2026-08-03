import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { CheckCircle2, AlertCircle, Clock, Banknote, ArrowRight } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { toast } from '../../../store/toastStore';
import { PageLoader } from '../../../components/ui/Spinner';

export function InstallmentPlanView() {
  const { id } = useParams();
  const token = useAuthStore(state => state.token);
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  
  // Payment Modal State
  const [showPayModal, setShowPayModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
  const [payAmount, setPayAmount] = useState('');
  const [settlementAmount, setSettlementAmount] = useState('');
  const [treasuryAccounts, setTreasuryAccounts] = useState<any[]>([]);
  const [treasuryAccountId, setTreasuryAccountId] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [paymentMethodId, setPaymentMethodId] = useState('');

  useEffect(() => {
    fetchPlan();
    fetchTreasuryAccounts();
    fetchPaymentMethods();
  }, [id]);

  const fetchPlan = async () => {
    try {
      const res = await fetch(`/api/installments/plans/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setPlan(data);
      setNotes(data.notes || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTreasuryAccounts = async () => {
    try {
      const res = await fetch('/api/treasury/accounts', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setTreasuryAccounts(data);
        if (data.length > 0) setTreasuryAccountId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const res = await fetch('/api/payment-methods', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        const active = data.filter((m: any) => m.isActive);
        setPaymentMethods(active);
        if (active.length > 0) setPaymentMethodId(active[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openPayModal = (inst: any) => {
    setSelectedInstallment(inst);
    setPayAmount((inst.amount - inst.paidAmount).toString());
    setShowPayModal(true);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedMethod = paymentMethods.find(m => m.id === paymentMethodId);
      const response = await fetch(`/api/installments/${selectedInstallment.id}/pay`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          amount: Number(payAmount),
          treasuryAccountId,
          paymentMethodId,
          method: selectedMethod?.type || 'CASH'
        })
      });

      if (!response.ok) throw new Error('فشلت عملية الدفع');

      toast.success('تمت عملية الدفع وتسجيلها بنجاح!');
      setShowPayModal(false);
      fetchPlan(); // refresh
    } catch (err: any) {
      console.error(err);
      toast.error('فشلت عملية الدفع', err.message);
    }
  };

  const handleSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm('هل أنت متأكد من إجراء تسوية مبكرة لكامل خطة الأقساط المتبقية؟')) return;

    try {
      const selectedMethod = paymentMethods.find(m => m.id === paymentMethodId);
      const response = await fetch(`/api/installments/plans/${plan.id}/settle`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          settlementAmount: Number(settlementAmount),
          treasuryAccountId,
          paymentMethodId,
          method: selectedMethod?.type || 'CASH'
        })
      });

      if (!response.ok) throw new Error('فشلت عملية التسوية');

      toast.success('تمت التسوية المبكرة بنجاح!');
      setShowSettleModal(false);
      fetchPlan(); // refresh
    } catch (err: any) {
      console.error(err);
      toast.error('فشلت عملية التسوية', err.message);
    }
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      const response = await fetch(`/api/installments/plans/${plan.id}/notes`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ notes })
      });
      if (!response.ok) throw new Error('فشلت عملية حفظ الملاحظات');
      
      const updatedPlan = await response.json();
      setPlan((prev: any) => ({ ...prev, notes: updatedPlan.notes }));
      toast.success('تم حفظ الملاحظات بنجاح!');
    } catch (err: any) {
      toast.error('خطأ', err.message);
    } finally {
      setIsSavingNotes(false);
    }
  };

  if (loading) return <PageLoader text="جاري تحميل خطة التقسيط..." />;
  if (!plan) return <div className="p-12 text-center text-rose-500">الخطة غير موجودة</div>;

  const totalPaid = plan.installments.reduce((sum: number, i: any) => sum + i.paidAmount, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6 relative">
      <div className="flex justify-between items-center">
        <Link to="/installments" className="flex items-center space-x-2 space-x-reverse text-orange-600 font-bold hover:underline">
          <ArrowRight size={20} />
          <span>العودة لخطط التقسيط</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Sidebar Summary */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-sm font-bold text-slate-400 mb-2 uppercase">
              {plan.customer ? 'بيانات العميل' : 'بيانات المورد'}
            </h2>
            <p className="text-xl font-bold text-slate-900">{plan.customer?.name || plan.supplier?.name}</p>
            <p className="text-slate-500 text-sm mt-1">{plan.customer?.phone || plan.supplier?.phone || 'لا يوجد رقم'}</p>
          </div>
          
          <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-lg">
            <h2 className="text-sm font-bold text-slate-400 mb-2">إجمالي مديونية الخطة</h2>
            <p className="text-3xl font-black text-orange-400 mb-6">{plan.totalAmount.toLocaleString()} <span className="text-base font-normal">ج.م</span></p>
            
            <div className="space-y-3 pt-4 border-t border-slate-700 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">المدفوع:</span>
                <span className="font-bold text-emerald-400">{totalPaid.toLocaleString()} ج.م</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">المتبقي:</span>
                <span className="font-bold text-rose-400">{(plan.totalAmount - totalPaid).toLocaleString()} ج.م</span>
              </div>
            </div>
            
            {plan.status !== 'COMPLETED' && (plan.totalAmount - totalPaid) > 0 && (
              <button 
                onClick={() => {
                  setSettlementAmount((plan.totalAmount - totalPaid).toString());
                  setShowSettleModal(true);
                }}
                className="w-full mt-6 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors border border-slate-700"
              >
                تسوية مبكرة لكامل الأقساط
              </button>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              ملاحظات وسجل المتابعة
            </h2>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="اكتب ملاحظاتك هنا (مثال: تم الاتصال بالعميل ووعد بالسداد...)"
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500/20 text-sm min-h-[120px] bg-slate-50"
            />
            <button
              onClick={handleSaveNotes}
              disabled={isSavingNotes || notes === (plan.notes || '')}
              className="mt-3 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 font-bold py-2 rounded-lg transition-colors text-sm"
            >
              {isSavingNotes ? 'جاري الحفظ...' : 'حفظ الملاحظات'}
            </button>
          </div>
        </div>

        {/* Schedule */}
        <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Clock className="text-orange-500" />
            جدول السداد
          </h2>

          <div className="space-y-4">
            {plan.installments.map((inst: any) => {
              const isPaid = inst.status === 'PAID';
              const isPartial = inst.status === 'PARTIAL';
              const isOverdue = inst.dueDate && new Date(inst.dueDate) < new Date() && !isPaid;

              return (
                <div key={inst.id} className={`flex items-center justify-between p-4 rounded-xl border-l-4 ${
                  isPaid ? 'border-emerald-500 bg-emerald-50' : 
                  isOverdue ? 'border-rose-500 bg-rose-50' : 
                  'border-slate-300 bg-slate-50'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-white shadow-sm text-slate-600">
                      {inst.installmentNumber}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">
                        {inst.dueDate 
                          ? new Date(inst.dueDate).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                          : 'دفعة بدون تاريخ (دفعة حرة)'}
                      </p>
                      <div className="flex gap-2 text-sm mt-1">
                        <span className="font-mono text-slate-600 font-bold">قيمة القسط: {inst.amount.toLocaleString()} ج.م</span>
                        {isPartial && <span className="text-orange-600 font-bold">(متبقي: {(inst.amount - inst.paidAmount).toLocaleString()} ج.م)</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    {isPaid ? (
                      <span className="flex items-center gap-1 text-emerald-600 font-bold bg-white px-3 py-1 rounded-full shadow-sm text-sm">
                        <CheckCircle2 size={16} /> مدفوع / مكتمل
                      </span>
                    ) : (
                      <>
                        {isOverdue ? (
                          <span className="flex items-center gap-1 text-rose-600 text-xs font-bold"><AlertCircle size={14} /> متأخر</span>
                        ) : isPartial ? (
                          <span className="flex items-center gap-1 text-blue-600 text-xs font-bold">مدفوع جزئياً</span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-600 text-xs font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">قيد الانتظار</span>
                        )}
                        <button onClick={() => openPayModal(inst)} className={`flex items-center gap-1 ${plan.supplier ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-900 hover:bg-slate-800'} text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors`}>
                          <Banknote size={16} /> {plan.supplier ? 'دفع للمورد' : 'تحصيل'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-xl">{plan.supplier ? 'دفع قسط مورد رقم' : 'تحصيل قسط رقم'} {selectedInstallment?.installmentNumber}</h3>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handlePayment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">تاريخ الاستحقاق</label>
                <p className="text-slate-900 font-mono">{new Date(selectedInstallment?.dueDate).toLocaleDateString('ar-EG')}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">إجمالي القسط</label>
                <p className="text-slate-900 font-mono font-bold">{selectedInstallment?.amount.toLocaleString()} ج.م</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">المبلغ المتبقي للتحصيل</label>
                <input 
                  type="number" 
                  max={selectedInstallment?.amount - selectedInstallment?.paidAmount}
                  required 
                  value={payAmount} 
                  onChange={e => setPayAmount(e.target.value)} 
                  className="w-full px-4 py-3 border rounded-xl font-bold text-orange-600 focus:ring-2 focus:ring-orange-500/20" 
                />
                <p className="text-xs text-slate-500 mt-1">يمكنك إدخال مبلغ أقل لتحصيل دفعات جزئية.</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">طريقة السداد</label>
                <select
                  value={paymentMethodId}
                  onChange={e => setPaymentMethodId(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500/20 bg-white font-semibold text-slate-800"
                >
                  {paymentMethods.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">الخزينة / البنك</label>
                <SearchableSelect
                  options={treasuryAccounts.map(t => ({
                    value: t.id,
                    label: `${t.name} (الرصيد: ${t.balance})`
                  }))}
                  value={treasuryAccountId}
                  onChange={setTreasuryAccountId}
                  placeholder="-- اختر حساب الخزينة --"
                />
              </div>

              <button type="submit" className={`w-full mt-4 py-3 ${plan.supplier ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white rounded-xl font-bold`}>
                {plan.supplier ? 'تأكيد الدفع وتقليل المديونية' : 'تأكيد التحصيل وتقييد لحساب العميل'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Early Settlement Modal */}
      {showSettleModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-xl">تسوية مبكرة لكامل خطة الأقساط</h3>
              <button onClick={() => setShowSettleModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSettlement} className="p-6 space-y-4">
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                <p className="text-sm font-bold text-orange-800 mb-1">إجمالي المتبقي من خطة الأقساط:</p>
                <p className="text-2xl font-black text-orange-900">{(plan.totalAmount - totalPaid).toLocaleString()} ج.م</p>
                <p className="text-xs text-orange-700 mt-2 flex items-center gap-1">
                  <AlertCircle size={14} /> سيتم إغلاق جميع الأقساط المتبقية وتحويل حالة الخطة إلى مكتملة.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">المبلغ الفعلي المدفوع</label>
                <input 
                  type="number" 
                  required 
                  min="0"
                  step="any"
                  value={settlementAmount} 
                  onChange={e => setSettlementAmount(e.target.value)} 
                  className="w-full px-4 py-3 border rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-orange-500/20" 
                />
                {(plan.totalAmount - totalPaid) - Number(settlementAmount) > 0 && (
                  <p className="text-sm font-bold text-emerald-600 mt-2 bg-emerald-50 p-2 rounded">
                    قيمة الخصم / إعدام الدين: {((plan.totalAmount - totalPaid) - Number(settlementAmount)).toLocaleString()} ج.م
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">طريقة السداد</label>
                <select
                  value={paymentMethodId}
                  onChange={e => setPaymentMethodId(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500/20 bg-white font-semibold text-slate-800"
                >
                  {paymentMethods.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">الخزينة / البنك</label>
                <SearchableSelect
                  options={treasuryAccounts.map(t => ({
                    value: t.id,
                    label: `${t.name} (الرصيد: ${t.balance})`
                  }))}
                  value={treasuryAccountId}
                  onChange={setTreasuryAccountId}
                  placeholder="-- اختر حساب الخزينة --"
                />
              </div>

              <button type="submit" className="w-full mt-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold">
                تأكيد التسوية المبكرة
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

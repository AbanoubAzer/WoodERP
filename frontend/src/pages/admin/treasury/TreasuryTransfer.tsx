import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { ArrowLeftRight, Save } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { toast } from '../../../store/toastStore';

export function TreasuryTransfer() {
  const token = useAuthStore(state => state.token);
  const navigate = useNavigate();
  
  const [accounts, setAccounts] = useState<any[]>([]);
  
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    const res = await fetch('/api/treasury/accounts', { headers: { Authorization: `Bearer ${token}` } });
    setAccounts(await res.json());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fromAccountId === toAccountId) return toast.error('لا يمكن التحويل لنفس الحساب');
    
    try {
      const response = await fetch('/api/treasury/transfer', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          fromAccountId,
          toAccountId,
          amount: Number(amount),
          description
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'حدث خطأ أثناء التحويل');
      }

      toast.success('تم التحويل بنجاح!');
      navigate('/treasury');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <Link to="/treasury" className="text-slate-500 hover:text-slate-800 font-bold transition-colors">
          &rarr; العودة للخزائن
        </Link>
      </div>

      <div className="flex items-center space-x-3 space-x-reverse bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="bg-indigo-100 p-3 rounded-xl">
          <ArrowLeftRight className="text-indigo-700" size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">تحويل داخلي</h1>
          <p className="text-sm text-slate-500">نقل الأموال بين الخزائن وحسابات البنوك مع تسجيل القيد المحاسبي</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 gap-6 mb-8 relative">
          
          {/* Arrow indicator for desktop */}
          <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-50 p-3 rounded-full border border-slate-200 z-10 text-slate-400">
            <ArrowLeftRight size={24} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-rose-50/50 p-6 rounded-xl border border-rose-100">
              <label className="block text-sm font-semibold text-rose-900 mb-2">من حساب (المرسل)</label>
              <SearchableSelect
                options={accounts.map(a => ({ value: a.id, label: `${a.name} - رصيد: ${a.balance.toLocaleString()} ج.م` }))}
                value={fromAccountId}
                onChange={setFromAccountId}
                placeholder="ابحث عن حساب..."
              />
              {fromAccountId && (
                <p className="mt-2 text-xs font-semibold text-rose-600">
                  سيتم خصم المبلغ من هذا الحساب
                </p>
              )}
            </div>

            <div className="bg-emerald-50/50 p-6 rounded-xl border border-emerald-100">
              <label className="block text-sm font-semibold text-emerald-900 mb-2">إلى حساب (المستقبل)</label>
              <SearchableSelect
                options={accounts.map(a => ({ value: a.id, label: `${a.name} - رصيد: ${a.balance.toLocaleString()} ج.م` }))}
                value={toAccountId}
                onChange={setToAccountId}
                placeholder="ابحث عن حساب..."
              />
              {toAccountId && (
                <p className="mt-2 text-xs font-semibold text-emerald-600">
                  سيتم إيداع المبلغ في هذا الحساب
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">المبلغ المراد تحويله (ج.م)</label>
            <input required type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="مثال: 50000" className="w-full px-4 py-4 border-2 rounded-xl text-2xl font-bold text-center focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">البيان / سبب التحويل</label>
            <input required type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="مثال: توريد نقدية من خزينة الفرع إلى حساب البنك" className="w-full px-4 py-3 border rounded-xl" />
          </div>

          <div className="pt-6 border-t border-slate-100">
            <button type="submit" className="w-full flex justify-center items-center space-x-2 space-x-reverse px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
              <Save size={24} />
              <span>تأكيد وتنفيذ التحويل</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

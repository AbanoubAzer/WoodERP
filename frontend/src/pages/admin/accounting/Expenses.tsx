import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { Receipt, Plus } from 'lucide-react';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { toast } from '../../../store/toastStore';

export function Expenses() {
  const token = useAuthStore(state => state.token);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchExpenses();
    fetchAccounts();
  }, []);

  const fetchExpenses = async () => {
    const res = await fetch('/api/accounting/expenses', { headers: { Authorization: `Bearer ${token}` } });
    setExpenses(await res.json());
    setLoading(false);
  };

  const fetchAccounts = async () => {
    const res = await fetch('/api/accounting/accounts', { headers: { Authorization: `Bearer ${token}` } });
    setAccounts(await res.json());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/accounting/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount, accountId, paymentAccountId, description, date })
      });
      if (!res.ok) throw new Error('فشل تسجيل المصروف');
      
      setShowModal(false);
      setAmount(''); setDescription('');
      fetchExpenses();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const expenseAccounts = accounts.filter(a => a.type === 'EXPENSE');
  const paymentAccounts = accounts.filter(a => ['CASH', 'BANK'].includes(a.type));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="bg-rose-100 p-3 rounded-xl">
            <Receipt className="text-rose-600" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">سجل المصروفات</h1>
            <p className="text-sm text-slate-500">تسجيل المصاريف التشغيلية والإدارية (إيجار، كهرباء، رواتب...)</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center space-x-2 space-x-reverse bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
          <Plus size={20} />
          <span>تسجيل مصروف جديد</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="py-4 px-6 font-semibold text-slate-600">التاريخ</th>
              <th className="py-4 px-6 font-semibold text-slate-600">تصنيف المصروف (الحساب)</th>
              <th className="py-4 px-6 font-semibold text-slate-600">البيان</th>
              <th className="py-4 px-6 font-semibold text-slate-600">القيمة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan={4} className="p-8 text-center">جاري التحميل...</td></tr> : 
              expenses.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-slate-500">لا يوجد مصروفات مسجلة</td></tr> :
              expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-slate-50">
                  <td className="py-4 px-6 text-slate-600">{new Date(exp.date).toLocaleDateString('ar-EG')}</td>
                  <td className="py-4 px-6 font-bold text-slate-900">{exp.account.name}</td>
                  <td className="py-4 px-6 text-slate-600">{exp.description}</td>
                  <td className="py-4 px-6 font-bold text-rose-600">{exp.amount.toLocaleString()} ج.م</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-xl">سند صرف جديد</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">القيمة (ج.م)</label>
                <input required type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-4 py-2 border rounded-xl font-bold text-rose-600" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">بند المصروف</label>
                <SearchableSelect
                  options={expenseAccounts.map(a => ({ value: a.id, label: a.name }))}
                  value={accountId}
                  onChange={setAccountId}
                  placeholder="ابحث عن بند المصروف..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">حساب الدفع (الخزينة/البنك)</label>
                <SearchableSelect
                  options={paymentAccounts.map(a => ({ value: a.id, label: `${a.name} - (رصيد: ${a.balance.toLocaleString()} ج.م)` }))}
                  value={paymentAccountId}
                  onChange={setPaymentAccountId}
                  placeholder="ابحث عن حساب الدفع..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">البيان</label>
                <input required type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">التاريخ</label>
                <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <button type="submit" className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 mt-6">
                اعتماد وتسجيل في اليومية
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

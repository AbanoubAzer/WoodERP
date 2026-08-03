import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { Wallet, Plus, Building2, Landmark, ArrowLeftRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { toast } from '../../../store/toastStore';

export function TreasuryAccounts() {
  const token = useAuthStore(state => state.token);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [glAccounts, setGlAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Account Modal
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('CASH');
  const [branchId, setBranchId] = useState('');
  const [glAccountId, setGlAccountId] = useState('');
  const [balance, setBalance] = useState('0');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [accRes, brRes, glRes] = await Promise.all([
      fetch('/api/treasury/accounts', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/branches', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/accounting/accounts', { headers: { Authorization: `Bearer ${token}` } })
    ]);
    
    setAccounts(await accRes.json());
    setBranches(await brRes.json());
    
    // Only show Asset accounts for linking
    const allGl = await glRes.json();
    setGlAccounts(allGl.filter((a: any) => a.type === 'ASSET'));
    
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/treasury/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, type, branchId: branchId || null, glAccountId: glAccountId || null, balance })
      });
      if (!res.ok) throw new Error('فشل إنشاء الحساب');
      
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const totalCash = accounts.filter(a => a.type === 'CASH').reduce((sum, a) => sum + a.balance, 0);
  const totalBank = accounts.filter(a => a.type === 'BANK').reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="bg-emerald-100 p-3 rounded-xl">
            <Wallet className="text-emerald-600" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">الخزائن والبنوك (Treasury)</h1>
            <p className="text-sm text-slate-500">إدارة النقدية بالصندوق وحسابات البنوك</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link to="/treasury/transfer" className="flex items-center space-x-2 space-x-reverse bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-semibold transition-colors border border-slate-300">
            <ArrowLeftRight size={20} />
            <span>تحويل داخلي</span>
          </Link>
          <button onClick={() => setShowModal(true)} className="flex items-center space-x-2 space-x-reverse bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
            <Plus size={20} />
            <span>إضافة خزينة / بنك</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute -left-4 -top-4 opacity-10"><Wallet size={120} /></div>
          <p className="text-slate-400 font-bold mb-1 relative z-10">إجمالي النقدية (الخزائن)</p>
          <p className="text-4xl font-black text-emerald-400 relative z-10">{totalCash.toLocaleString()} <span className="text-lg">ج.م</span></p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute -left-4 -top-4 opacity-5"><Landmark size={120} className="text-indigo-900" /></div>
          <p className="text-slate-500 font-bold mb-1 relative z-10">إجمالي أرصدة البنوك</p>
          <p className="text-4xl font-black text-indigo-600 relative z-10">{totalBank.toLocaleString()} <span className="text-lg">ج.م</span></p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="py-4 px-6 font-semibold text-slate-600">اسم الخزينة / البنك</th>
              <th className="py-4 px-6 font-semibold text-slate-600">النوع</th>
              <th className="py-4 px-6 font-semibold text-slate-600">الفرع التابع له</th>
              <th className="py-4 px-6 font-semibold text-slate-600">الرصيد الحالي</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan={4} className="p-8 text-center text-slate-500">جاري التحميل...</td></tr> :
              accounts.map(acc => (
                <tr key={acc.id} className="hover:bg-slate-50">
                  <td className="py-4 px-6 font-bold text-slate-900 flex items-center gap-2">
                    {acc.type === 'CASH' ? <Wallet size={18} className="text-emerald-500"/> : <Landmark size={18} className="text-indigo-500"/>}
                    {acc.name}
                  </td>
                  <td className="py-4 px-6 text-slate-600">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${acc.type === 'CASH' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                      {acc.type === 'CASH' ? 'خزينة نقدية' : 'حساب بنكي'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-600 flex items-center gap-1">
                    {acc.branch ? <><Building2 size={16}/> {acc.branch.name}</> : <span className="text-slate-400">عام (بدون فرع)</span>}
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-900 text-lg">{acc.balance.toLocaleString()} ج.م</td>
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
              <h3 className="font-bold text-xl">إضافة حساب خزينة / بنك</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">اسم الحساب</label>
                <input required value={name} onChange={e => setName(e.target.value)} type="text" placeholder="مثال: خزينة المعرض الرئيسي" className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">نوع الخزينة</label>
                <SearchableSelect
                  options={[
                    { value: 'CASH', label: 'خزينة نقدية (صندوق)' },
                    { value: 'BANK', label: 'حساب بنكي' }
                  ]}
                  value={type}
                  onChange={setType}
                  placeholder="-- اختر النوع --"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">الفرع التابع له</label>
                <SearchableSelect
                  options={branches.map(b => ({ value: b.id, label: b.name }))}
                  value={branchId}
                  onChange={setBranchId}
                  placeholder="-- اختر الفرع --"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">ارتباط بحساب الأستاذ العام (GL) - اختياري</label>
                <SearchableSelect
                  options={glAccounts.map(a => ({ value: a.id, label: `${a.code} - ${a.name}` }))}
                  value={glAccountId}
                  onChange={setGlAccountId}
                  placeholder="-- اختر الحساب المالي --"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">الرصيد الافتتاحي (ج.م)</label>
                <input required type="number" min="0" value={balance} onChange={e => setBalance(e.target.value)} className="w-full px-4 py-2 border rounded-xl font-bold text-emerald-600" />
              </div>
              <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 mt-6 transition-colors">
                حفظ وإنشاء
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

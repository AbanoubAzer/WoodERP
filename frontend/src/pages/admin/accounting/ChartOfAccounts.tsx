import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { Network, Plus, Folder, FileText } from 'lucide-react';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { toast } from '../../../store/toastStore';

export function ChartOfAccounts() {
  const token = useAuthStore(state => state.token);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Account Modal State
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('ASSET');
  const [parentId, setParentId] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounting/accounts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAccounts(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/accounting/accounts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ code, name, type, parentId: parentId || null })
      });
      if (!res.ok) throw new Error('فشل إنشاء الحساب');
      
      setShowModal(false);
      setCode(''); setName(''); setParentId('');
      fetchAccounts();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Build tree
  const roots = accounts.filter(a => !a.parentId);

  const renderTree = (acc: any, level: number = 0) => {
    const children = accounts.filter(a => a.parentId === acc.id);
    const padding = level * 24;
    
    return (
      <React.Fragment key={acc.id}>
        <div className="flex items-center justify-between p-3 hover:bg-slate-50 border-b border-slate-100 transition-colors">
          <div className="flex items-center gap-3" style={{ paddingRight: `${padding}px` }}>
            {children.length > 0 ? <Folder size={18} className="text-orange-400" /> : <FileText size={18} className="text-slate-400" />}
            <span className="font-mono text-slate-500 font-bold">{acc.code}</span>
            <span className="font-bold text-slate-900">{acc.name}</span>
          </div>
          <div>
            <span className={`text-xs px-2 py-1 rounded font-bold ${
              acc.type === 'ASSET' ? 'bg-emerald-100 text-emerald-700' :
              acc.type === 'LIABILITY' ? 'bg-rose-100 text-rose-700' :
              acc.type === 'REVENUE' ? 'bg-indigo-100 text-indigo-700' :
              acc.type === 'EXPENSE' ? 'bg-orange-100 text-orange-700' :
              'bg-slate-100 text-slate-700'
            }`}>
              {acc.type === 'ASSET' ? 'أصول' :
               acc.type === 'LIABILITY' ? 'خصوم (التزامات)' :
               acc.type === 'REVENUE' ? 'إيرادات' :
               acc.type === 'EXPENSE' ? 'مصروفات' : 'حقوق ملكية'}
            </span>
          </div>
        </div>
        {children.map(child => renderTree(child, level + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="bg-indigo-100 p-3 rounded-xl">
            <Network className="text-indigo-600" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">شجرة الحسابات (Chart of Accounts)</h1>
            <p className="text-sm text-slate-500">الدليل المحاسبي لجميع الأصول، الخصوم، الإيرادات والمصروفات</p>
          </div>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 space-x-reverse bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          <Plus size={20} />
          <span>إضافة حساب جديد</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">جاري تحميل شجرة الحسابات...</div>
        ) : roots.length === 0 ? (
          <div className="p-12 text-center text-slate-500">لم يتم إعداد شجرة الحسابات بعد.</div>
        ) : (
          <div className="flex flex-col">
            <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
              <span className="font-bold text-slate-600">اسم الحساب / الرمز</span>
              <span className="font-bold text-slate-600">نوع الحساب</span>
            </div>
            {roots.map(root => renderTree(root))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-xl">إضافة حساب جديد</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">رقم / رمز الحساب</label>
                <input required value={code} onChange={e => setCode(e.target.value)} type="text" placeholder="مثال: 1001" className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">اسم الحساب</label>
                <input required value={name} onChange={e => setName(e.target.value)} type="text" placeholder="مثال: النقدية بالصندوق" className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">طبيعة الحساب</label>
                <SearchableSelect
                  options={[
                    { value: 'ASSET', label: 'أصول (Asset)' },
                    { value: 'LIABILITY', label: 'خصوم / التزامات (Liability)' },
                    { value: 'EQUITY', label: 'حقوق ملكية (Equity)' },
                    { value: 'REVENUE', label: 'إيرادات (Revenue)' },
                    { value: 'EXPENSE', label: 'مصروفات (Expense)' }
                  ]}
                  value={type}
                  onChange={setType}
                  placeholder="-- اختر الطبيعة --"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">الحساب الأب (اختياري)</label>
                <SearchableSelect
                  options={accounts.map(a => ({ value: a.id, label: `${a.code} - ${a.name}` }))}
                  value={parentId}
                  onChange={setParentId}
                  placeholder="-- اختر الحساب الأب --"
                />
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors mt-6">
                حفظ الحساب
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

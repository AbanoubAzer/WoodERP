import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { BookOpen, Plus, Save } from 'lucide-react';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { toast } from '../../../store/toastStore';

export function JournalEntries() {
  const token = useAuthStore(state => state.token);
  const [entries, setEntries] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showNew, setShowNew] = useState(false);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [lines, setLines] = useState([{ accountId: '', debit: 0, credit: 0, desc: '' }, { accountId: '', debit: 0, credit: 0, desc: '' }]);

  useEffect(() => {
    fetchEntries();
    fetchAccounts();
  }, []);

  const fetchEntries = async () => {
    const res = await fetch('/api/accounting/journal', { headers: { Authorization: `Bearer ${token}` } });
    setEntries(await res.json());
    setLoading(false);
  };
  
  const fetchAccounts = async () => {
    const res = await fetch('/api/accounting/accounts', { headers: { Authorization: `Bearer ${token}` } });
    setAccounts(await res.json());
  };

  const handleAddLine = () => {
    setLines([...lines, { accountId: '', debit: 0, credit: 0, desc: '' }]);
  };

  const handleLineChange = (index: number, field: string, value: any) => {
    const newLines = [...lines];
    (newLines[index] as any)[field] = value;
    setLines(newLines);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/accounting/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          description,
          date,
          lines: lines.map(l => ({ accountId: l.accountId, debit: Number(l.debit), credit: Number(l.credit), description: l.desc }))
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'فشل إنشاء القيد');
      }
      setShowNew(false);
      setLines([{ accountId: '', debit: 0, credit: 0, desc: '' }, { accountId: '', debit: 0, credit: 0, desc: '' }]);
      setDescription('');
      fetchEntries();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const totalDebit = lines.reduce((sum, l) => sum + Number(l.debit), 0);
  const totalCredit = lines.reduce((sum, l) => sum + Number(l.credit), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="bg-slate-100 p-3 rounded-xl">
            <BookOpen className="text-slate-700" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">دفتر اليومية العامة (Journal Entries)</h1>
            <p className="text-sm text-slate-500">القيود المحاسبية اليدوية والآلية (Debit / Credit)</p>
          </div>
        </div>
        <button onClick={() => setShowNew(!showNew)} className="flex items-center space-x-2 space-x-reverse bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
          <Plus size={20} />
          <span>{showNew ? 'إلغاء' : 'إنشاء قيد يدوي'}</span>
        </button>
      </div>

      {showNew && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold mb-4">إنشاء قيد يومية جديد</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold mb-2">التاريخ</label>
              <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">البيان (شرح القيد)</label>
              <input required type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden mb-4">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="p-3 w-1/3">الحساب (Account)</th>
                  <th className="p-3 w-1/4">البيان (ملاحظة)</th>
                  <th className="p-3 w-1/6">مدين (Debit)</th>
                  <th className="p-3 w-1/6">دائن (Credit)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {lines.map((line, i) => (
                  <tr key={i}>
                    <td className="p-2">
                      <SearchableSelect
                        options={accounts.map(a => ({ value: a.id, label: `${a.code} - ${a.name}` }))}
                        value={line.accountId}
                        onChange={(val) => handleLineChange(i, 'accountId', val)}
                        placeholder="اختر الحساب..."
                      />
                    </td>
                    <td className="p-2"><input type="text" value={line.desc} onChange={e => handleLineChange(i, 'desc', e.target.value)} className="w-full p-2 border rounded" placeholder="بيان السطر" /></td>
                    <td className="p-2"><input type="number" min="0" value={line.debit} onChange={e => handleLineChange(i, 'debit', e.target.value)} className="w-full p-2 border rounded text-orange-600 font-bold" /></td>
                    <td className="p-2"><input type="number" min="0" value={line.credit} onChange={e => handleLineChange(i, 'credit', e.target.value)} className="w-full p-2 border rounded text-indigo-600 font-bold" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-2 bg-slate-50 border-t flex justify-between items-center">
              <button type="button" onClick={handleAddLine} className="text-sm font-bold text-indigo-600">+ إضافة سطر جديد</button>
              <div className="flex gap-8 font-bold text-lg px-4">
                <span className={totalDebit === totalCredit ? 'text-emerald-600' : 'text-rose-600'}>إجمالي المدين: {totalDebit}</span>
                <span className={totalDebit === totalCredit ? 'text-emerald-600' : 'text-rose-600'}>إجمالي الدائن: {totalCredit}</span>
              </div>
            </div>
          </div>
          
          <button disabled={!isBalanced} type="submit" className={`flex items-center justify-center gap-2 w-full p-3 rounded-xl font-bold text-white transition-colors ${isBalanced ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-300 cursor-not-allowed'}`}>
            <Save size={20} /> اعتماد القيد المحاسبي
          </button>
        </form>
      )}

      <div className="space-y-4">
        {loading ? <div className="text-center p-8">جاري التحميل...</div> : entries.map(entry => (
          <div key={entry.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 p-4 border-b flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-900">{entry.description}</span>
                <span className="text-sm text-slate-500 mr-4">التاريخ: {new Date(entry.date).toLocaleDateString('ar-EG')}</span>
              </div>
              <span className="text-xs bg-white px-2 py-1 rounded shadow-sm font-mono text-slate-400">ID: {entry.id.slice(0, 8)}</span>
            </div>
            <div className="p-4">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="text-slate-400 border-b">
                    <th className="pb-2">رقم الحساب</th>
                    <th className="pb-2">اسم الحساب</th>
                    <th className="pb-2">مدين</th>
                    <th className="pb-2">دائن</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {entry.lines.map((l: any) => (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="py-2 font-mono text-slate-500">{l.account.code}</td>
                      <td className="py-2 font-bold text-slate-700">{l.account.name} {l.description && <span className="text-xs text-slate-400 font-normal">({l.description})</span>}</td>
                      <td className="py-2 font-bold text-orange-600">{l.debit > 0 ? l.debit.toLocaleString() : '-'}</td>
                      <td className="py-2 font-bold text-indigo-600">{l.credit > 0 ? l.credit.toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

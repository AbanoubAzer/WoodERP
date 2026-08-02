import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Building2, Plus, Edit2, CheckCircle, XCircle } from 'lucide-react';

export function Branches() {
  const token = useAuthStore(state => state.token);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({ name: '', address: '', phone: '' });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/branches', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setBranches(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/branches', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      setFormData({ name: '', address: '', phone: '' });
      setShowForm(false);
      fetchBranches();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const action = currentStatus === 'ACTIVE' ? 'deactivate' : 'activate';
    try {
      await fetch(`/api/branches/${id}/${action}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBranches();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="bg-[var(--color-brand-primary)]/10 p-3 rounded-xl">
            <Building2 className="text-[var(--color-brand-primary)]" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">إدارة الفروع</h1>
            <p className="text-sm text-slate-500">قم بإضافة وتعديل فروع الشركة والمخازن</p>
          </div>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 space-x-reverse bg-[var(--color-brand-sidebar)] hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          <Plus size={20} />
          <span>إضافة فرع جديد</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 mb-4">تفاصيل الفرع الجديد</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700">اسم الفرع</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)] focus:border-[var(--color-brand-primary)]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">العنوان</label>
              <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)] focus:border-[var(--color-brand-primary)]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">رقم الهاتف</label>
              <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)] focus:border-[var(--color-brand-primary)]" />
            </div>
            <div className="md:col-span-3 flex justify-end space-x-2 space-x-reverse mt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg font-semibold text-slate-600 hover:bg-slate-50">إلغاء</button>
              <button type="submit" className="px-4 py-2 bg-[var(--color-brand-primary)] text-white rounded-lg font-semibold hover:opacity-90">حفظ الفرع</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="py-4 px-6 font-semibold text-slate-600">اسم الفرع</th>
              <th className="py-4 px-6 font-semibold text-slate-600">العنوان</th>
              <th className="py-4 px-6 font-semibold text-slate-600">الهاتف</th>
              <th className="py-4 px-6 font-semibold text-slate-600">الحالة</th>
              <th className="py-4 px-6 font-semibold text-slate-600 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">جاري التحميل...</td></tr>
            ) : branches.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">لا توجد فروع مسجلة حتى الآن</td></tr>
            ) : (
              branches.map(branch => (
                <tr key={branch.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-900">{branch.name}</td>
                  <td className="py-4 px-6 text-slate-600">{branch.address || '-'}</td>
                  <td className="py-4 px-6 text-slate-600">{branch.phone || '-'}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${branch.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {branch.status === 'ACTIVE' ? 'نشط' : 'معطل'}
                    </span>
                  </td>
                  <td className="py-4 px-6 flex justify-center space-x-2 space-x-reverse">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => toggleStatus(branch.id, branch.status)}
                      className={`p-2 rounded-lg transition-colors ${branch.status === 'ACTIVE' ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                    >
                      {branch.status === 'ACTIVE' ? <XCircle size={18} /> : <CheckCircle size={18} />}
                    </button>
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

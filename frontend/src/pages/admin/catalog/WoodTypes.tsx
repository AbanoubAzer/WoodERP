import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { TreePine, Plus, Edit2, Trash2 } from 'lucide-react';

export function WoodTypes() {
  const token = useAuthStore(state => state.token);
  const [woodTypes, setWoodTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', species: '', originCountry: '', grade: '' });

  useEffect(() => {
    fetchWoodTypes();
  }, []);

  const fetchWoodTypes = async () => {
    try {
      const res = await fetch('/api/wood-types', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setWoodTypes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/wood-types', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      setFormData({ name: '', species: '', originCountry: '', grade: '' });
      setShowForm(false);
      fetchWoodTypes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    try {
      await fetch(`/api/wood-types/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchWoodTypes();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="bg-[var(--color-brand-primary)]/10 p-3 rounded-xl">
            <TreePine className="text-[var(--color-brand-primary)]" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">أنواع الأخشاب</h1>
            <p className="text-sm text-slate-500">إدارة أنواع الأخشاب، الفصائل، وبلد المنشأ (مثل: زان روماني)</p>
          </div>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 space-x-reverse bg-[var(--color-brand-sidebar)] hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          <Plus size={20} />
          <span>إضافة نوع جديد</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 mb-4">تفاصيل النوع</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700">الاسم التجاري</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)] focus:border-[var(--color-brand-primary)]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">الفصيلة (Species)</label>
              <input type="text" value={formData.species} onChange={e => setFormData({...formData, species: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)] focus:border-[var(--color-brand-primary)]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">بلد المنشأ</label>
              <input type="text" value={formData.originCountry} onChange={e => setFormData({...formData, originCountry: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)] focus:border-[var(--color-brand-primary)]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">الجودة (Grade)</label>
              <input type="text" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)] focus:border-[var(--color-brand-primary)]" />
            </div>
            <div className="md:col-span-2 flex justify-end space-x-2 space-x-reverse mt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg font-semibold text-slate-600 hover:bg-slate-50">إلغاء</button>
              <button type="submit" className="px-4 py-2 bg-[var(--color-brand-primary)] text-white rounded-lg font-semibold hover:opacity-90">حفظ النوع</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="py-4 px-6 font-semibold text-slate-600">الاسم التجاري</th>
              <th className="py-4 px-6 font-semibold text-slate-600">الفصيلة</th>
              <th className="py-4 px-6 font-semibold text-slate-600">المنشأ</th>
              <th className="py-4 px-6 font-semibold text-slate-600">الجودة</th>
              <th className="py-4 px-6 font-semibold text-slate-600 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">جاري التحميل...</td></tr>
            ) : woodTypes.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">لا توجد أنواع أخشاب مسجلة</td></tr>
            ) : (
              woodTypes.map(type => (
                <tr key={type.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-900">{type.name}</td>
                  <td className="py-4 px-6 text-slate-600">{type.species || '-'}</td>
                  <td className="py-4 px-6 text-slate-600">{type.originCountry || '-'}</td>
                  <td className="py-4 px-6 text-slate-600">{type.grade || '-'}</td>
                  <td className="py-4 px-6 flex justify-center space-x-2 space-x-reverse">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(type.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                      <Trash2 size={18} />
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

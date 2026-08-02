import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Shield, Plus, Edit2, Trash2 } from 'lucide-react';

const AVAILABLE_PERMISSIONS = [
  'CREATE_INVOICE', 'EDIT_INVOICE', 'DELETE_INVOICE', 'VIEW_REPORTS',
  'CREATE_PRODUCT', 'EDIT_PRODUCT', 'DELETE_PRODUCT', 'VIEW_PRODUCTS',
  'MANAGE_USERS', 'MANAGE_ROLES', 'MANAGE_SETTINGS'
];

export function Roles() {
  const token = useAuthStore(state => state.token);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', permissions: [] as string[] });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/roles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setRoles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/roles', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      setFormData({ name: '', description: '', permissions: [] });
      setShowForm(false);
      fetchRoles();
    } catch (err) {
      console.error(err);
    }
  };

  const togglePermission = (perm: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm]
    }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    try {
      await fetch(`/api/roles/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRoles();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="bg-[var(--color-brand-primary)]/10 p-3 rounded-xl">
            <Shield className="text-[var(--color-brand-primary)]" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">إدارة الصلاحيات (الأدوار)</h1>
            <p className="text-sm text-slate-500">إدارة أدوار المستخدمين وصلاحيات الوصول لكل دور</p>
          </div>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 space-x-reverse bg-[var(--color-brand-sidebar)] hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          <Plus size={20} />
          <span>إضافة دور جديد</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 mb-4">تفاصيل الدور الجديد</h2>
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">اسم الدور</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">الوصف</label>
                <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)]" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">تحديد الصلاحيات الممنوحة</label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {AVAILABLE_PERMISSIONS.map(perm => (
                  <label key={perm} className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.permissions.includes(perm)}
                      onChange={() => togglePermission(perm)}
                      className="w-4 h-4 rounded border-slate-300 text-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)]"
                    />
                    <span className="text-sm text-slate-600 font-mono">{perm}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2 space-x-reverse mt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg font-semibold text-slate-600 hover:bg-slate-50">إلغاء</button>
              <button type="submit" className="px-4 py-2 bg-[var(--color-brand-primary)] text-white rounded-lg font-semibold hover:opacity-90">حفظ الدور</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="py-4 px-6 font-semibold text-slate-600">اسم الدور</th>
              <th className="py-4 px-6 font-semibold text-slate-600">الوصف</th>
              <th className="py-4 px-6 font-semibold text-slate-600">عدد المستخدمين</th>
              <th className="py-4 px-6 font-semibold text-slate-600">عدد الصلاحيات</th>
              <th className="py-4 px-6 font-semibold text-slate-600 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">جاري التحميل...</td></tr>
            ) : roles.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">لا توجد أدوار مسجلة</td></tr>
            ) : (
              roles.map(role => (
                <tr key={role.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-900 flex items-center space-x-2 space-x-reverse">
                    <span>{role.name}</span>
                    {role.isDefault && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold">افتراضي</span>}
                  </td>
                  <td className="py-4 px-6 text-slate-600">{role.description || '-'}</td>
                  <td className="py-4 px-6 text-slate-600 font-bold">{role._count?.users || 0}</td>
                  <td className="py-4 px-6 text-slate-600">
                    <span className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-600">
                      {(role.permissions || []).length} صلاحية
                    </span>
                  </td>
                  <td className="py-4 px-6 flex justify-center space-x-2 space-x-reverse">
                    {!role.isDefault && (
                      <button onClick={() => handleDelete(role.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
                    )}
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

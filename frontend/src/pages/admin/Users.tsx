import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { Users as UsersIcon, Plus, UserPlus, CheckCircle, XCircle, Key } from 'lucide-react';

export function Users() {
  const token = useAuthStore(state => state.token);
  const addToast = useToastStore(state => state.addToast);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Employee' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      setFormData({ name: '', email: '', password: '', role: 'Employee' });
      setShowForm(false);
      addToast({ title: 'تم إضافة الموظف بنجاح', type: 'success' });
      fetchUsers();
    } catch (err) {
      addToast({ title: 'حدث خطأ أثناء إضافة الموظف', type: 'error' });
      console.error(err);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const action = currentStatus === 'ACTIVE' ? 'deactivate' : 'activate';
    try {
      await fetch(`/api/users/${id}/${action}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      addToast({ title: currentStatus === 'ACTIVE' ? 'تم تعطيل الحساب' : 'تم تفعيل الحساب', type: 'success' });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const changePassword = async (id: string) => {
    const newPassword = prompt('أدخل كلمة المرور الجديدة لهذا الحساب:');
    if (!newPassword) return;
    
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ password: newPassword })
      });
      if (res.ok) {
        addToast({ title: 'تم تغيير كلمة المرور بنجاح', type: 'success' });
      } else {
        addToast({ title: 'فشل تغيير كلمة المرور', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      addToast({ title: 'فشل تغيير كلمة المرور', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="bg-[var(--color-brand-primary)]/10 p-3 rounded-xl">
            <UsersIcon className="text-[var(--color-brand-primary)]" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">إدارة المستخدمين</h1>
            <p className="text-sm text-slate-500">قم بدعوة وإدارة موظفي الشركة وصلاحياتهم</p>
          </div>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 space-x-reverse bg-[var(--color-brand-sidebar)] hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          <UserPlus size={20} />
          <span>إضافة موظف جديد</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 mb-4">بيانات الموظف الجديد</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700">اسم الموظف</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)] focus:border-[var(--color-brand-primary)]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">البريد الإلكتروني</label>
              <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)] focus:border-[var(--color-brand-primary)]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">كلمة المرور المؤقتة</label>
              <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)] focus:border-[var(--color-brand-primary)]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">الدور (الصلاحية)</label>
              <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)] focus:border-[var(--color-brand-primary)] bg-white">
                <option value="Employee">موظف مبيعات</option>
                <option value="Manager">مدير فرع</option>
                <option value="Accountant">محاسب</option>
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end space-x-2 space-x-reverse mt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg font-semibold text-slate-600 hover:bg-slate-50">إلغاء</button>
              <button type="submit" className="px-4 py-2 bg-[var(--color-brand-primary)] text-white rounded-lg font-semibold hover:opacity-90">إرسال الدعوة</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="py-4 px-6 font-semibold text-slate-600">الموظف</th>
              <th className="py-4 px-6 font-semibold text-slate-600">البريد الإلكتروني</th>
              <th className="py-4 px-6 font-semibold text-slate-600">الدور</th>
              <th className="py-4 px-6 font-semibold text-slate-600">الحالة</th>
              <th className="py-4 px-6 font-semibold text-slate-600 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">جاري التحميل...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">لا يوجد موظفين مسجلين</td></tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-900">{user.name}</td>
                  <td className="py-4 px-6 text-slate-600">{user.email}</td>
                  <td className="py-4 px-6 text-slate-600">{user.role?.name || 'موظف'}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {user.status === 'ACTIVE' ? 'نشط' : 'معطل'}
                    </span>
                  </td>
                  <td className="py-4 px-6 flex justify-center space-x-2 space-x-reverse">
                    {user.isOwner ? (
                      <span className="text-xs text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded">مدير النظام</span>
                    ) : (
                      <>
                        <button 
                          onClick={() => changePassword(user.id)}
                          className="p-2 rounded-lg transition-colors text-blue-600 hover:bg-blue-50"
                          title="تغيير كلمة المرور"
                        >
                          <Key size={18} />
                        </button>
                        <button 
                          onClick={() => toggleStatus(user.id, user.status)}
                          className={`p-2 rounded-lg transition-colors ${user.status === 'ACTIVE' ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                          title={user.status === 'ACTIVE' ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                        >
                          {user.status === 'ACTIVE' ? <XCircle size={18} /> : <CheckCircle size={18} />}
                        </button>
                      </>
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

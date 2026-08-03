import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { Building2, Plus, CheckCircle, XCircle } from 'lucide-react';

export function SystemCompanies() {
  const token = useAuthStore(state => state.token);
  const addToast = useToastStore(state => state.addToast);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    companyName: '',
    ownerName: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/system/companies', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('فشل في جلب البيانات');
      const data = await res.json();
      setCompanies(data);
    } catch (err) {
      console.error(err);
      addToast({ title: 'حدث خطأ أثناء جلب الشركات', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/system/companies', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'فشل في التسجيل');
      }

      setFormData({ companyName: '', ownerName: '', email: '', password: '' });
      setShowForm(false);
      addToast({ title: 'تم تسجيل الشركة بنجاح', type: 'success' });
      fetchCompanies();
    } catch (err: any) {
      addToast({ title: err.message, type: 'error' });
      console.error(err);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (!window.confirm(`هل أنت متأكد من ${newStatus === 'ACTIVE' ? 'تفعيل' : 'إيقاف'} هذه الشركة؟`)) return;

    try {
      const res = await fetch(`/api/system/companies/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!res.ok) throw new Error('فشل في تحديث الحالة');

      addToast({ title: newStatus === 'ACTIVE' ? 'تم تفعيل الشركة' : 'تم إيقاف الشركة', type: 'success' });
      fetchCompanies();
    } catch (err) {
      console.error(err);
      addToast({ title: 'فشل تغيير حالة الشركة', type: 'error' });
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
            <h1 className="text-2xl font-bold text-slate-900">إدارة النظام والشركات</h1>
            <p className="text-sm text-slate-500">خاص بمدير النظام (Super Admin) - إدارة اشتراكات الشركات</p>
          </div>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 space-x-reverse bg-[var(--color-brand-sidebar)] hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          <Plus size={20} />
          <span>إنشاء شركة جديدة</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 mb-4">بيانات الشركة الجديدة</h2>
          <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700">اسم الشركة</label>
              <input type="text" required value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)] focus:border-[var(--color-brand-primary)]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">اسم المالك</label>
              <input type="text" required value={formData.ownerName} onChange={e => setFormData({...formData, ownerName: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)] focus:border-[var(--color-brand-primary)]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">البريد الإلكتروني (المدير)</label>
              <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)] focus:border-[var(--color-brand-primary)]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">كلمة المرور المبدئية</label>
              <input type="password" required minLength={6} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)] focus:border-[var(--color-brand-primary)]" />
            </div>
            <div className="md:col-span-2 flex justify-end space-x-2 space-x-reverse mt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg font-semibold text-slate-600 hover:bg-slate-50">إلغاء</button>
              <button type="submit" className="px-4 py-2 bg-[var(--color-brand-primary)] text-white rounded-lg font-semibold hover:opacity-90">تسجيل الشركة</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="py-4 px-6 font-semibold text-slate-600">كود الشركة</th>
              <th className="py-4 px-6 font-semibold text-slate-600">اسم الشركة</th>
              <th className="py-4 px-6 font-semibold text-slate-600">المالك</th>
              <th className="py-4 px-6 font-semibold text-slate-600">تاريخ التسجيل</th>
              <th className="py-4 px-6 font-semibold text-slate-600">الحالة</th>
              <th className="py-4 px-6 font-semibold text-slate-600 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-500">جاري التحميل...</td></tr>
            ) : companies.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-500">لا يوجد شركات مسجلة</td></tr>
            ) : (
              companies.map(company => {
                const owner = company.users?.[0]; // We queried for isOwner=true
                return (
                  <tr key={company.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900">{company.code}</td>
                    <td className="py-4 px-6 font-semibold text-slate-900">{company.name}</td>
                    <td className="py-4 px-6 text-slate-600">
                      <div>{owner?.name || 'غير معروف'}</div>
                      <div className="text-xs text-slate-400">{owner?.email}</div>
                    </td>
                    <td className="py-4 px-6 text-slate-600">{new Date(company.createdAt).toLocaleDateString('ar-EG')}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${company.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {company.status === 'ACTIVE' ? 'نشط' : 'موقوف'}
                      </span>
                    </td>
                    <td className="py-4 px-6 flex justify-center space-x-2 space-x-reverse">
                      <button 
                        onClick={() => toggleStatus(company.id, company.status)}
                        className={`p-2 rounded-lg transition-colors ${company.status === 'ACTIVE' ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                        title={company.status === 'ACTIVE' ? 'إيقاف الشركة' : 'تفعيل الشركة'}
                      >
                        {company.status === 'ACTIVE' ? <XCircle size={18} /> : <CheckCircle size={18} />}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

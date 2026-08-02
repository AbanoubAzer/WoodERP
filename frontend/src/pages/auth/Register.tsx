import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { TreePine } from 'lucide-react';

export function Register() {
  const [formData, setFormData] = useState({
    companyName: '',
    ownerName: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/register-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'فشل التسجيل');
      
      setSuccess('تم تسجيل الشركة بنجاح! جاري تحويلك لتسجيل الدخول...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-[var(--color-brand-bg)] flex flex-col justify-center py-12 sm:px-6 lg:px-8" dir="rtl">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="bg-[var(--color-brand-primary)] p-4 rounded-2xl shadow-xl mb-4">
          <TreePine className="text-white" size={40} />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900">تسجيل شركة جديدة</h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          لديك حساب بالفعل؟ <Link to="/login" className="font-medium text-[var(--color-brand-primary)] hover:text-orange-500">قم بتسجيل الدخول</Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-xl sm:px-10 border border-slate-200">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 font-bold text-center">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg text-sm border border-emerald-100 font-bold text-center">
                {success}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700">اسم الشركة</label>
              <input type="text" name="companyName" required value={formData.companyName} onChange={handleChange} className="mt-1 block w-full px-3 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-[var(--color-brand-primary)] focus:border-[var(--color-brand-primary)] sm:text-sm" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">اسم المالك (المدير)</label>
              <input type="text" name="ownerName" required value={formData.ownerName} onChange={handleChange} className="mt-1 block w-full px-3 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-[var(--color-brand-primary)] focus:border-[var(--color-brand-primary)] sm:text-sm" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">البريد الإلكتروني</label>
              <input type="email" name="email" required value={formData.email} onChange={handleChange} className="mt-1 block w-full px-3 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-[var(--color-brand-primary)] focus:border-[var(--color-brand-primary)] sm:text-sm" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">كلمة المرور</label>
              <input type="password" name="password" required value={formData.password} onChange={handleChange} className="mt-1 block w-full px-3 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-[var(--color-brand-primary)] focus:border-[var(--color-brand-primary)] sm:text-sm" />
            </div>

            <div>
              <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-hover)] transition-colors">
                إنشاء حساب الشركة
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

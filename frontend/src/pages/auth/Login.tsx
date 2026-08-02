import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { TreePine } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'فشل تسجيل الدخول');
      
      login(data.access_token, data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-brand-bg)] flex flex-col justify-center py-12 sm:px-6 lg:px-8" dir="rtl">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="bg-[var(--color-brand-primary)] p-4 rounded-2xl shadow-xl mb-4">
          <TreePine className="text-white" size={40} />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900">تسجيل الدخول</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-xl sm:px-10 border border-slate-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 font-bold text-center">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-slate-700">البريد الإلكتروني</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[var(--color-brand-primary)] focus:border-[var(--color-brand-primary)] sm:text-sm transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">كلمة المرور</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[var(--color-brand-primary)] focus:border-[var(--color-brand-primary)] sm:text-sm transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember-me" type="checkbox" className="h-4 w-4 text-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)] border-slate-300 rounded" />
                <label htmlFor="remember-me" className="mr-2 block text-sm text-slate-900 font-medium">تذكرني</label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-slate-600 hover:text-[var(--color-brand-primary)]">نسيت كلمة المرور؟</a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-[var(--color-brand-sidebar)] hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-colors"
              >
                دخول
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

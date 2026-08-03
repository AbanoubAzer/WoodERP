import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { toast } from '../../store/toastStore';

export function Settings() {
  const token = useAuthStore(state => state.token);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/company-settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch('/api/company-settings', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(settings)
      });
      toast.success('تم حفظ الإعدادات بنجاح');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <div className="p-8 text-center">جاري تحميل الإعدادات...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="bg-[var(--color-brand-primary)]/10 p-3 rounded-xl">
            <SettingsIcon className="text-[var(--color-brand-primary)]" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">إعدادات الشركة</h1>
            <p className="text-sm text-slate-500">إدارة العملة، الضرائب، والسنة المالية</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <form onSubmit={handleSave} className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Fiscal Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 border-b pb-2">الإعدادات المالية</h3>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700">العملة الافتراضية</label>
                <select 
                  value={settings.currency} 
                  onChange={e => setSettings({...settings, currency: e.target.value})}
                  className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)] bg-white"
                >
                  <option value="EGP">جنيه مصري (EGP)</option>
                  <option value="USD">دولار أمريكي (USD)</option>
                  <option value="SAR">ريال سعودي (SAR)</option>
                  <option value="EUR">يورو (EUR)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">نسبة ضريبة القيمة المضافة (VAT %)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={settings.vatPercent} 
                  onChange={e => setSettings({...settings, vatPercent: parseFloat(e.target.value)})}
                  className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">دقة العلامة العشرية</label>
                <input 
                  type="number" 
                  value={settings.decimalPrecision} 
                  onChange={e => setSettings({...settings, decimalPrecision: parseInt(e.target.value)})}
                  className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">السنة المالية</label>
                <select 
                  value={settings.fiscalYear} 
                  onChange={e => setSettings({...settings, fiscalYear: e.target.value})}
                  className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)] bg-white"
                >
                  <option value="JAN-DEC">يناير - ديسمبر</option>
                  <option value="JUL-JUN">يوليو - يونيو</option>
                  <option value="APR-MAR">أبريل - مارس</option>
                </select>
              </div>
            </div>

            {/* Regional Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 border-b pb-2">الإعدادات الإقليمية والنظام</h3>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700">المنطقة الزمنية</label>
                <select 
                  value={settings.timeZone} 
                  onChange={e => setSettings({...settings, timeZone: e.target.value})}
                  className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)] bg-white"
                >
                  <option value="Africa/Cairo">أفريقيا / القاهرة (Africa/Cairo)</option>
                  <option value="Asia/Riyadh">آسيا / الرياض (Asia/Riyadh)</option>
                  <option value="Asia/Dubai">آسيا / دبي (Asia/Dubai)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">تنسيق التاريخ</label>
                <select 
                  value={settings.dateFormat} 
                  onChange={e => setSettings({...settings, dateFormat: e.target.value})}
                  className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)] bg-white"
                >
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">نمط ترقيم الفواتير</label>
                <input 
                  type="text" 
                  value={settings.invoiceNumbering} 
                  onChange={e => setSettings({...settings, invoiceNumbering: e.target.value})}
                  className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)]"
                />
                <p className="text-xs text-slate-500 mt-1">مثال: INV-{'{YYYY}'}-{'{0000}'}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button 
              type="submit" 
              disabled={saving}
              className="flex items-center space-x-2 space-x-reverse px-6 py-3 bg-[var(--color-brand-primary)] text-white rounded-lg font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Save size={20} />
              <span>{saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { UserPlus, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { toast } from '../../../store/toastStore';
import { Spinner } from '../../../components/ui/Spinner';

export function NewCustomer() {
  const token = useAuthStore(state => state.token);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  
  React.useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const res = await fetch('/api/warehouses', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setWarehouses(data);
    } catch (err) {
      console.error(err);
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    companyName: '',
    taxNumber: '',
    category: 'RETAIL',
    creditLimit: 0,
    paymentTerms: 'CASH',
    openingBalance: 0,
    warehouseId: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          ...formData,
          creditLimit: parseFloat(formData.creditLimit.toString()),
          openingBalance: parseFloat(formData.openingBalance.toString()),
          warehouseId: formData.warehouseId || undefined
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'حدث خطأ أثناء إضافة العميل');
      }

      toast.success('تم تسجيل العميل بنجاح!');
      navigate('/customers');
    } catch (err: any) {
      console.error(err);
      toast.error('خطأ في التسجيل', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 space-x-reverse bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="bg-indigo-100 p-3 rounded-xl">
          <UserPlus className="text-indigo-700" size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">تسجيل عميل جديد</h1>
          <p className="text-sm text-slate-500">إدخال البيانات الأساسية، المالية، والرصيد الافتتاحي</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 border-b pb-2">البيانات الأساسية</h3>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">اسم العميل (مطلوب)</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)]" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">رقم الجوال</label>
                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)]" dir="ltr" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">العنوان</label>
                <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)]" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">اسم الشركة (إن وجد)</label>
                <input type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)]" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">الرقم الضريبي</label>
                <input type="text" value={formData.taxNumber} onChange={e => setFormData({...formData, taxNumber: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)]" />
              </div>
            </div>

            {/* Financial Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 border-b pb-2">البيانات المالية</h3>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">تصنيف العميل</label>
                <SearchableSelect
                  options={[
                    { value: 'RETAIL', label: 'تجزئة' },
                    { value: 'WHOLESALE', label: 'جملة' },
                    { value: 'VIP', label: 'مميز' }
                  ]}
                  value={formData.category}
                  onChange={(val) => setFormData({...formData, category: val})}
                  placeholder="-- اختر التصنيف --"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">المخزن المرتبط</label>
                <SearchableSelect
                  options={warehouses.map(w => ({ value: w.id, label: w.name }))}
                  value={formData.warehouseId}
                  onChange={(val) => setFormData({...formData, warehouseId: val})}
                  placeholder="-- اختر المخزن (اختياري) --"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">شروط الدفع المتفق عليها</label>
                <SearchableSelect
                  options={[
                    { value: 'CASH', label: 'نقدي فقط' },
                    { value: 'CREDIT_15', label: 'آجل 15 يوم' },
                    { value: 'CREDIT_30', label: 'آجل 30 يوم' }
                  ]}
                  value={formData.paymentTerms}
                  onChange={(val) => setFormData({...formData, paymentTerms: val})}
                  placeholder="-- اختر شروط الدفع --"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">الحد الائتماني (0 = بدون حد)</label>
                <input type="number" min="0" value={formData.creditLimit} onChange={e => setFormData({...formData, creditLimit: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)]" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">الرصيد الافتتاحي (مديونية حالية)</label>
                <input type="number" min="0" value={formData.openingBalance} onChange={e => setFormData({...formData, openingBalance: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)] bg-rose-50" />
                <p className="text-xs text-slate-500 mt-1">المبلغ المتبقي على العميل قبل استخدام النظام</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-slate-100">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex items-center space-x-2 space-x-reverse px-8 py-3 bg-[var(--color-brand-primary)] text-white rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? <Spinner size="sm" color="text-white" /> : <Save size={20} />}
              <span>{isSubmitting ? 'جاري الحفظ...' : 'حفظ بيانات العميل'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

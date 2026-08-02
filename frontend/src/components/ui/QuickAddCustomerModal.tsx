import React, { useState } from 'react';
import { X, Save, UserPlus } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../store/toastStore';

interface QuickAddCustomerModalProps {
  onClose: () => void;
  onSuccess: (customer: any) => void;
}

export function QuickAddCustomerModal({ onClose, onSuccess }: QuickAddCustomerModalProps) {
  const token = useAuthStore(state => state.token);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    code: '',
    address: '',
    balance: 0,
    category: 'RETAIL',
    paymentTerms: 'CASH',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const newCustomer = await res.json();
        onSuccess(newCustomer);
      } else {
      toast.error('حدث خطأ أثناء إضافة العميل');
      }
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء إضافة العميل');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3 text-emerald-700">
            <UserPlus size={24} />
            <h2 className="text-xl font-bold">إضافة عميل سريع</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">اسم العميل *</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500/20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">رقم الهاتف</label>
              <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">كود العميل</label>
              <input type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="اختياري" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500/20" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">العنوان</label>
            <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500/20" />
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors">إلغاء</button>
            <button type="submit" disabled={loading} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2">
              <Save size={20} />
              {loading ? 'جاري الحفظ...' : 'حفظ وإضافة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

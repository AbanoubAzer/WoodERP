import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { CreditCard, Plus, Edit, Trash2, Power, Search, Save, X } from 'lucide-react';
import { toast } from '../../../store/toastStore';

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  requiresReference: boolean;
}

export function PaymentMethodsSettings() {
  const token = useAuthStore((state) => state.token);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'CASH',
    isActive: true,
    requiresReference: false
  });

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/payment-methods', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('فشل جلب طرق الدفع');
      const data = await res.json();
      setMethods(data);
    } catch (error: any) {
      toast.error('خطأ', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (method?: PaymentMethod) => {
    if (method) {
      setEditingMethod(method);
      setFormData({
        name: method.name,
        type: method.type,
        isActive: method.isActive,
        requiresReference: method.requiresReference
      });
    } else {
      setEditingMethod(null);
      setFormData({
        name: '',
        type: 'CASH',
        isActive: true,
        requiresReference: false
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('تنبيه', 'يرجى كتابة اسم طريقة الدفع');
      return;
    }

    try {
      const url = editingMethod ? `/api/payment-methods/${editingMethod.id}` : '/api/payment-methods';
      const method = editingMethod ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error('فشل حفظ طريقة الدفع');
      
      toast.success(editingMethod ? 'تم تعديل طريقة الدفع بنجاح' : 'تم إضافة طريقة الدفع بنجاح');
      setIsModalOpen(false);
      fetchMethods();
    } catch (error: any) {
      toast.error('خطأ', error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف طريقة الدفع هذه؟ لن تتمكن من التراجع عن هذا الإجراء.')) return;
    
    try {
      const res = await fetch(`/api/payment-methods/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('فشل حذف طريقة الدفع');
      
      toast.success('تم حذف طريقة الدفع بنجاح');
      fetchMethods();
    } catch (error: any) {
      toast.error('خطأ', error.message);
    }
  };

  const toggleStatus = async (method: PaymentMethod) => {
    try {
      const res = await fetch(`/api/payment-methods/${method.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ ...method, isActive: !method.isActive })
      });
      
      if (!res.ok) throw new Error('فشل تغيير الحالة');
      toast.success(`تم ${method.isActive ? 'تعطيل' : 'تفعيل'} وسيلة الدفع`);
      fetchMethods();
    } catch (error: any) {
      toast.error('خطأ', error.message);
    }
  };

  const filteredMethods = methods.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="bg-indigo-100 p-3 rounded-xl">
            <CreditCard className="text-indigo-700" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">طرق السداد (Payment Methods)</h1>
            <p className="text-sm text-slate-500">إدارة البوابات وطرق الدفع المتاحة في فواتير المبيعات والمشتريات</p>
          </div>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-2 space-x-reverse bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold transition-colors"
        >
          <Plus size={20} />
          <span>إضافة طريقة سداد</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute right-3 top-2.5 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="بحث عن طريقة الدفع..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="py-4 px-6 font-semibold text-slate-600">طريقة السداد</th>
                <th className="py-4 px-6 font-semibold text-slate-600 text-center">النوع (Type)</th>
                <th className="py-4 px-6 font-semibold text-slate-600 text-center">رقم مرجعي إلزامي؟</th>
                <th className="py-4 px-6 font-semibold text-slate-600 text-center">الحالة</th>
                <th className="py-4 px-6 font-semibold text-slate-600 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">جاري التحميل...</td>
                </tr>
              ) : filteredMethods.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <p className="text-lg mb-2">لا توجد طرق سداد مسجلة</p>
                    <button onClick={() => handleOpenModal()} className="text-indigo-600 font-bold hover:underline">أضف طريقة سداد الآن</button>
                  </td>
                </tr>
              ) : (
                filteredMethods.map((method) => (
                  <tr key={method.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${
                          method.type === 'CASH' ? 'bg-emerald-100 text-emerald-700' : 
                          method.type === 'BANK_TRANSFER' ? 'bg-blue-100 text-blue-700' : 
                          method.type === 'DIGITAL_WALLET' ? 'bg-purple-100 text-purple-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {method.name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-900">{method.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-mono font-bold">
                        {method.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {method.requiresReference ? (
                        <span className="text-indigo-600 font-bold text-sm bg-indigo-50 px-2 py-1 rounded">نعم (إلزامي)</span>
                      ) : (
                        <span className="text-slate-400 text-sm">لا</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button 
                        onClick={() => toggleStatus(method)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                        method.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}>
                        <Power size={12} className="mr-1 ml-1" />
                        {method.isActive ? 'نشط' : 'معطل'}
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenModal(method)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(method.id)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">
                {editingMethod ? 'تعديل طريقة سداد' : 'إضافة طريقة سداد جديدة'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">اسم طريقة السداد <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="مثال: نقدي، البنك الأهلي، InstaPay"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">النوع / التصنيف</label>
                <select 
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-mono text-slate-700"
                >
                  <option value="CASH">نقدي (CASH)</option>
                  <option value="BANK_TRANSFER">تحويل بنكي (BANK_TRANSFER)</option>
                  <option value="DIGITAL_WALLET">محفظة إلكترونية (DIGITAL_WALLET)</option>
                  <option value="CHEQUE">شيك (CHEQUE)</option>
                  <option value="OTHER">أخرى (OTHER)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <input 
                  type="checkbox" 
                  id="requiresReference"
                  checked={formData.requiresReference}
                  onChange={e => setFormData({...formData, requiresReference: e.target.checked})}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="requiresReference" className="text-sm font-bold text-slate-700 cursor-pointer">
                  تتطلب رقم مرجعي؟ (Reference Number)
                  <p className="text-xs text-slate-500 font-normal mt-0.5">إذا تم التفعيل، سيطلب النظام كتابة رقم التحويل أو المحفظة عند الدفع.</p>
                </label>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={formData.isActive}
                  onChange={e => setFormData({...formData, isActive: e.target.checked})}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isActive" className="text-sm font-bold text-slate-700 cursor-pointer">
                  تفعيل الطريقة (Active)
                </label>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="submit" className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-2">
                  <Save size={20} />
                  <span>حفظ البيانات</span>
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

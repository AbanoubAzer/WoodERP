import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { ArrowRightLeft, Save } from 'lucide-react';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { toast } from '../../../store/toastStore';
import { useNavigate } from 'react-router-dom';

export function StockTransfer() {
  const token = useAuthStore(state => state.token);
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    fromWarehouseId: '',
    toWarehouseId: '',
    variantId: '',
    quantity: 1,
    reason: 'Internal Transfer'
  });

  useEffect(() => {
    fetchWarehouses();
    fetchProducts();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const res = await fetch('/api/warehouses', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setWarehouses(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setProducts(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fromWarehouseId || !formData.toWarehouseId || !formData.variantId) {
      toast.warning('الرجاء تعبئة جميع الحقول المطلوبة');
      return;
    }
    if (formData.fromWarehouseId === formData.toWarehouseId) {
      toast.warning('يجب أن يكون المخزن المحول منه مختلفاً عن المخزن المحول إليه');
      return;
    }

    try {
      const response = await fetch('/api/stock-transactions/transfer', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          fromWarehouseId: formData.fromWarehouseId,
          toWarehouseId: formData.toWarehouseId,
          variantId: formData.variantId,
          quantity: parseFloat(formData.quantity.toString()),
          reason: formData.reason
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'حدث خطأ أثناء نقل البضاعة');
      }

      toast.success('تم نقل البضاعة بنجاح!');
      navigate('/inventory');
    } catch (err: any) {
      console.error(err);
      toast.error('خطأ', err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 space-x-reverse bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="bg-indigo-100 p-3 rounded-xl">
          <ArrowRightLeft className="text-indigo-700" size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">تحويل مخزني داخلي</h1>
          <p className="text-sm text-slate-500">نقل البضاعة بين المستودعات والفروع داخل الشركة</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          {warehouses.length <= 1 ? (
            <div className="p-6 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 text-center font-bold">
              عفواً، لا يمكن إجراء تحويل مخزني لعدم وجود أكثر من مخزن واحد في النظام.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">من المخزن (المصدر)</label>
                <SearchableSelect
                  options={warehouses.map(w => ({ value: w.id, label: w.name }))}
                  value={formData.fromWarehouseId}
                  onChange={(val) => setFormData({...formData, fromWarehouseId: val})}
                  placeholder="ابحث عن مخزن..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">إلى المخزن (الوجهة)</label>
                <SearchableSelect
                  options={warehouses.map(w => ({ value: w.id, label: w.name }))}
                  value={formData.toWarehouseId}
                  onChange={(val) => setFormData({...formData, toWarehouseId: val})}
                  placeholder="ابحث عن مخزن..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">المنتج (الصنف والمقاس)</label>
                <SearchableSelect
                  options={products.flatMap(p => 
                    (p.variants || []).map((v: any) => ({
                      value: v.id,
                      label: `${p.name} - مقاس: ${v.thickness}×${v.width}×${v.length}`
                    }))
                  )}
                  value={formData.variantId}
                  onChange={(val) => setFormData({...formData, variantId: val})}
                  placeholder="ابحث عن صنف أو مقاس..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">الكمية المحولة (بالوحدة)</label>
                <input type="number" required min="0.01" step="any" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)]" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">سبب التحويل (اختياري)</label>
                <input type="text" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} placeholder="مثال: تغذية مخزن الفرع" className="w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)]" />
              </div>
            </div>
          )}

          {warehouses.length > 1 && (
            <div className="flex justify-end pt-6 border-t border-slate-100">
              <button type="submit" className="flex items-center space-x-2 space-x-reverse px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors">
                <Save size={20} />
                <span>تأكيد التحويل</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

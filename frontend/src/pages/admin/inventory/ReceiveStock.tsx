import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { ArrowDownToLine, Save } from 'lucide-react';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';

export function ReceiveStock() {
  const token = useAuthStore(state => state.token);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    warehouseId: '',
    variantId: '',
    quantity: 1,
    reason: 'New Purchase'
  });

  useEffect(() => {
    fetchWarehouses();
    fetchProducts();
  }, []);

  const fetchWarehouses = async () => {
    const res = await fetch('/api/warehouses', { headers: { Authorization: `Bearer ${token}` } });
    setWarehouses(await res.json());
  };

  const fetchProducts = async () => {
    const res = await fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } });
    setProducts(await res.json());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/stock-transactions/receive', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          warehouseId: formData.warehouseId,
          variantId: formData.variantId,
          quantity: parseFloat(formData.quantity.toString()),
          reason: formData.reason
        })
      });
      alert('تم استلام البضاعة وإضافتها للرصيد بنجاح!');
      setFormData({ ...formData, quantity: 1, variantId: '' });
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء استلام البضاعة');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 space-x-reverse bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="bg-emerald-100 p-3 rounded-xl">
          <ArrowDownToLine className="text-emerald-700" size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">إذن استلام بضاعة</h1>
          <p className="text-sm text-slate-500">إضافة كميات جديدة لرصيد المخزن</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">المخزن المستلم</label>
              <SearchableSelect
                options={warehouses.map(w => ({ value: w.id, label: w.name }))}
                value={formData.warehouseId}
                onChange={(val) => setFormData({...formData, warehouseId: val})}
                placeholder="ابحث عن مخزن..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">سبب الاستلام</label>
              <SearchableSelect
                options={[
                  { value: 'New Purchase', label: 'شراء جديد (مورد)' },
                  { value: 'Customer Return', label: 'مرتجع عميل' },
                  { value: 'Initial Stock', label: 'رصيد افتتاحي' }
                ]}
                value={formData.reason}
                onChange={(val) => setFormData({...formData, reason: val})}
                placeholder="-- اختر السبب --"
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
              <label className="block text-sm font-semibold text-slate-700 mb-2">الكمية المستلمة (بالوحدة)</label>
              <input type="number" required min="0.01" step="0.01" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value)})} className="w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)]" />
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-slate-100">
            <button type="submit" className="flex items-center space-x-2 space-x-reverse px-6 py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors">
              <Save size={20} />
              <span>تأكيد الاستلام</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

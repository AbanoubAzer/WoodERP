import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { Box, Save, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '../../../store/toastStore';
import { Spinner } from '../../../components/ui/Spinner';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';

export function NewProduct() {
  const token = useAuthStore(state => state.token);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [woodTypes, setWoodTypes] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    woodTypeId: '',
    brand: '',
    description: '',
    baseUnit: 'PIECE',
  });

  const [variants, setVariants] = useState<any[]>([
    { sku: '', barcode: '', thickness: '', width: '', length: '', purchasePrice: 0, retailPrice: 0, wholesalePrice: 0 }
  ]);

  useEffect(() => {
    fetchCategories();
    fetchWoodTypes();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const list = await res.json();
        setCategories(list);
        // Auto default to 'أخشاب'
        const woodCat = list.find((c: any) => c.name.includes('أخشاب') || c.name.includes('خشب'));
        if (woodCat) {
          setFormData(prev => ({ ...prev, categoryId: prev.categoryId || woodCat.id }));
        } else if (list.length > 0) {
          setFormData(prev => ({ ...prev, categoryId: prev.categoryId || list[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWoodTypes = async () => {
    try {
      const res = await fetch('/api/wood-types', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const list = await res.json();
        setWoodTypes(list);
        const woodTypeObj = list.find((w: any) => w.name.includes('أخشاب') || w.name.includes('خشب') || w.name.includes('موسكي') || w.name.includes('زوايا'));
        if (woodTypeObj) {
          setFormData(prev => ({ ...prev, woodTypeId: prev.woodTypeId || woodTypeObj.id }));
        } else if (list.length > 0) {
          setFormData(prev => ({ ...prev, woodTypeId: prev.woodTypeId || list[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addVariant = () => {
    setVariants([...variants, { sku: '', barcode: '', thickness: '', width: '', length: '', purchasePrice: 0, retailPrice: 0, wholesalePrice: 0 }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let activeCatId = formData.categoryId;
    let activeWoodTypeId = formData.woodTypeId;

    // Auto-create/select 'أخشاب' category if not selected
    if (!activeCatId) {
      const existing = categories.find((c: any) => c.name.includes('أخشاب') || c.name.includes('خشب'));
      if (existing) {
        activeCatId = existing.id;
      } else {
        try {
          const createRes = await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ name: 'أخشاب' })
          });
          if (createRes.ok) {
            const newCat = await createRes.json();
            activeCatId = newCat.id;
          }
        } catch (err) {
          console.error('Failed to auto-create category أخشاب', err);
        }
      }
    }

    if (!activeCatId && categories.length > 0) {
      activeCatId = categories[0].id;
    }

    setIsSubmitting(true);
    try {
      // Clean up variants to numbers
      const formattedVariants = variants.map(v => ({
        ...v,
        thickness: v.thickness ? parseFloat(v.thickness) : undefined,
        width: v.width ? parseFloat(v.width) : undefined,
        length: v.length ? parseFloat(v.length) : undefined,
        purchasePrice: parseFloat(v.purchasePrice.toString()) || 0,
        retailPrice: parseFloat(v.retailPrice.toString()) || 0,
        wholesalePrice: parseFloat(v.wholesalePrice.toString()) || 0
      }));

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          ...formData,
          categoryId: activeCatId,
          woodTypeId: activeWoodTypeId || undefined,
          variants: formattedVariants
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'حدث خطأ أثناء إضافة المنتج');
      }

      toast.success('تم إضافة المنتج بنجاح!');
      navigate('/products');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center space-x-3 space-x-reverse bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="bg-[var(--color-brand-primary)]/10 p-3 rounded-xl">
          <Box className="text-[var(--color-brand-primary)]" size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">إضافة منتج جديد</h1>
          <p className="text-sm text-slate-500">إدخال البيانات الأساسية والمقاسات والأسعار للمنتج الجديد</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 border-b pb-2 mb-6">البيانات الأساسية</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">اسم المنتج (مطلوب)</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)]" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">الفئة (مطلوب)</label>
              <SearchableSelect
                options={categories.map(c => ({ value: c.id, label: c.name }))}
                value={formData.categoryId}
                onChange={val => setFormData({...formData, categoryId: val})}
                placeholder="اختر الفئة..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">نوع الخشب</label>
              <SearchableSelect
                options={woodTypes.map(w => ({ value: w.id, label: w.name }))}
                value={formData.woodTypeId}
                onChange={val => setFormData({...formData, woodTypeId: val})}
                placeholder="اختر نوع الخشب..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">العلامة التجارية / الماركة</label>
              <input type="text" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)]" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">الوحدة الأساسية</label>
              <select 
                value={formData.baseUnit} 
                onChange={e => setFormData({...formData, baseUnit: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)] bg-white"
              >
                <option value="PIECE">قطعة (PIECE)</option>
                <option value="METER">متر (METER)</option>
                <option value="SQM">متر مربع (SQM)</option>
                <option value="CUBIC_METER">متر مكعب (CUBIC_METER)</option>
                <option value="SHEET">لوح (SHEET)</option>
                <option value="BUNDLE">رزمة (BUNDLE)</option>
              </select>
            </div>

            <div className="lg:col-span-3">
              <label className="block text-sm font-semibold text-slate-700 mb-2">وصف تفصيلي</label>
              <textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-[var(--color-brand-primary)]"></textarea>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center border-b pb-2 mb-6">
            <h3 className="text-lg font-bold text-slate-900">المقاسات (المتغيرات) والأسعار</h3>
            <button type="button" onClick={addVariant} className="flex items-center gap-1 text-sm font-bold text-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 px-3 py-1.5 rounded-lg hover:bg-[var(--color-brand-primary)]/20 transition-colors">
              <Plus size={16} />
              <span>إضافة مقاس</span>
            </button>
          </div>

          <div className="space-y-6">
            {variants.map((variant, index) => (
              <div key={index} className="p-5 border border-slate-200 bg-slate-50 rounded-xl relative">
                {variants.length > 1 && (
                  <button type="button" onClick={() => removeVariant(index)} className="absolute top-4 left-4 text-rose-500 hover:text-rose-700 p-1 bg-white rounded-md shadow-sm border border-slate-200">
                    <Trash2 size={16} />
                  </button>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">SKU (رمز الصنف)</label>
                    <input type="text" required placeholder="مثال: W-100-2" value={variant.sku} onChange={e => updateVariant(index, 'sku', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">الباركود</label>
                    <input type="text" value={variant.barcode} onChange={e => updateVariant(index, 'barcode', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  
                  <div className="col-span-1 lg:col-span-2 grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">السماكة (ملم/سم)</label>
                      <input type="number" step="0.01" value={variant.thickness} onChange={e => updateVariant(index, 'thickness', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">العرض (ملم/سم)</label>
                      <input type="number" step="0.01" value={variant.width} onChange={e => updateVariant(index, 'width', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">الطول (ملم/سم)</label>
                      <input type="number" step="0.01" value={variant.length} onChange={e => updateVariant(index, 'length', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-emerald-700 mb-1">سعر الشراء المتوقع</label>
                    <input type="number" step="0.01" required value={variant.purchasePrice} onChange={e => updateVariant(index, 'purchasePrice', e.target.value)} className="w-full px-3 py-2 border border-emerald-200 bg-emerald-50 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-blue-700 mb-1">سعر البيع (قطاعي)</label>
                    <input type="number" step="0.01" required value={variant.retailPrice} onChange={e => updateVariant(index, 'retailPrice', e.target.value)} className="w-full px-3 py-2 border border-blue-200 bg-blue-50 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-indigo-700 mb-1">سعر البيع (جملة)</label>
                    <input type="number" step="0.01" required value={variant.wholesalePrice} onChange={e => updateVariant(index, 'wholesalePrice', e.target.value)} className="w-full px-3 py-2 border border-indigo-200 bg-indigo-50 rounded-lg text-sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4 space-x-reverse sticky bottom-6 bg-white p-4 rounded-2xl shadow-lg border border-slate-200 z-10">
          <button type="button" onClick={() => navigate('/products')} className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition-colors">
            إلغاء
          </button>
          <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-8 py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50">
            {isSubmitting ? <Spinner size="sm" /> : <Save size={20} />}
            <span>حفظ المنتج</span>
          </button>
        </div>
      </form>
    </div>
  );
}

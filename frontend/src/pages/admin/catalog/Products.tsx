import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { Box, Plus, Search } from 'lucide-react';

export function Products() {
  const token = useAuthStore(state => state.token);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="bg-[var(--color-brand-primary)]/10 p-3 rounded-xl">
            <Box className="text-[var(--color-brand-primary)]" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">سجل المنتجات (الكتالوج)</h1>
            <p className="text-sm text-slate-500">إدارة المنتجات، المقاسات (المتغيرات)، والأسعار</p>
          </div>
        </div>
        <button 
          className="flex items-center space-x-2 space-x-reverse bg-[var(--color-brand-sidebar)] hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          <Plus size={20} />
          <span>منتج جديد</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden p-6">
        <div className="relative mb-6">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="بحث برقم SKU، اسم المنتج، أو الباركود..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-[var(--color-brand-primary)]/20"
          />
        </div>

        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="py-4 px-6 font-semibold text-slate-600">المنتج الأساسي</th>
              <th className="py-4 px-6 font-semibold text-slate-600">الفئة</th>
              <th className="py-4 px-6 font-semibold text-slate-600">عدد المقاسات (المتغيرات)</th>
              <th className="py-4 px-6 font-semibold text-slate-600">وحدة القياس الأساسية</th>
              <th className="py-4 px-6 font-semibold text-slate-600">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-500">جاري التحميل...</td></tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <Box size={48} className="text-slate-300" />
                    <p className="text-slate-500 text-lg font-semibold">لا توجد منتجات حتى الآن</p>
                    <p className="text-slate-400 text-sm">قم بإضافة منتجاتك لتبدأ في إدارة المخزون والمبيعات</p>
                  </div>
                </td>
              </tr>
            ) : (
              products.filter(prod => 
                (prod.name?.toLowerCase()?.includes(searchTerm.toLowerCase())) ||
                (prod.variants?.some((v: any) => v.sku?.toLowerCase()?.includes(searchTerm.toLowerCase())))
              ).map(prod => (
                <tr key={prod.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                  <td className="py-4 px-6 font-semibold text-slate-900">{prod.name}</td>
                  <td className="py-4 px-6 text-slate-600">{prod.category?.name || '-'}</td>
                  <td className="py-4 px-6 text-slate-600">
                    <span className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-600">
                      {prod.variants?.length || 0} مقاسات
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-600">{prod.baseUnit}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${prod.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {prod.status === 'ACTIVE' ? 'نشط' : 'معطل'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { Warehouse as WarehouseIcon, Plus, MapPin } from 'lucide-react';

export function Warehouses() {
  const token = useAuthStore(state => state.token);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const res = await fetch('/api/warehouses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setWarehouses(data);
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
            <WarehouseIcon className="text-[var(--color-brand-primary)]" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">المخازن ومواقع التخزين</h1>
            <p className="text-sm text-slate-500">إدارة المستودعات، الأرفف، ومناطق التخزين</p>
          </div>
        </div>
        <button 
          className="flex items-center space-x-2 space-x-reverse bg-[var(--color-brand-sidebar)] hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          <Plus size={20} />
          <span>مخزن جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-500">جاري التحميل...</div>
        ) : warehouses.length === 0 ? (
          <div className="col-span-full py-12 text-center">
            <WarehouseIcon size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 text-lg font-semibold">لا توجد مخازن مسجلة</p>
          </div>
        ) : (
          warehouses.map(wh => (
            <div key={wh.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <WarehouseIcon className="text-slate-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{wh.name}</h3>
                    <div className="flex items-center space-x-1 space-x-reverse text-sm text-slate-500 mt-1">
                      <MapPin size={14} />
                      <span>{wh.branch?.name || 'الفرع الرئيسي'}</span>
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold ${wh.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {wh.status === 'ACTIVE' ? 'نشط' : 'معطل'}
                </span>
              </div>
              
              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">أمين المخزن</p>
                  <p className="text-sm font-semibold text-slate-800">{wh.manager?.name || 'غير محدد'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">مناطق التخزين</p>
                  <p className="text-sm font-semibold text-slate-800">{wh.locations?.length || 0} منطقة</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

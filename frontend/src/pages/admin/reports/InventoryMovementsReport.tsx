import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { Package, ArrowDownToLine, ArrowUpFromLine, Filter, Search, FileText, AlertTriangle } from 'lucide-react';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import { toast } from '../../../store/toastStore';

interface InventoryItem {
  variantId: string;
  productId: string;
  productName: string;
  code: string;
  category: string;
  inflow: number;
  outflow: number;
  currentStock: number;
  unit: string;
}

interface ItemLedgerRecord {
  id: string;
  date: string;
  type: string;
  quantity: number;
  referenceId: string | null;
  reason: string | null;
  fromWarehouse: string | null;
  toWarehouse: string | null;
  customerName?: string | null;
  supplierName?: string | null;
}

export function InventoryMovementsReport() {
  const token = useAuthStore((state) => state.token);
  
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal State
  const [selectedVariant, setSelectedVariant] = useState<InventoryItem | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerRecords, setLedgerRecords] = useState<ItemLedgerRecord[]>([]);

  useEffect(() => {
    // Default to this month
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    setStartDate(formatDate(firstDay));
    setEndDate(formatDate(lastDay));
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchReportData();
    }
  }, [startDate, endDate]);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reports/inventory-movements?startDate=${startDate}&endDate=${endDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('فشل جلب التقرير');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error('خطأ', err.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchItemLedger = async (variantId: string) => {
    try {
      setLedgerLoading(true);
      const res = await fetch(`/api/reports/inventory-movements/${variantId}?startDate=${startDate}&endDate=${endDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('فشل جلب تفاصيل الحركة');
      const data = await res.json();
      setLedgerRecords(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error('خطأ', err.message);
      setLedgerRecords([]);
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleRowClick = (item: InventoryItem) => {
    setSelectedVariant(item);
    fetchItemLedger(item.variantId);
  };

  const safeItems = Array.isArray(items) ? items : [];
  const filteredItems = safeItems.filter(item => 
    item.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMovementTypeName = (type: string) => {
    switch(type) {
      case 'RECEIVE': return 'وارد (شراء / تسليم)';
      case 'ISSUE': return 'منصرف (مبيعات / صرف)';
      case 'ADJUST': return 'تسوية جردية';
      case 'TRANSFER': return 'نقل بين المخازن';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="bg-emerald-100 p-3 rounded-xl">
            <Package className="text-emerald-700" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">حركة المخزون الشاملة</h1>
            <p className="text-sm text-slate-500">تتبع الوارد والمنصرف والرصيد الفعلي للأصناف</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => window.print()} className="flex items-center space-x-2 space-x-reverse bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-semibold hover:bg-slate-50 transition-colors">
            <FileText size={20} />
            <span>طباعة التقرير</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex gap-2 w-full md:w-auto">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1">من تاريخ</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500/20 text-sm font-bold"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1">إلى تاريخ</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500/20 text-sm font-bold"
              />
            </div>
          </div>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute right-3 top-2.5 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="بحث بالكود أو اسم الصنف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={8} cols={5} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="py-4 px-6 font-semibold text-slate-600">الصنف / المنتج</th>
                  <th className="py-4 px-6 font-semibold text-slate-600">التصنيف</th>
                  <th className="py-4 px-6 font-semibold text-slate-600 text-center text-emerald-700 bg-emerald-50/50">الوارد (Inflow)</th>
                  <th className="py-4 px-6 font-semibold text-slate-600 text-center text-rose-700 bg-rose-50/50">المنصرف (Outflow)</th>
                  <th className="py-4 px-6 font-semibold text-slate-600 text-center bg-slate-100/50">الرصيد الفعلي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">لا توجد حركات في هذه الفترة أو لم يتم العثور على نتائج</td>
                  </tr>
                ) : (
                  filteredItems.map(item => (
                    <tr 
                      key={item.variantId} 
                      className="hover:bg-slate-50 cursor-pointer transition-colors group"
                      onClick={() => handleRowClick(item)}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
                            <Package className="text-emerald-600" size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{item.productName}</p>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">{item.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-emerald-600 bg-emerald-50/10">
                        {item.inflow > 0 ? (
                          <div className="flex items-center justify-center gap-1">
                            <ArrowDownToLine size={16} />
                            <span>{item.inflow.toLocaleString()} {item.unit}</span>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-rose-600 bg-rose-50/10">
                        {item.outflow > 0 ? (
                          <div className="flex items-center justify-center gap-1">
                            <ArrowUpFromLine size={16} />
                            <span>{item.outflow.toLocaleString()} {item.unit}</span>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="py-4 px-6 text-center bg-slate-50/30">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full font-bold text-sm ${
                          item.currentStock <= 5 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {item.currentStock <= 5 && <AlertTriangle size={14} className="ml-1.5" />}
                          {item.currentStock.toLocaleString()} {item.unit}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Item Ledger Modal */}
      {selectedVariant && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-800">كشف حساب حركة الصنف</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold text-emerald-700">{selectedVariant.productName}</span>
                  <span className="text-xs text-slate-500 font-mono">({selectedVariant.code})</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedVariant(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {ledgerLoading ? (
                <TableSkeleton rows={4} cols={4} />
              ) : ledgerRecords.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-500 text-lg">لا توجد حركات مسجلة لهذا الصنف في هذه الفترة</p>
                </div>
              ) : (
                <div className="relative border-r-2 border-slate-100 pr-6 mr-3">
                  {ledgerRecords.map((record, idx) => {
                    const isInflow = record.type === 'RECEIVE' || (record.type === 'ADJUST' && record.quantity > 0);
                    const isOutflow = record.type === 'ISSUE' || (record.type === 'ADJUST' && record.quantity < 0);
                    
                    return (
                      <div key={record.id} className="mb-8 relative">
                        {/* Timeline dot */}
                        <div className={`absolute -right-[31px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm ${
                          isInflow ? 'bg-emerald-500' : isOutflow ? 'bg-rose-500' : 'bg-blue-500'
                        }`}></div>
                        
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-500 mb-1">
                                {new Date(record.date).toLocaleString('ar-EG')}
                              </span>
                              <span className={`text-sm font-bold px-2 py-1 rounded-md inline-block ${
                                isInflow ? 'bg-emerald-50 text-emerald-700' : 
                                isOutflow ? 'bg-rose-50 text-rose-700' : 
                                'bg-blue-50 text-blue-700'
                              }`}>
                                {getMovementTypeName(record.type)}
                              </span>
                            </div>
                            <div className="text-left">
                              <span className={`text-xl font-black ${
                                isInflow ? 'text-emerald-600' : 
                                isOutflow ? 'text-rose-600' : 
                                'text-blue-600'
                              }`}>
                                {isInflow ? '+' : isOutflow ? '-' : ''}{Math.abs(record.quantity).toLocaleString()}
                              </span>
                              <span className="text-xs text-slate-500 mr-1">{selectedVariant.unit}</span>
                            </div>
                          </div>
                          
                          {(record.referenceId || record.reason || record.fromWarehouse || record.toWarehouse || record.customerName || record.supplierName) && (
                            <div className="mt-3 pt-3 border-t border-slate-50 text-sm text-slate-600 grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                              {record.fromWarehouse && (
                                <div className="col-span-2 md:col-span-1">
                                  <span className="block text-xs font-bold text-slate-400 mb-1">من مخزن</span>
                                  <span className="font-medium">{record.fromWarehouse}</span>
                                </div>
                              )}
                              {record.toWarehouse && (
                                <div className="col-span-2 md:col-span-1">
                                  <span className="block text-xs font-bold text-slate-400 mb-1">إلى مخزن</span>
                                  <span className="font-medium">{record.toWarehouse}</span>
                                </div>
                              )}
                              {record.referenceId && (
                                <div className="col-span-2 md:col-span-1">
                                  <span className="block text-xs font-bold text-slate-400 mb-1">المرجع</span>
                                  <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">{record.referenceId.slice(0, 8)}...</span>
                                </div>
                              )}
                              {record.customerName && (
                                <div className="col-span-2 md:col-span-1">
                                  <span className="block text-xs font-bold text-slate-400 mb-1">جهة منصرف (عميل)</span>
                                  <span className="font-bold text-indigo-700">{record.customerName}</span>
                                </div>
                              )}
                              {record.supplierName && (
                                <div className="col-span-2 md:col-span-1">
                                  <span className="block text-xs font-bold text-slate-400 mb-1">جهة وارد (مورد)</span>
                                  <span className="font-bold text-emerald-700">{record.supplierName}</span>
                                </div>
                              )}
                              {record.reason && (
                                <div className="col-span-full">
                                  <span className="block text-xs font-bold text-slate-400 mb-1">البيان / السبب</span>
                                  <span>{record.reason}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 text-left">
              <button 
                onClick={() => setSelectedVariant(null)}
                className="px-6 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

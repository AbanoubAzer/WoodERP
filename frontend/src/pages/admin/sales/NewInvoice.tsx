import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { Receipt, Save, Plus, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { QuickAddCustomerModal } from '../../../components/ui/QuickAddCustomerModal';
import { toast } from '../../../store/toastStore';

export function NewInvoice() {
  const token = useAuthStore(state => state.token);
  const navigate = useNavigate();
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [discount, setDiscount] = useState(0);

  const [treasuryAccounts, setTreasuryAccounts] = useState<any[]>([]);
  const [amountPaid, setAmountPaid] = useState(0);
  const [treasuryAccountId, setTreasuryAccountId] = useState('');
  
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [warehouseId, setWarehouseId] = useState('');
  
  const [createInstallments, setCreateInstallments] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState(3);
  const [interestRate, setInterestRate] = useState(0);
  const [installmentMode, setInstallmentMode] = useState<'DATED' | 'UNDATED'>('DATED');
  const [customInstallments, setCustomInstallments] = useState<{ id: number; dueDate: string; amount: number }[]>([]);

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const totalAmount = subtotal - discount;

  // Auto-generate installments when basic parameters change
  useEffect(() => {
    if (!createInstallments) return;
    const remaining = totalAmount - amountPaid;
    if (remaining <= 0) return;
    
    const totalWithInterest = remaining * (1 + interestRate / 100);
    const amountPerInstallment = totalWithInterest / installmentsCount;
    
    const newInstallments = [];
    const baseDate = new Date();
    baseDate.setMonth(baseDate.getMonth() + 1);
    
    for (let i = 0; i < installmentsCount; i++) {
      const d = new Date(baseDate);
      d.setMonth(d.getMonth() + i);
      newInstallments.push({
        id: i + 1,
        dueDate: installmentMode === 'DATED' ? d.toISOString().split('T')[0] : '',
        amount: Number(amountPerInstallment.toFixed(2))
      });
    }
    setCustomInstallments(newInstallments);
  }, [createInstallments, installmentsCount, interestRate, totalAmount, amountPaid, installmentMode]);

  const updateCustomInstallment = (index: number, field: string, value: any) => {
    const updated = [...customInstallments];
    updated[index] = { ...updated[index], [field]: value };
    setCustomInstallments(updated);
  };

  useEffect(() => {
    fetchCustomers();
    fetchInventory();
    fetchTreasuryAccounts();
    fetchWarehouses();
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const res = await fetch('/api/payment-methods', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        const active = data.filter((m: any) => m.isActive);
        setPaymentMethods(active);
        if (active.length > 0) {
          setPaymentMethodId(active[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await fetch('/api/warehouses', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setWarehouses(data);
        if (data.length === 1) {
          setWarehouseId(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setCustomers(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleCustomerAdded = (newCustomer: any) => {
    setCustomers(prev => [...prev, newCustomer]);
    setCustomerId(newCustomer.id);
    setShowAddCustomer(false);
  };

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/inventory/balance', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setInventory(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTreasuryAccounts = async () => {
    try {
      const res = await fetch('/api/treasury/accounts', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setTreasuryAccounts(data);
        if (data.length > 0) setTreasuryAccountId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addItem = () => {
    setItems([...items, { inventoryStockId: '', quantity: 1, unitPrice: 0 }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    // Auto-fill price if stock is selected
    if (field === 'inventoryStockId') {
      const stock = inventory.find(i => i.id === value);
      if (stock) {
        newItems[index].unitPrice = stock.variant.retailPrice;
        newItems[index].variantId = stock.variantId;
        newItems[index].warehouseId = stock.warehouseId;
      }
    }
    
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || items.length === 0) { toast.warning('الرجاء اختيار عميل وإضافة منتجات'); return; }

    try {
      const response = await fetch('/api/sales/invoice', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          customerId,
          warehouseId: warehouseId || undefined,
          discount,
          amountPaid,
          treasuryAccountId,
          paymentMethodId,
          paymentReference,
          createInstallments,
          installmentsCount,
          interestRate,
          customInstallments,
          items: items.map(item => ({
            variantId: item.variantId,
            warehouseId: item.warehouseId,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice)
          }))
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'حدث خطأ أثناء إنشاء الفاتورة');
      }

      toast.success('تم إنشاء الفاتورة بنجاح!');
      navigate('/sales/invoices');
    } catch (err: any) {
      console.error(err);
      toast.error('خطأ في إنشاء الفاتورة', err.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 space-x-reverse bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="bg-emerald-100 p-3 rounded-xl">
          <Receipt className="text-emerald-700" size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">إنشاء فاتورة مبيعات جديدة</h1>
          <p className="text-sm text-slate-500">خصم المخزون وتسجيل المديونية تلقائياً</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-slate-700">اختر العميل</label>
                <button 
                  type="button"
                  onClick={() => setShowAddCustomer(true)}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded"
                >
                  <Plus size={14} /> إضافة عميل جديد
                </button>
              </div>
              <SearchableSelect
                options={customers.map(c => ({ value: c.id, label: `${c.name} - (كود: ${c.code}) - الرصيد: ${c.balance} ج.م` }))}
                value={customerId}
                onChange={setCustomerId}
                placeholder="ابحث عن عميل..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">اختر المخزن (للفاتورة ككل)</label>
              {warehouses.length === 1 ? (
                <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-semibold cursor-not-allowed">
                  {warehouses[0].name}
                </div>
              ) : (
                <SearchableSelect
                  options={warehouses.map(w => ({ value: w.id, label: w.name }))}
                  value={warehouseId}
                  onChange={setWarehouseId}
                  placeholder="-- اختر المخزن (اختياري) --"
                />
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-lg font-bold text-slate-900">الأصناف</h3>
              <button type="button" onClick={addItem} className="text-emerald-600 font-bold flex items-center gap-1 hover:bg-emerald-50 px-3 py-1 rounded-lg">
                <Plus size={18} /> إضافة صنف
              </button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="flex gap-4 items-end bg-slate-50 p-4 rounded-xl">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">الصنف والمستودع</label>
                  <SearchableSelect
                    options={inventory.map(inv => ({ 
                      value: inv.id, 
                      label: `${inv.variant?.product?.name} (${inv.variant?.size}) - مستودع ${inv.warehouse?.name} - متوفر ${inv.physicalQty}` 
                    }))}
                    value={item.inventoryStockId}
                    onChange={(val) => updateItem(index, 'inventoryStockId', val)}
                    placeholder="ابحث عن صنف أو مستودع..."
                  />
                </div>
                <div className="w-32">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">الكمية</label>
                  <input type="number" min="0.01" step="any" required value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-center" />
                </div>
                <div className="w-32">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">سعر الوحدة</label>
                  <input type="number" min="0" step="any" required value={item.unitPrice} onChange={e => updateItem(index, 'unitPrice', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-center" />
                </div>
                <div className="w-32">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">الإجمالي</label>
                  <div className="w-full px-3 py-2 bg-white border border-transparent text-center font-bold text-slate-700">
                    {(item.quantity * item.unitPrice).toLocaleString()}
                  </div>
                </div>
                <button type="button" onClick={() => removeItem(index)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg mb-1">
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-6 border-t border-slate-100">
            <div className="w-64 space-y-3">
              <div className="flex justify-between text-slate-600">
                <span>المجموع الفرعي:</span>
                <span className="font-bold">{subtotal.toLocaleString()} ج.م</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>الخصم:</span>
                <input type="number" min="0" step="any" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="w-24 px-2 py-1 border rounded text-center" />
              </div>
              <div className="flex justify-between text-xl font-black text-emerald-700 pt-3 border-t border-emerald-100">
                <span>الإجمالي:</span>
                <span>{totalAmount.toLocaleString()} ج.م</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 space-y-6">
            <h3 className="text-lg font-bold text-slate-900">الدفع والأقساط</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">طريقة السداد / الدفع</label>
                  <select
                    value={paymentMethodId}
                    onChange={(e) => setPaymentMethodId(e.target.value)}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500/20 bg-white font-semibold text-slate-800"
                  >
                    {paymentMethods.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">المبلغ المدفوع الآن (مقدم)</label>
                  <input type="number" min="0" step="any" max={totalAmount} value={amountPaid} onChange={e => setAmountPaid(Number(e.target.value))} className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500/20 bg-white" />
                </div>

                {amountPaid > 0 && (
                  <>
                    {paymentMethods.find(m => m.id === paymentMethodId)?.requiresReference && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">رقم المرجع (التحويل/المحفظة)</label>
                        <input
                          type="text"
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                          className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500/20 bg-white"
                          placeholder="مثال: رقم تحويل InstaPay"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">حساب الخزينة / البنك</label>
                      <SearchableSelect
                        options={treasuryAccounts.map(t => ({ value: t.id, label: `${t.name} (الرصيد: ${t.balance})` }))}
                        value={treasuryAccountId}
                        onChange={setTreasuryAccountId}
                        placeholder="اختر الخزينة..."
                      />
                    </div>
                  </>
                )}
              </div>
              
              <div className="space-y-4 border-r border-slate-200 pr-6">
                <label className="flex items-center space-x-3 space-x-reverse cursor-pointer">
                  <input type="checkbox" checked={createInstallments} onChange={e => setCreateInstallments(e.target.checked)} className="w-5 h-5 text-emerald-600 rounded" />
                  <span className="text-sm font-semibold text-slate-700">تحويل باقي المبلغ لأقساط</span>
                </label>
                
                {createInstallments && (
                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">طبيعة ميعاد الأقساط</label>
                      <div className="flex gap-4 bg-white p-2.5 rounded-xl border border-slate-200">
                        <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                          <input type="radio" checked={installmentMode === 'DATED'} onChange={() => setInstallmentMode('DATED')} className="text-emerald-600 focus:ring-emerald-500" />
                          أقساط مجدولة بتاريخ
                        </label>
                        <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer text-amber-700">
                          <input type="radio" checked={installmentMode === 'UNDATED'} onChange={() => setInstallmentMode('UNDATED')} className="text-amber-600 focus:ring-amber-500" />
                          دفعات بدون تاريخ (مرنة)
                        </label>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">عدد الأقساط</label>
                        <input type="number" min="1" value={installmentsCount} onChange={e => setInstallmentsCount(Number(e.target.value))} className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500/20 bg-white" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">الفائدة % (اختياري)</label>
                        <input type="number" min="0" step="any" value={interestRate} onChange={e => setInterestRate(Number(e.target.value))} className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500/20 bg-white" />
                      </div>
                    </div>
                    
                    {totalAmount - amountPaid > 0 && customInstallments.length > 0 && (
                      <div className="mt-4 border rounded-xl overflow-hidden">
                        <div className="bg-slate-50 px-4 py-2 border-b text-sm font-bold text-slate-700">
                          جدول الأقساط المخصص (يمكنك التعديل)
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          <table className="w-full text-right text-sm">
                            <thead className="bg-slate-50 border-b">
                              <tr>
                                <th className="p-2 font-semibold text-slate-600">الدفعة / القسط</th>
                                {installmentMode === 'DATED' && <th className="p-2 font-semibold text-slate-600">التاريخ</th>}
                                <th className="p-2 font-semibold text-slate-600">المبلغ</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {customInstallments.map((inst, idx) => (
                                <tr key={idx}>
                                  <td className="p-2 font-bold text-slate-600">#{inst.id} {installmentMode === 'UNDATED' ? '(دفعة بدون تاريخ)' : ''}</td>
                                  {installmentMode === 'DATED' && (
                                    <td className="p-2">
                                      <input 
                                        type="date" 
                                        value={inst.dueDate || ''} 
                                        onChange={e => updateCustomInstallment(idx, 'dueDate', e.target.value)}
                                        className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-emerald-500/20"
                                      />
                                    </td>
                                  )}
                                  <td className="p-2">
                                    <input 
                                      type="number" 
                                      min="0"
                                      step="any"
                                      value={inst.amount} 
                                      onChange={e => updateCustomInstallment(idx, 'amount', Number(e.target.value))}
                                      className="w-24 px-2 py-1 border rounded focus:ring-2 focus:ring-emerald-500/20 text-center font-bold text-emerald-600"
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-emerald-50 border-t font-bold text-emerald-800">
                              <tr>
                                <td colSpan={2} className="p-2 text-left">إجمالي الأقساط:</td>
                                <td className="p-2 text-center">
                                  {customInstallments.reduce((sum, i) => sum + i.amount, 0).toLocaleString()} ج.م
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-slate-100">
            <button type="submit" className="flex items-center space-x-2 space-x-reverse px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors">
              <Save size={20} />
              <span>إصدار الفاتورة</span>
            </button>
          </div>
        </form>
      </div>

      {showAddCustomer && (
        <QuickAddCustomerModal 
          onClose={() => setShowAddCustomer(false)}
          onSuccess={handleCustomerAdded}
        />
      )}
    </div>
  );
}

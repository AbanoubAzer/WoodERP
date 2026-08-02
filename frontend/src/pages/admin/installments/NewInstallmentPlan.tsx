import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { CalendarClock, Save, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { QuickAddCustomerModal } from '../../../components/ui/QuickAddCustomerModal';
import { QuickAddSupplierModal } from '../../../components/ui/QuickAddSupplierModal';
import { Plus } from 'lucide-react';

export function NewInstallmentPlan() {
  const token = useAuthStore(state => state.token);
  const navigate = useNavigate();
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  
  const [type, setType] = useState('CUSTOMER');
  const [customerId, setCustomerId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [numberOfMonths, setNumberOfMonths] = useState('3');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [generatedSchedule, setGeneratedSchedule] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [custRes, suppRes] = await Promise.all([
      fetch('/api/customers', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/suppliers', { headers: { Authorization: `Bearer ${token}` } })
    ]);
    setCustomers(await custRes.json());
    setSuppliers(await suppRes.json());
  };

  const handleCustomerAdded = (newCustomer: any) => {
    setCustomers(prev => [...prev, newCustomer]);
    setCustomerId(newCustomer.id);
    setShowAddCustomer(false);
  };

  const handleSupplierAdded = (newSupplier: any) => {
    setSuppliers(prev => [...prev, newSupplier]);
    setSupplierId(newSupplier.id);
    setShowAddSupplier(false);
  };

  const handleGenerate = () => {
    const amount = Number(totalAmount);
    const months = Number(numberOfMonths);
    if (!amount || !months) return;

    const installmentAmount = amount / months;
    const schedule = Array.from({ length: months }).map((_, i) => {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      return {
        installmentNumber: i + 1,
        dueDate: date.toISOString().split('T')[0],
        amount: installmentAmount
      };
    });
    setGeneratedSchedule(schedule);
  };

  const updateScheduleItem = (index: number, field: string, value: string) => {
    const newSchedule = [...generatedSchedule];
    newSchedule[index][field] = field === 'amount' ? Number(value) : value;
    setGeneratedSchedule(newSchedule);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((type === 'CUSTOMER' && !customerId) || (type === 'SUPPLIER' && !supplierId) || generatedSchedule.length === 0) return alert('الرجاء اختيار العميل/المورد وتوليد الجدول أولاً');

    const sum = generatedSchedule.reduce((a, b) => a + b.amount, 0);
    if (Math.abs(sum - Number(totalAmount)) > 1) {
      if(!window.confirm(`مجموع الأقساط (${sum}) لا يطابق إجمالي المديونية (${totalAmount}). هل تريد المتابعة؟`)) {
        return;
      }
    }

    try {
      const response = await fetch('/api/installments/plans', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          type,
          entityId: type === 'CUSTOMER' ? customerId : supplierId,
          totalAmount: Number(totalAmount),
          numberOfMonths: Number(numberOfMonths),
          startDate,
          installments: generatedSchedule
        })
      });

      if (!response.ok) throw new Error('حدث خطأ أثناء إنشاء الخطة');

      alert('تم إنشاء خطة التقسيط بنجاح!');
      navigate('/installments');
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 space-x-reverse bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="bg-orange-100 p-3 rounded-xl">
          <CalendarClock className="text-orange-700" size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">إنشاء خطة تقسيط</h1>
          <p className="text-sm text-slate-500">توزيع المديونية على دفعات شهرية مجدولة</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">نوع الخطة</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2"><input type="radio" checked={type === 'CUSTOMER'} onChange={() => setType('CUSTOMER')} /> عميل (تحصيل)</label>
              <label className="flex items-center gap-2"><input type="radio" checked={type === 'SUPPLIER'} onChange={() => setType('SUPPLIER')} /> مورد (دفع)</label>
            </div>
          </div>
          {type === 'CUSTOMER' ? (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-slate-700">اختر العميل (تحصيل)</label>
                <button 
                  type="button"
                  onClick={() => setShowAddCustomer(true)}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 bg-orange-50 px-2 py-1 rounded"
                >
                  <Plus size={14} /> إضافة عميل جديد
                </button>
              </div>
              <SearchableSelect
                options={customers.map(c => ({ value: c.id, label: `${c.name} - (كود: ${c.code})` }))}
                value={customerId}
                onChange={setCustomerId}
                placeholder="ابحث عن عميل..."
              />
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-slate-700">اختر المورد (دفع)</label>
                <button 
                  type="button"
                  onClick={() => setShowAddSupplier(true)}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 bg-orange-50 px-2 py-1 rounded"
                >
                  <Plus size={14} /> إضافة مورد جديد
                </button>
              </div>
              <SearchableSelect
                options={suppliers.map(s => ({ value: s.id, label: `${s.name} - (كود: ${s.code})` }))}
                value={supplierId}
                onChange={setSupplierId}
                placeholder="ابحث عن مورد..."
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">المبلغ المراد تقسيطه</label>
            <input type="number" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} placeholder="مثال: 120000" className="w-full px-4 py-3 border rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">عدد الأشهر</label>
              <input type="number" value={numberOfMonths} onChange={e => setNumberOfMonths(e.target.value)} className="w-full px-4 py-3 border rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">تاريخ أول قسط</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-3 border rounded-xl" />
            </div>
          </div>
        </div>

        <button type="button" onClick={handleGenerate} className="w-full mb-8 flex justify-center items-center space-x-2 space-x-reverse px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800">
          <Calculator size={20} />
          <span>توليد جدول السداد الافتراضي</span>
        </button>

        {generatedSchedule.length > 0 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4">جدول الأقساط (يمكنك تعديل القيم يدوياً)</h3>
              <div className="space-y-3">
                {generatedSchedule.map((inst, idx) => (
                  <div key={idx} className="flex gap-4 items-center bg-white p-3 rounded-lg border shadow-sm">
                    <div className="w-16 text-center font-bold text-slate-500">قسط {inst.installmentNumber}</div>
                    <div className="flex-1">
                      <label className="block text-xs text-slate-400 mb-1">تاريخ الاستحقاق</label>
                      <input type="date" value={inst.dueDate} onChange={e => updateScheduleItem(idx, 'dueDate', e.target.value)} className="w-full px-3 py-2 border rounded" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-slate-400 mb-1">قيمة القسط (ج.م)</label>
                      <input type="number" value={inst.amount} onChange={e => updateScheduleItem(idx, 'amount', e.target.value)} className="w-full px-3 py-2 border rounded font-bold text-orange-600" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button type="submit" className="flex items-center space-x-2 space-x-reverse px-8 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700">
                <Save size={20} />
                <span>حفظ واعتماد الخطة</span>
              </button>
            </div>
          </form>
        )}
      </div>
      
      {showAddCustomer && (
        <QuickAddCustomerModal 
          onClose={() => setShowAddCustomer(false)}
          onSuccess={handleCustomerAdded}
        />
      )}
      
      {showAddSupplier && (
        <QuickAddSupplierModal 
          onClose={() => setShowAddSupplier(false)}
          onSuccess={handleSupplierAdded}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { FileText, Download, Users, ArrowUpDown, Save, Search, Settings2, Trash2 } from 'lucide-react';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import { toast } from '../../../store/toastStore';
import { toArabicDigits } from '../../../utils/numberUtils';


interface Customer {
  id: string;
  name: string;
  code: string;
  phone: string;
  city: string;
  address?: string;
  category: string;
  balance: number;
  installmentType?: 'UNDATED' | 'DATED' | 'CREDIT';
}

export function ComprehensiveCustomerReport() {
  const token = useAuthStore((state) => state.token);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Grouping
  const [groupBy, setGroupBy] = useState<'NONE' | 'CITY' | 'CATEGORY' | 'BALANCE_STATUS' | 'INSTALLMENT_TYPE'>('NONE');
  
  // Ordering Profiles
  const [profiles, setProfiles] = useState<{id?: string, name: string, order: string[]}[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>('DEFAULT');
  const [isEditMode, setIsEditMode] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  
  // Drag & Drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchCustomers();
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const res = await fetch('/api/reports/profiles?type=CUSTOMER_ORDER', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const formatted = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          order: p.data
        }));
        setProfiles(formatted);
      }
    } catch (err) {
      console.error('Failed to load profiles', err);
    }
  };

  const saveProfileToDb = async (name: string, order: string[]) => {
    try {
      const res = await fetch('/api/reports/profiles', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ name, data: order, type: 'CUSTOMER_ORDER' })
      });
      if (!res.ok) throw new Error('فشل الحفظ');
      await loadProfiles(); // Reload to get the ID
    } catch (err) {
      console.error(err);
      toast.error('خطأ', 'فشل حفظ النموذج في قاعدة البيانات');
    }
  };

  const deleteProfileFromDb = async (id: string) => {
    try {
      await fetch(`/api/reports/profiles/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadProfiles();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/customers?limit=1000', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('فشل جلب بيانات العملاء');
      const data = await res.json();
      const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setCustomers(list);
    } catch (err: any) {
      toast.error('خطأ', err.message);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  // Derived financial data
  const enrichCustomer = (c: Customer) => {
    const debit = c.balance > 0 ? c.balance : 0; // عليه
    const credit = c.balance < 0 ? Math.abs(c.balance) : 0; // ليه
    const net = c.balance;
    const balanceStatus = c.balance > 0 ? 'DEBIT' : c.balance < 0 ? 'CREDIT' : 'ZERO';
    return { ...c, debit, credit, net, balanceStatus };
  };

  const enrichedCustomers = (Array.isArray(customers) ? customers : []).map(enrichCustomer);

  // Sorting
  let sortedCustomers = Array.isArray(enrichedCustomers) ? [...enrichedCustomers] : [];
  if (selectedProfile !== 'DEFAULT' && selectedProfile !== 'HIGHEST_DEBT' && selectedProfile !== 'HIGHEST_CREDIT') {
    const profile = profiles.find(p => p.name === selectedProfile);
    if (profile) {
      sortedCustomers.sort((a, b) => {
        const indexA = profile.order.indexOf(a.id);
        const indexB = profile.order.indexOf(b.id);
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    }
  } else if (selectedProfile === 'HIGHEST_DEBT') {
    sortedCustomers.sort((a, b) => b.debit - a.debit);
  } else if (selectedProfile === 'HIGHEST_CREDIT') {
    sortedCustomers.sort((a, b) => b.credit - a.credit);
  }

  // Filtering
  const filteredCustomers = sortedCustomers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.phone && c.phone.includes(searchTerm)) ||
    (c.code && c.code.includes(searchTerm))
  );

  // Grouping
  const getGroupKey = (c: any) => {
    switch(groupBy) {
      case 'CITY': return c.city || 'غير محدد';
      case 'CATEGORY': return c.category || 'غير محدد';
      case 'BALANCE_STATUS': 
        if (c.balanceStatus === 'DEBIT') return 'عملاء مدينين (عليهم أموال)';
        if (c.balanceStatus === 'CREDIT') return 'عملاء دائنين (لهم أموال)';
        return 'رصيد صفري';
      case 'INSTALLMENT_TYPE':
        if (c.installmentType === 'UNDATED') return 'دفعات بدون تاريخ (مرنة)';
        if (c.installmentType === 'DATED') return 'أقساط مجدولة بتاريخ';
        return 'آجل عادي / بدون تقسيط';
      default: return 'ALL';
    }
  };

  const groupedCustomers = filteredCustomers.reduce((acc, c) => {
    const key = getGroupKey(c);
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {} as Record<string, typeof filteredCustomers>);

  // Grand Totals
  const totalDebit = filteredCustomers.reduce((sum, c) => sum + c.debit, 0);
  const totalCredit = filteredCustomers.reduce((sum, c) => sum + c.credit, 0);
  const netDifference = totalDebit - totalCredit;

  const exportToCSV = () => {
    if (filteredCustomers.length === 0) {
      toast.warning('لا توجد بيانات للتصدير');
      return;
    }
    const headers = ['كود العميل', 'الاسم', 'الهاتف', 'المنطقة', 'التصنيف', 'عليه (مدين)', 'ليه (دائن)', 'الصافي'];
    const rows = filteredCustomers.map(c => [
      c.code, c.name, c.phone || '', c.city || '', c.category || '',
      c.debit.toString(), c.credit.toString(), c.net.toString()
    ]);

    const csvContent = '\uFEFF' + [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customer_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('تم تصدير التقرير بنجاح');
  };

  const handleOrderChange = (index: number, newIndexStr: string) => {
    const newIndex = parseInt(newIndexStr, 10) - 1;
    if (isNaN(newIndex) || newIndex < 0 || newIndex >= filteredCustomers.length) return;
    const newArr = [...filteredCustomers];
    const item = newArr.splice(index, 1)[0];
    newArr.splice(newIndex, 0, item);
    saveTempOrder(newArr);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newArr = [...filteredCustomers];
    const item = newArr.splice(draggedIndex, 1)[0];
    newArr.splice(index, 0, item);
    
    setDraggedIndex(index);
    saveTempOrder(newArr);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const saveTempOrder = (newArr: typeof filteredCustomers) => {
    const order = newArr.map(c => c.id);
    const tempProfileName = "ترتيب مؤقت (غير محفوظ)";
    let updatedProfiles = [...profiles];
    const existing = updatedProfiles.findIndex(p => p.name === tempProfileName);
    if (existing >= 0) {
      updatedProfiles[existing].order = order;
    } else {
      updatedProfiles.push({ name: tempProfileName, order });
    }
    setProfiles(updatedProfiles);
    setSelectedProfile(tempProfileName);
  }

  const moveRow = (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= filteredCustomers.length) return;
    const newArr = [...filteredCustomers];
    const temp = newArr[index];
    newArr[index] = newArr[index + direction];
    newArr[index + direction] = temp;
    saveTempOrder(newArr);
  };

  const saveCurrentOrderAsProfile = async () => {
    if (!newProfileName.trim()) {
      toast.error('خطأ', 'يرجى إدخال اسم للنموذج');
      return;
    }
    if (profiles.some(p => p.name === newProfileName.trim() && p.name !== "ترتيب مؤقت (غير محفوظ)")) {
      toast.error('خطأ', 'هذا الاسم موجود بالفعل');
      return;
    }
    const order = filteredCustomers.map(c => c.id);
    await saveProfileToDb(newProfileName.trim(), order);
    setSelectedProfile(newProfileName.trim());
    setNewProfileName('');
    setIsEditMode(false);
    toast.success('تم حفظ نموذج الترتيب بنجاح');
  };

  const deleteProfile = (name: string) => {
    const profile = profiles.find(p => p.name === name);
    if (profile && profile.id) {
      deleteProfileFromDb(profile.id);
      if (selectedProfile === name) setSelectedProfile('DEFAULT');
      toast.success('تم الحذف بنجاح');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:space-y-4 print:bg-white print:text-black">
      {/* Print Only Header */}
      <div className="hidden print:flex flex-col items-center justify-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-3xl font-black text-black">تقرير العملاء الشامل</h1>
        <p className="text-lg text-gray-700 mt-2">WoodERP Management System</p>
        <div className="flex justify-between w-full mt-4 text-sm font-bold text-gray-600">
          <span>تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</span>
          <span>الترتيب: {selectedProfile === 'DEFAULT' ? 'الافتراضي' : selectedProfile}</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4 print:hidden">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="bg-blue-100 p-3 rounded-xl">
            <Users className="text-blue-700" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 print:text-black">تقرير العملاء الشامل</h1>
            <p className="text-sm text-slate-500 print:text-gray-600">حسابات العملاء، المديونيات، والمستحقات والتصنيفات المخصصة</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={handlePrint} className="flex items-center space-x-2 space-x-reverse bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-semibold hover:bg-slate-50 transition-colors">
            <FileText size={20} />
            <span>طباعة</span>
          </button>
          <button onClick={exportToCSV} className="flex items-center space-x-2 space-x-reverse bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-semibold hover:bg-slate-50 transition-colors">
            <Download size={20} />
            <span>تصدير Excel</span>
          </button>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-6 print:hidden">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">تجميع حسب (Grouping)</label>
          <select 
            value={groupBy} 
            onChange={e => setGroupBy(e.target.value as any)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="NONE">بدون تجميع (قائمة واحدة)</option>
            <option value="CITY">المنطقة / المدينة</option>
            <option value="CATEGORY">تصنيف العميل</option>
            <option value="BALANCE_STATUS">الموقف المالي (مدين/دائن)</option>
            <option value="INSTALLMENT_TYPE">طبيعة السداد (دفعات بدون تاريخ / أقساط)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">ترتيب العملاء (Ordering Profile)</label>
          <div className="flex gap-2">
            <select 
              value={selectedProfile} 
              onChange={e => setSelectedProfile(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="DEFAULT">الترتيب الافتراضي (الأحدث)</option>
              <option value="HIGHEST_DEBT">الأكثر مديونية (أعلى عليه)</option>
              <option value="HIGHEST_CREDIT">الأكثر دائنية (أعلى ليه)</option>
              {profiles.map(p => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
            {selectedProfile !== 'DEFAULT' && selectedProfile !== 'HIGHEST_DEBT' && selectedProfile !== 'HIGHEST_CREDIT' && selectedProfile !== 'ترتيب مؤقت (غير محفوظ)' && (
              <button 
                onClick={() => deleteProfile(selectedProfile)}
                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg border border-rose-200"
                title="حذف هذا الترتيب"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">بحث سريع</label>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="اسم، هاتف، أو كود..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="flex items-end">
          <button 
            onClick={() => setIsEditMode(!isEditMode)}
            className={`w-full flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 border rounded-lg font-semibold transition-colors ${isEditMode ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
          >
            <ArrowUpDown size={20} />
            <span>{isEditMode ? 'إنهاء التعديل' : 'تخصيص الترتيب يدوياً'}</span>
          </button>
        </div>
      </div>

      {isEditMode && (
        <div className="bg-amber-50 p-6 rounded-2xl shadow-sm border border-amber-200 flex flex-col md:flex-row items-center gap-4 print:hidden">
          <div className="flex-1">
            <h3 className="font-bold text-amber-900 mb-1">وضع تعديل الترتيب مفعل</h3>
            <p className="text-sm text-amber-700">استخدم الأسهم بجوار كل عميل في الجدول لتغيير ترتيبه، ثم قم بحفظ الترتيب كنموذج جديد لاستخدامه لاحقاً.</p>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input 
              type="text" 
              placeholder="اسم الترتيب (مثال: خط سير الصعيد)" 
              value={newProfileName}
              onChange={e => setNewProfileName(e.target.value)}
              className="px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 bg-white min-w-[200px]"
            />
            <button 
              onClick={saveCurrentOrderAsProfile}
              className="flex items-center space-x-1 space-x-reverse bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-bold"
            >
              <Save size={18} />
              <span>حفظ كنموذج</span>
            </button>
          </div>
        </div>
      )}

      {/* Grand Totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:flex print:flex-row print:gap-4 print:justify-between print:border-b-2 print:border-black print:pb-6 print:mb-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 relative overflow-hidden group print:border-gray-400 print:shadow-none print:w-1/3">
          <div className="absolute left-0 top-0 w-1 h-full bg-emerald-500 rounded-l-2xl print:hidden"></div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-500 font-semibold text-sm print:text-black">إجمالي ما لك (ديون على العملاء)</span>
          </div>
          <p className="text-3xl font-black text-slate-900 print:text-black">{totalDebit.toLocaleString()} <span className="text-sm font-normal text-slate-500 print:text-black">ج.م</span></p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100 relative overflow-hidden group print:border-gray-400 print:shadow-none print:w-1/3">
          <div className="absolute left-0 top-0 w-1 h-full bg-rose-500 rounded-l-2xl print:hidden"></div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-500 font-semibold text-sm print:text-black">إجمالي ما عليك (أرصدة للعملاء)</span>
          </div>
          <p className="text-3xl font-black text-slate-900 print:text-black">{totalCredit.toLocaleString()} <span className="text-sm font-normal text-slate-500 print:text-black">ج.م</span></p>
        </div>

        <div className={`bg-white p-6 rounded-2xl shadow-sm border relative overflow-hidden group ${netDifference >= 0 ? 'border-emerald-100' : 'border-rose-100'} print:border-gray-400 print:shadow-none print:w-1/3`}>
          <div className={`absolute left-0 top-0 w-1 h-full rounded-l-2xl print:hidden ${netDifference >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-500 font-semibold text-sm print:text-black">الصافي / الفرق العام</span>
          </div>
          <p className={`text-3xl font-black ${netDifference >= 0 ? 'text-emerald-600 print:text-black' : 'text-rose-600 print:text-black'}`}>
            {Math.abs(netDifference).toLocaleString()} <span className="text-sm font-normal text-slate-500 print:text-black">ج.م</span>
            <span className="text-sm block mt-1 font-bold print:text-black">{netDifference >= 0 ? '(لصالح الشركة)' : '(عجز / مستحقات للعملاء)'}</span>
          </p>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <TableSkeleton rows={8} cols={6} />
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedCustomers).map(([groupName, groupData]) => {
            const groupDebit = groupData.reduce((sum, c) => sum + c.debit, 0);
            const groupCredit = groupData.reduce((sum, c) => sum + c.credit, 0);
            const groupNet = groupDebit - groupCredit;

            return (
              <div key={groupName} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print:shadow-none print:border-gray-400 print:mb-6">
                {groupBy !== 'NONE' && (
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center print:bg-white print:border-b-2 print:border-black">
                    <h2 className="text-lg font-bold text-slate-800 print:text-black">{groupName} <span className="text-sm font-normal text-slate-500 print:text-black">({groupData.length} عملاء)</span></h2>
                  </div>
                )}
                
                <div className="overflow-x-auto print:overflow-visible">
                  <table className="w-full text-right print:text-black print:w-full print:border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-100 print:bg-gray-100 print:border-2 print:border-black">
                      <tr>
                        {isEditMode && <th className="py-4 px-4 w-16 print:hidden"></th>}
                        <th className="py-4 px-6 font-semibold text-slate-600 print:text-black print:border print:border-gray-400 print:py-2">العميل</th>
                        <th className="py-4 px-6 font-semibold text-slate-600 print:text-black print:border print:border-gray-400 print:py-2">التواصل / العنوان</th>
                        <th className="py-4 px-6 font-semibold text-slate-600 text-center print:text-black print:border print:border-gray-400 print:py-2">عليه (Debit)</th>
                        <th className="py-4 px-6 font-semibold text-slate-600 text-center print:text-black print:border print:border-gray-400 print:py-2">ليه (Credit)</th>
                        <th className="py-4 px-6 font-semibold text-slate-600 text-left print:text-black print:border print:border-gray-400 print:py-2">الفرق (الصافي)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {groupData.length === 0 ? (
                        <tr>
                          <td colSpan={isEditMode ? 6 : 5} className="py-8 text-center text-slate-500">لا توجد بيانات</td>
                        </tr>
                      ) : (
                        groupData.map((c, idx) => (
                          <tr 
                            key={c.id} 
                            className={`hover:bg-slate-50 transition-colors print:break-inside-avoid ${draggedIndex === idx ? 'opacity-50' : ''}`}
                            draggable={isEditMode}
                            onDragStart={(e) => handleDragStart(e, idx)}
                            onDragOver={(e) => handleDragOver(e, idx)}
                            onDragEnd={handleDragEnd}
                          >
                            {isEditMode && (
                              <td className="py-4 px-4 w-32 border-l border-slate-100 print:hidden">
                                <div className="flex items-center gap-2 h-full">
                                  <div className="flex flex-col gap-1">
                                    <button onClick={() => moveRow(idx, -1)} disabled={idx === 0} className="p-1 hover:bg-slate-200 rounded text-slate-500 disabled:opacity-30">↑</button>
                                    <button onClick={() => moveRow(idx, 1)} disabled={idx === groupData.length - 1} className="p-1 hover:bg-slate-200 rounded text-slate-500 disabled:opacity-30">↓</button>
                                  </div>
                                  <input 
                                    type="number" 
                                    min="1" 
                                    max={groupData.length}
                                    value={idx + 1}
                                    onChange={(e) => handleOrderChange(idx, e.target.value)}
                                    className="w-14 text-center border rounded px-1 py-1 text-sm bg-white"
                                    title="اكتب رقم الترتيب وانقر خارجه"
                                  />
                                </div>
                              </td>
                            )}
                            <td className="py-4 px-6 print:border print:border-gray-300 print:py-2">
                              <div className="flex items-center gap-3">
                                {/* Color Tag Indicator */}
                                <div className={`w-3 h-3 rounded-full flex-shrink-0 print:hidden ${c.balanceStatus === 'DEBIT' ? 'bg-rose-500' : c.balanceStatus === 'CREDIT' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                 <div>
                                   <div className="flex items-center gap-2 flex-wrap">
                                     <p className="font-bold text-slate-900 print:text-black print:text-sm">{c.name}</p>
                                     {c.installmentType === 'UNDATED' && (
                                       <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 print:border-black print:text-black print:bg-gray-100">
                                         دفعات بدون تاريخ
                                       </span>
                                     )}
                                     {c.installmentType === 'DATED' && (
                                       <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200 print:border-black print:text-black print:bg-gray-100">
                                         أقساط مجدولة
                                       </span>
                                     )}
                                   </div>
                                   <p className="text-xs text-slate-500 font-mono mt-0.5 print:text-gray-700">{toArabicDigits(c.code)}</p>
                                 </div>
                              </div>
                            </td>
                            <td className="py-4 px-6 print:border print:border-gray-300 print:py-2">
                              <p className="text-sm text-slate-700 print:text-black print:text-sm">{toArabicDigits(c.phone) || 'غير متوفر'}</p>
                              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px] print:text-gray-700 print:whitespace-normal" title={c.city ? `${c.city} - ${c.address || ''}` : ''}>
                                {c.city || 'منطقة غير محددة'}
                              </p>
                            </td>
                            <td className="py-4 px-6 text-center print:border print:border-gray-300 print:py-2">
                              <span className={`font-bold print:text-black print:text-sm ${c.debit > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                {c.debit.toLocaleString()}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center print:border print:border-gray-300 print:py-2">
                              <span className={`font-bold print:text-black print:text-sm ${c.credit > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {c.credit.toLocaleString()}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-left print:border print:border-gray-300 print:py-2">
                              <div className={`inline-flex items-center px-3 py-1 rounded-full font-bold print:bg-transparent print:px-0 print:py-0 print:text-black print:text-sm ${
                                c.net > 0 ? 'bg-rose-100 text-rose-700' : 
                                c.net < 0 ? 'bg-emerald-100 text-emerald-700' : 
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {Math.abs(c.net).toLocaleString()}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {groupBy !== 'NONE' && groupData.length > 0 && (
                      <tfoot className="bg-slate-50 border-t-2 border-slate-200 print:bg-gray-100 print:border-2 print:border-black">
                        <tr>
                          <td colSpan={isEditMode ? 3 : 2} className="py-4 px-6 font-bold text-slate-800 text-left print:text-black print:border print:border-gray-400 print:py-2">إجمالي المجموعة:</td>
                          <td className="py-4 px-6 text-center font-bold text-rose-600 print:text-black print:border print:border-gray-400 print:py-2">{groupDebit.toLocaleString()}</td>
                          <td className="py-4 px-6 text-center font-bold text-emerald-600 print:text-black print:border print:border-gray-400 print:py-2">{groupCredit.toLocaleString()}</td>
                          <td className="py-4 px-6 text-left font-bold text-slate-800 print:text-black print:border print:border-gray-400 print:py-2">
                            {Math.abs(groupNet).toLocaleString()} {groupNet > 0 ? '(عجز)' : groupNet < 0 ? '(فائض)' : ''}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

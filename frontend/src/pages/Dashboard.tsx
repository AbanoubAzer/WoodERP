import React, { useState, useEffect } from 'react';
import { CustomerStatement } from '../components/dashboard/CustomerStatement';
import { InstallmentsTracker } from '../components/dashboard/InstallmentsTracker';
import { StagnantInventoryTracker } from '../components/dashboard/StagnantInventoryTracker';
import { RecentTransfersTracker } from '../components/dashboard/RecentTransfersTracker';
import { OverdueAlerts } from '../components/dashboard/OverdueAlerts';
import { QuickActions } from '../components/dashboard/QuickActions';
import { SalesAndProfits } from '../components/dashboard/SalesAndProfits';
import { DebtAging } from '../components/dashboard/DebtAging';
import { Wallet, TrendingDown, TrendingUp, Package, Activity, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { DashboardSkeleton } from '../components/ui/Skeleton';

export function Dashboard() {
  const token = useAuthStore(state => state.token);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const activeLocation = useAuthStore(state => state.activeLocation);

  useEffect(() => {
    fetchDashboardData();
  }, [activeLocation]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      let url = '/api/reports/dashboard';
      if (activeLocation && activeLocation.id !== 'ALL') {
        url += `?locationId=${activeLocation.id}&locationType=${activeLocation.type === 'فرع' ? 'BRANCH' : 'WAREHOUSE'}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">

      {/* Feature Banner (Above Header as requested) */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 md:p-8 shadow-lg text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <Users size={24} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold">جديد: تقرير العملاء الشامل</h2>
          </div>
          <p className="text-blue-100 max-w-xl">
            تعرف على الموقف المالي لعملائك بالكامل بنظرة واحدة. إمكانية ترتيب العملاء، تخصيص المجموعات، وعرض الإجماليات المباشرة للديون والمستحقات.
          </p>
        </div>
        <div className="relative z-10 shrink-0">
          <Link to="/reports/customers" className="flex items-center gap-2 bg-white text-indigo-700 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-sm">
            <span>استعرض التقرير الآن</span>
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">لوحة القيادة</h1>
          <p className="text-slate-500 font-medium mt-1">ملخص الأداء المالي والتشغيلي العام</p>
        </div>
        <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <div className="p-3 rounded-xl flex items-center justify-center bg-emerald-100">
            <Activity className="text-emerald-600" size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400">حالة المؤشرات</p>
            <p className="text-xl font-black text-emerald-600">
              مستقرة
            </p>
          </div>
        </div>
      </div>
      {/* Overdue Alerts */}
      <OverdueAlerts installments={data?.overdueInstallments || []} />

      {/* Quick Actions */}
      <QuickActions />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Net Cash Flow */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden group text-white">
          <div className="absolute -left-6 -bottom-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
            <Wallet size={140} />
          </div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-emerald-100 font-bold text-sm mb-2">صافي السيولة النقدية</p>
              <div className="flex items-baseline gap-1">
                <h3 className="text-3xl font-black" dir="ltr">{data?.cashPosition > 0 ? '+' : ''}{data?.cashPosition?.toLocaleString() || 0}</h3>
                <span className="text-emerald-100 font-bold">ج.م</span>
              </div>
              <p className="text-xs text-emerald-100 mt-2">رصيد الخزينة والبنوك</p>
            </div>
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
              <Wallet className="text-white" size={24} />
            </div>
          </div>
        </div>

        {/* Obligations */}
        <div className="bg-gradient-to-br from-rose-500 to-rose-700 p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden group text-white">
          <div className="absolute -left-6 -bottom-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
            <TrendingDown size={140} />
          </div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-rose-100 font-bold text-sm mb-2">التزامات الموردين (''عليك'')</p>
              <div className="flex items-baseline gap-1">
                <h3 className="text-3xl font-black" dir="ltr">{data?.payables > 0 ? '-' : ''}{data?.payables?.toLocaleString() || 0}</h3>
                <span className="text-rose-100 font-bold">ج.م</span>
              </div>
              <p className="text-xs text-rose-100 mt-2">إجمالي الديون المستحقة</p>
            </div>
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
              <TrendingDown className="text-white" size={24} />
            </div>
          </div>
        </div>

        {/* Rights */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden group text-white">
          <div className="absolute -left-6 -bottom-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
            <TrendingUp size={140} />
          </div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-blue-100 font-bold text-sm mb-2">حقوق لدى العملاء (''ليك'')</p>
              <div className="flex items-baseline gap-1">
                <h3 className="text-3xl font-black" dir="ltr">{data?.receivables > 0 ? '+' : ''}{data?.receivables?.toLocaleString() || 0}</h3>
                <span className="text-blue-100 font-bold">ج.م</span>
              </div>
              <p className="text-xs text-blue-100 mt-2">إجمالي مستحقات العملاء</p>
            </div>
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
              <TrendingUp className="text-white" size={24} />
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden group text-white">
          <div className="absolute -left-6 -bottom-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
            <Package size={140} />
          </div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-orange-100 font-bold text-sm mb-2">إجمالي كميات المخازن</p>
              <div className="flex items-baseline gap-1">
                <h3 className="text-3xl font-black" dir="ltr">{data?.inventoryTotal?.toLocaleString() || 0}</h3>
                <span className="text-orange-100 font-bold">وحدة</span>
              </div>
              <p className="text-xs text-orange-100 mt-2">كمية المخزون الفعلي</p>
            </div>
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
              <Package className="text-white" size={24} />
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Trackers Area */}
      <div className="">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <InstallmentsTracker 
            upcomingInstallments={data?.upcomingInstallments || []} 
            supplierInstallments={data?.supplierInstallments || []} 
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Customer Statement (Left / 2 columns) */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <CustomerStatement recentActivity={data?.recentActivity || []} />
        </div>
        
        {/* Stagnant Wood (Right / 1 column) */}
        <div className="lg:col-span-1 bg-transparent flex flex-col gap-6">
          <StagnantInventoryTracker stagnantInventory={data?.stagnantInventory || []} />
        </div>
      </div>

      {/* New Reports Section (Sales & Profits, Debt Aging) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
        {/* Sales and Profits */}
        <div className="lg:col-span-1">
          <SalesAndProfits 
            salesTotal={data?.salesTotal || 0}
            purchasesTotal={data?.purchasesTotal || 0}
            expensesTotal={data?.expensesTotal || 0}
            salesTrend={data?.salesTrend || []}
          />
        </div>
        
        {/* Debt Aging (AR/AP) */}
        <div className="lg:col-span-1">
          <DebtAging />
        </div>
      </div>

      {/* Recent Transfers (Full Width Bottom) */}
      <div className="pb-12">
        <RecentTransfersTracker transfers={data?.recentTransfers || []} />
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { 
  Home, 
  Package, 
  TreePine,
  Building2,
  Users,
  Shield,
  Settings,
  Layers,
  Box,
  Warehouse,
  ArrowDownToLine,
  ArrowUpFromLine,
  ListTree,
  Receipt,
  Truck,
  ShoppingBag,
  DollarSign,
  Calculator,
  BookOpen,
  Wallet,
  BarChart3,
  ChevronDown,
  CreditCard
} from 'lucide-react';

interface MenuItem {
  icon: any;
  label: string;
  path: string;
  subItems?: { label: string; path: string }[];
}

const menuGroups: { title: string; items: MenuItem[] }[] = [
  {
    title: 'الرئيسية',
    items: [
      { icon: Home, label: 'لوحة التحكم', path: '/' }
    ]
  },
  {
    title: 'إدارة المخزون',
    items: [
      { icon: Package, label: 'أرصدة المخزون', path: '/inventory' },
      { icon: ArrowDownToLine, label: 'استلام بضاعة', path: '/inventory/receive' },
      { icon: ArrowUpFromLine, label: 'صرف بضاعة', path: '/inventory/issue' },
      { icon: Warehouse, label: 'المخازن', path: '/warehouses' }
    ]
  },
  {
    title: 'المنتجات والأصناف',
    items: [
      { icon: Box, label: 'دليل المنتجات', path: '/products' },
      { icon: Layers, label: 'الفئات', path: '/categories' },
      { icon: ListTree, label: 'أنواع الأخشاب', path: '/wood-types' }
    ]
  },
  {
    title: 'إدارة العملاء والمبيعات',
    items: [
      { icon: Users, label: 'العملاء', path: '/customers' },
      { icon: Receipt, label: 'فواتير المبيعات', path: '/sales/invoices' },
    ]
  },
  {
    title: 'الموردين والمشتريات',
    items: [
      { icon: Truck, label: 'الموردين', path: '/suppliers' },
      { icon: ShoppingBag, label: 'فواتير المشتريات', path: '/purchases/invoices' },
    ]
  },
  {
    title: 'المالية والحسابات',
    items: [
      { icon: Wallet, label: 'الخزائن والبنوك', path: '/treasury' },
      { icon: DollarSign, label: 'الأقساط والمديونيات', path: '/installments' },
      { icon: Calculator, label: 'شجرة الحسابات', path: '/accounting/chart-of-accounts' },
      { icon: BookOpen, label: 'قيود اليومية', path: '/accounting/journal' },
      { icon: Receipt, label: 'المصروفات', path: '/accounting/expenses' },
    ]
  },
  {
    title: 'التقارير',
    items: [
      { 
        icon: BarChart3, 
        label: 'التقارير والإحصائيات', 
        path: '/reports',
        subItems: [
          { label: 'حركة المخزون الشاملة', path: '/reports/inventory-movements' },
          { label: 'تسليمات العملاء', path: '/reports/customer-dispatch' },
          { label: 'المبيعات والأرباح', path: '/reports/sales' },
          { label: 'تقرير المبيعات المتقدم', path: '/reports/sales-advanced' },
          { label: 'أعمار الديون (AR/AP)', path: '/reports/aging' },
          { label: 'تقرير العملاء الشامل', path: '/reports/customers' },
        ]
      },
    ]
  },
  {
    title: 'الإدارة والإعدادات',
    items: [
      { icon: Building2, label: 'الفروع', path: '/branches' },
      { icon: Users, label: 'المستخدمين', path: '/users' },
      { icon: Shield, label: 'الصلاحيات والأدوار', path: '/roles' },
      { icon: CreditCard, label: 'طرق السداد', path: '/payment-methods' },
      { icon: Settings, label: 'إعدادات الشركة', path: '/settings' }
    ]
  }
];

export function Sidebar() {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const user = useAuthStore(state => state.user);

  const finalMenuGroups = [...menuGroups];
  if (user?.isSuperAdmin) {
    finalMenuGroups.push({
      title: 'إدارة النظام (Super Admin)',
      items: [
        { icon: Shield, label: 'إدارة الشركات', path: '/system/companies' }
      ]
    });
  }

  return (
    <aside className="w-64 bg-[var(--color-brand-sidebar)] text-slate-300 h-screen flex flex-col shadow-xl z-20 overflow-hidden">
      {/* Logo Area */}
      <div className="p-6 flex flex-col items-center border-b border-slate-700/50 shrink-0">
        <div className="bg-[var(--color-brand-primary)] p-3 rounded-xl shadow-lg mb-3">
          <TreePine className="text-white" size={32} />
        </div>
        <h1 className="text-white text-2xl font-bold tracking-wider">WoodERP</h1>
        <span className="text-[var(--color-brand-primary)] text-xs font-semibold tracking-[0.2em] mt-1">SAAS ENTERPRISE</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-6 custom-scrollbar">
        {finalMenuGroups.map((group, groupIdx) => (
          <div key={groupIdx}>
            <h3 className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item, idx) => (
                <div key={idx}>
                  {item.subItems ? (
                    <>
                      <button
                        onClick={() => setExpandedItem(expandedItem === item.path ? null : item.path)}
                        className={`flex items-center justify-between w-full px-4 py-2.5 rounded-lg transition-all duration-200 hover:bg-slate-800 hover:text-white text-slate-400`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon size={20} />
                          <span className="text-sm">{item.label}</span>
                        </div>
                        <ChevronDown size={16} className={`transition-transform duration-200 ${expandedItem === item.path ? 'rotate-180' : ''}`} />
                      </button>
                      {expandedItem === item.path && (
                        <div className="mt-1 mr-4 pr-4 border-r border-slate-700/50 space-y-1">
                          {item.subItems.map((sub, subIdx) => (
                            <NavLink
                              key={subIdx}
                              to={sub.path}
                              className={({ isActive }) => `block px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                                isActive 
                                  ? 'bg-[var(--color-brand-primary)] text-white font-bold shadow-md' 
                                  : 'hover:bg-slate-800 hover:text-white text-slate-400'
                              }`}
                            >
                              {sub.label}
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <NavLink
                      to={item.path}
                      end={item.path === '/'}
                      className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                        isActive 
                          ? 'bg-[var(--color-brand-primary)] text-white font-bold shadow-md' 
                          : 'hover:bg-slate-800 hover:text-white text-slate-400'
                      }`}
                    >
                      <item.icon size={20} />
                      <span className="text-sm">{item.label}</span>
                    </NavLink>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}



import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Building2, User, Bell, Info, AlertTriangle, CheckCircle, ChevronDown, LogOut, Settings } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Link, useNavigate } from 'react-router-dom';

export function Header() {
  const token = useAuthStore(state => state.token);
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [branches, setBranches] = useState<any[]>([]);
  const activeLocation = useAuthStore(state => state.activeLocation);
  const setActiveLocation = useAuthStore(state => state.setActiveLocation);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ 
    customers: any[], products: any[], invoices: any[], suppliers: any[], purchaseInvoices: any[], categories: any[], woodTypes: any[], users: any[] 
  }>({ customers: [], products: [], invoices: [], suppliers: [], purchaseInvoices: [], categories: [], woodTypes: [], users: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // Global Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // F2 to create new sales invoice
      if (e.key === 'F2') {
        e.preventDefault();
        navigate('/sales/invoices/new');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Debounced Search API Call
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults({ customers: [], products: [], invoices: [], suppliers: [], purchaseInvoices: [], categories: [], woodTypes: [], users: [] });
      setShowSearchDropdown(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      setShowSearchDropdown(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, token]);

  // Click outside search to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchBranches();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const [notifRes, instRes] = await Promise.all([
        fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/installments', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      let items: any[] = [];
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        items = Array.isArray(notifData) ? notifData : notifData.data || [];
      }

      if (instRes.ok) {
        const instData = await instRes.json();
        const installmentsList = Array.isArray(instData) ? instData : instData.data || [];
        const overdueOrUpcoming = installmentsList.filter((inst: any) => inst.status === 'OVERDUE' || (inst.status === 'PENDING' && inst.dueDate && new Date(inst.dueDate).getTime() - Date.now() < 7 * 86400000));
        
        overdueOrUpcoming.forEach((inst: any) => {
          const isOverdue = inst.status === 'OVERDUE';
          const name = inst.plan?.customer?.name || inst.plan?.supplier?.name || 'عميل/مورد';
          items.push({
            id: `inst-${inst.id}`,
            title: isOverdue ? `قسط متأخر على ${name}` : `قسط مستحق قريباً على ${name}`,
            message: `قسط رقم #${inst.installmentNumber} بقيمة ${inst.amount} ج.م (تاريخ: ${inst.dueDate ? new Date(inst.dueDate).toLocaleDateString('ar-EG') : 'غير محدد'})`,
            type: isOverdue ? 'ERROR' : 'WARNING',
            link: '/installments'
          });
        });
      }

      setNotifications(items);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBranches = async () => {
    try {
      const [branchesRes, warehousesRes] = await Promise.all([
        fetch('/api/branches', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/warehouses', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      let allLocations: any[] = [{ id: 'ALL', name: 'كل الفروع والمخازن', type: 'ALL' }];
      
      if (branchesRes.ok) {
        const b = await branchesRes.json();
        allLocations = [...allLocations, ...b.map((x: any) => ({ ...x, type: 'فرع' }))];
      }
      
      if (warehousesRes.ok) {
        const w = await warehousesRes.json();
        allLocations = [...allLocations, ...w.map((x: any) => ({ ...x, type: 'مخزن' }))];
      }
      
      setBranches(allLocations);
    } catch (e) {
      console.error(e);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { 
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-50 relative">
      {/* Right side (Search) */}
      <div className="flex-1 max-w-xl ml-8" ref={searchDropdownRef}>
        <div className="relative flex items-center w-full">
          <input 
            ref={searchInputRef}
            type="text" 
            placeholder="بحث سريع عن صنف، مقاس، أو عميل... (Ctrl+K)" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if (searchQuery.length >= 2) setShowSearchDropdown(true); }}
            className="w-full bg-slate-100 border-none rounded-full py-2.5 px-12 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/50 transition-all"
          />
          <Search className="absolute right-4 text-slate-400" size={18} />
          {isSearching && (
            <div className="absolute left-4 w-4 h-4 border-2 border-slate-300 border-t-[var(--color-brand-primary)] rounded-full animate-spin"></div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchDropdown && (
          <div className="absolute mt-2 w-[500px] max-w-full bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-[100] max-h-[400px] flex flex-col">
            <div className="overflow-y-auto flex-1 p-2">
              
              {/* Customers */}
              {searchResults.customers.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1.5 text-xs font-bold text-slate-500 bg-slate-50 uppercase rounded">العملاء</div>
                  {searchResults.customers.map(c => (
                    <Link 
                      key={c.id} 
                      to={`/customers/${c.id}/statement`}
                      onClick={() => setShowSearchDropdown(false)}
                      className="block px-4 py-2 hover:bg-slate-50 text-sm text-slate-700 font-medium"
                    >
                      <span className="font-bold text-slate-900">{c.name}</span>
                      {c.phone && <span className="text-xs text-slate-500 ml-2">({c.phone})</span>}
                    </Link>
                  ))}
                </div>
              )}

              {/* Products */}
              {searchResults.products.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1.5 text-xs font-bold text-slate-500 bg-slate-50 uppercase rounded">الأصناف (Products)</div>
                  {searchResults.products.map(p => (
                    <Link 
                      key={p.id} 
                      to={`/products`}
                      onClick={() => setShowSearchDropdown(false)}
                      className="block px-4 py-2 hover:bg-slate-50 text-sm text-slate-700 font-medium"
                    >
                      <span className="font-bold text-slate-900">{p.name}</span>
                      <span className="text-xs text-slate-500 ml-2">[{p.category?.name}]</span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Invoices */}
              {searchResults.invoices.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1.5 text-xs font-bold text-slate-500 bg-slate-50 uppercase rounded">فواتير البيع (Sales Invoices)</div>
                  {searchResults.invoices.map(inv => (
                    <Link 
                      key={inv.id} 
                      to={`/sales/invoices/${inv.id}`}
                      onClick={() => setShowSearchDropdown(false)}
                      className="block px-4 py-2 hover:bg-slate-50 text-sm text-slate-700 font-medium"
                    >
                      <span className="font-bold text-slate-900">{inv.invoiceNumber}</span>
                      <span className="text-xs text-slate-500 mx-2">- {inv.customer?.name}</span>
                      <span className="text-xs font-bold text-emerald-600">{inv.totalAmount.toLocaleString()} ج.م</span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Suppliers */}
              {searchResults.suppliers?.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1.5 text-xs font-bold text-slate-500 bg-slate-50 uppercase rounded">الموردين (Suppliers)</div>
                  {searchResults.suppliers.map(s => (
                    <Link 
                      key={s.id} 
                      to={`/suppliers/${s.id}/statement`}
                      onClick={() => setShowSearchDropdown(false)}
                      className="block px-4 py-2 hover:bg-slate-50 text-sm text-slate-700 font-medium"
                    >
                      <span className="font-bold text-slate-900">{s.name}</span>
                      {s.phone && <span className="text-xs text-slate-500 ml-2">({s.phone})</span>}
                    </Link>
                  ))}
                </div>
              )}

              {/* Purchase Invoices */}
              {searchResults.purchaseInvoices?.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1.5 text-xs font-bold text-slate-500 bg-slate-50 uppercase rounded">فواتير الشراء (Purchase Invoices)</div>
                  {searchResults.purchaseInvoices.map(inv => (
                    <Link 
                      key={inv.id} 
                      to={`/purchases/invoices/${inv.id}`}
                      onClick={() => setShowSearchDropdown(false)}
                      className="block px-4 py-2 hover:bg-slate-50 text-sm text-slate-700 font-medium"
                    >
                      <span className="font-bold text-slate-900">{inv.invoiceNumber}</span>
                      <span className="text-xs text-slate-500 mx-2">- {inv.supplier?.name}</span>
                      <span className="text-xs font-bold text-rose-600">{inv.totalAmount.toLocaleString()} ج.م</span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Categories */}
              {searchResults.categories?.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1.5 text-xs font-bold text-slate-500 bg-slate-50 uppercase rounded">التصنيفات (Categories)</div>
                  {searchResults.categories.map(cat => (
                    <Link 
                      key={cat.id} 
                      to={`/categories`}
                      onClick={() => setShowSearchDropdown(false)}
                      className="block px-4 py-2 hover:bg-slate-50 text-sm text-slate-700 font-medium"
                    >
                      <span className="font-bold text-slate-900">{cat.name}</span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Wood Types */}
              {searchResults.woodTypes?.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1.5 text-xs font-bold text-slate-500 bg-slate-50 uppercase rounded">أنواع الأخشاب (Wood Types)</div>
                  {searchResults.woodTypes.map(wood => (
                    <Link 
                      key={wood.id} 
                      to={`/wood-types`}
                      onClick={() => setShowSearchDropdown(false)}
                      className="block px-4 py-2 hover:bg-slate-50 text-sm text-slate-700 font-medium"
                    >
                      <span className="font-bold text-slate-900">{wood.name}</span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Users */}
              {searchResults.users?.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1.5 text-xs font-bold text-slate-500 bg-slate-50 uppercase rounded">المستخدمين (Users)</div>
                  {searchResults.users.map(u => (
                    <Link 
                      key={u.id} 
                      to={`/settings`}
                      onClick={() => setShowSearchDropdown(false)}
                      className="block px-4 py-2 hover:bg-slate-50 text-sm text-slate-700 font-medium"
                    >
                      <span className="font-bold text-slate-900">{u.name}</span>
                      <span className="text-xs text-slate-500 mx-2">{u.email}</span>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{u.role?.name}</span>
                    </Link>
                  ))}
                </div>
              )}

              {searchResults.customers.length === 0 && searchResults.products.length === 0 && searchResults.invoices.length === 0 && (!searchResults.suppliers || searchResults.suppliers.length === 0) && (!searchResults.purchaseInvoices || searchResults.purchaseInvoices.length === 0) && (!searchResults.categories || searchResults.categories.length === 0) && (!searchResults.woodTypes || searchResults.woodTypes.length === 0) && (!searchResults.users || searchResults.users.length === 0) && !isSearching && (
                <div className="p-4 text-center text-sm text-slate-500">لا توجد نتائج مطابقة لـ "{searchQuery}"</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Left side (Actions, Branch, Notifications & Profile) */}
      <div className="flex items-center gap-4">
        
        {/* Branch Selector */}
        <div className="relative">
          <button 
            onClick={() => setShowBranchDropdown(!showBranchDropdown)}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl text-slate-700 font-bold transition-colors border border-slate-200 ml-2"
          >
            <Building2 size={18} className="text-slate-500" />
            <span>{activeLocation ? activeLocation.name : 'جاري التحميل...'}</span>
            <ChevronDown size={16} className="text-slate-400" />
          </button>
          
          {showBranchDropdown && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50">
              <div className="p-2 bg-slate-50 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-500 px-2">الفروع والمخازن</p>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {branches.map(branch => (
                  <button 
                    key={`${branch.type}-${branch.id}`}
                    onClick={() => {
                      setActiveLocation(branch);
                      setShowBranchDropdown(false);
                    }}
                    className={`w-full text-right px-4 py-3 flex items-center justify-between text-sm hover:bg-slate-50 transition-colors ${activeLocation?.id === branch.id ? 'font-bold text-[var(--color-brand-primary)] bg-orange-50/50' : 'text-slate-700'}`}
                  >
                    <span>{branch.name}</span>
                    {branch.type !== 'ALL' && (
                      <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{branch.type}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={() => navigate('/sales/invoices/new')}
          className="flex items-center gap-2 bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-hover)] text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-orange-500/20 transition-all"
        >
          <Plus size={18} />
          <span>فاتورة بيع (F2)</span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors relative mr-1 ml-1">
            <Bell size={24} />
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="absolute top-1 right-2 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
          </button>
          
          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute left-0 mt-4 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[100]">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800">الإشعارات</h3>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-bold">
                  {notifications.filter(n => !n.isRead).length} جديد
                </span>
              </div>
              <div className="max-h-96 overflow-y-auto" dir="rtl">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-sm">لا توجد إشعارات</div>
                ) : (
                  notifications.slice(0, 5).map(n => (
                    <div key={n.id} onClick={() => !n.isRead && markAsRead(n.id)} className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors flex gap-3 ${n.isRead ? 'opacity-60' : 'bg-indigo-50/30'}`}>
                      <div className={`mt-1 flex-shrink-0 ${n.type === 'WARNING' ? 'text-orange-500' : n.type === 'ALERT' ? 'text-rose-500' : n.type === 'SUCCESS' ? 'text-emerald-500' : 'text-indigo-500'}`}>
                        {n.type === 'WARNING' ? <AlertTriangle size={20} /> : n.type === 'SUCCESS' ? <CheckCircle size={20} /> : <Info size={20} />}
                      </div>
                      <div>
                        <p className={`text-sm ${n.isRead ? 'font-medium text-slate-600' : 'font-bold text-slate-900'}`}>{n.title}</p>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-slate-400 mt-2">{new Date(n.createdAt).toLocaleString('ar-EG')}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
                <Link to="/notifications" onClick={() => setShowNotifications(false)} className="text-sm font-bold text-indigo-600 hover:text-indigo-800">عرض كل الإشعارات</Link>
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-slate-200 mx-2"></div>

        {/* User Profile */}
        <div className="relative">
          <div 
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-slate-800 group-hover:text-[var(--color-brand-primary)] transition-colors">{user?.name || 'المستخدم'}</span>
              <span className="text-xs text-slate-500">مدير النظام</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
              {user?.name ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'U'}
            </div>
          </div>

          {/* Profile Dropdown */}
          {showProfileDropdown && (
            <div className="absolute top-full left-0 mt-3 w-48 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50">
              <Link 
                to="/settings" 
                onClick={() => setShowProfileDropdown(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-[var(--color-brand-primary)] transition-colors"
              >
                <Settings size={16} />
                <span className="font-semibold">الإعدادات العامة</span>
              </Link>
              <div className="h-px bg-slate-100"></div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut size={16} />
                <span className="font-semibold">تسجيل الخروج</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}

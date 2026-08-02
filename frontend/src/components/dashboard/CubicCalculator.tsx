import React, { useState, useEffect, useRef } from 'react';
import { Calculator, ShoppingCart, Search, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export function CubicCalculator() {
  const token = useAuthStore(state => state.token);
  
  const [thickness, setThickness] = useState<number>(25);
  const [width, setWidth] = useState<number>(10);
  const [length, setLength] = useState<number>(4);
  const [count, setCount] = useState<number>(150);
  const [result, setResult] = useState<number>(0);
  
  const [products, setProducts] = useState<any[]>([]);
  
  // Custom Select State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/catalog/products', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setProducts(json);
        }
      } catch (err) {
        console.error("Failed to fetch products for calculator", err);
      }
    };
    fetchProducts();
  }, [token]);

  useEffect(() => {
    // Formula: (thickness in m) * (width in m) * (length in m) * count
    const t_m = (thickness || 0) / 1000;
    const w_m = (width || 0) / 100;
    const l_m = length || 0;
    const c = count || 0;
    
    const volume = t_m * w_m * l_m * c;
    setResult(volume);
  }, [thickness, width, length, count]);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col p-6 relative">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Calculator className="text-slate-400" />
          حاسبة المكعبات
        </h2>
        <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-1 rounded border border-orange-200">معادلة m³</span>
      </div>

      <div className="space-y-4 flex-1">
        {/* Custom Auto-search Select */}
        <div className="relative" ref={dropdownRef}>
          <label className="block text-sm font-semibold text-slate-600 mb-1.5">اختيار الصنف (بحث تلقائي)</label>
          <div 
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-700 font-bold flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className="truncate">
              {selectedProduct ? selectedProduct.name : "-- ابحث عن الصنف --"}
            </span>
            <ChevronDown size={16} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </div>

          {isDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 flex flex-col">
              <div className="p-2 border-b border-slate-100 sticky top-0 bg-white rounded-t-lg flex items-center gap-2">
                <Search size={16} className="text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder="ابحث..."
                  className="w-full text-sm outline-none bg-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="overflow-y-auto flex-1">
                {filteredProducts.length === 0 ? (
                  <div className="p-3 text-center text-sm text-slate-500">لا توجد نتائج</div>
                ) : (
                  filteredProducts.map(p => (
                    <div
                      key={p.id}
                      className={`p-3 text-sm cursor-pointer hover:bg-slate-50 transition-colors ${selectedProduct?.id === p.id ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 font-medium'}`}
                      onClick={() => {
                        setSelectedProduct(p);
                        setIsDropdownOpen(false);
                        setSearchQuery(''); // Reset search on select
                      }}
                    >
                      {p.name}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 text-center">السمك (مم)</label>
            <input 
              type="number" 
              value={thickness}
              onChange={(e) => setThickness(Number(e.target.value))}
              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 text-center">العرض (سم)</label>
            <input 
              type="number" 
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 text-center">الطول (متر)</label>
            <input 
              type="number" 
              step="0.01"
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]" 
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1.5">عدد القطع / الألواح</label>
          <input 
            type="number" 
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full bg-orange-50/50 border border-orange-200 rounded-lg p-3 text-center text-xl font-black text-orange-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]" 
          />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <div className="bg-[#111827] text-white rounded-xl p-4 text-center">
          <span className="block text-xs font-semibold text-slate-400 mb-1">إجمالي الحجم المحسوب آلياً</span>
          <div className="text-3xl font-black text-[var(--color-brand-primary)]">
            <span className="text-lg text-white mr-1">m³</span> {result.toFixed(4)}
          </div>
        </div>
        <button className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
          <span>حفظ كمسودة سريع</span>
          <ShoppingCart size={18} />
        </button>
      </div>
    </div>
  );
}

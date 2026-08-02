import React, { useState } from 'react';
import { AlertTriangle, ArrowLeft, X } from 'lucide-react';

export function StagnantInventoryTracker({ stagnantInventory = [] }: { stagnantInventory?: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Fake Data Fallback
  const allStagnant = stagnantInventory.length > 0 ? stagnantInventory : [
    { variant: { product: { name: 'سادس فيدا 8338' } }, physicalQty: 450, lastUpdated: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString() },
    { variant: { product: { name: 'بياض شاليبورد 1' } }, physicalQty: 120, lastUpdated: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() },
    { variant: { product: { name: 'خامس سنداسا 6*2' } }, physicalQty: 85, lastUpdated: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString() },
  ];

  const displayStagnant = allStagnant.slice(0, 5);

  const calculateDaysStagnant = (lastUpdated: string) => {
    const diffTime = Math.abs(new Date().getTime() - new Date(lastUpdated).getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const ListContent = ({ data }: { data: any[] }) => (
    <div className="p-4 flex-1 space-y-3 overflow-y-auto">
      {data.length === 0 ? (
         <div className="text-center text-slate-500 py-6 text-sm">لا توجد أخشاب راكدة</div>
      ) : (
        data.map((item, idx) => (
          <div key={idx} className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex justify-between items-center">
            <div>
              <p className="font-bold text-sm text-slate-700">{item.variant?.product?.name}</p>
              <p className="text-xs text-slate-500 mt-1">المخزون: {item.physicalQty} وحدة</p>
            </div>
            <span className="text-red-500 font-bold text-sm">{calculateDaysStagnant(item.lastUpdated)} يوماً</span>
          </div>
        ))
      )}
    </div>
  );

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="text-orange-500" size={18} />
            الأخشاب الراكدة
          </h3>
          <div className="flex items-center gap-2">
            <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded">&gt; 60 يوم</span>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
              >
                عرض الكل
                <ArrowLeft size={14} />
              </button>
          </div>
        </div>
        <div className="max-h-[300px] overflow-hidden flex flex-col">
          <ListContent data={displayStagnant} />
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 text-orange-700 rounded-xl">
                  <AlertTriangle size={24} />
                </div>
                <h2 className="text-2xl font-black text-slate-800">الأخشاب الراكدة</h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 bg-slate-200 text-slate-600 hover:bg-slate-300 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <ListContent data={allStagnant} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

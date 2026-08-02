import React from 'react';
import { ArrowRightLeft, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Transfer {
  id: string;
  fromWarehouse: { name: string };
  toWarehouse: { name: string };
  variant: {
    product: { name: string };
    thickness: string;
    width: string;
    length: string;
  };
  quantity: number;
  createdAt: string;
  user?: { name: string };
}

interface RecentTransfersTrackerProps {
  transfers: Transfer[];
}

export function RecentTransfersTracker({ transfers }: RecentTransfersTrackerProps) {
  if (!transfers || transfers.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
            <ArrowRightLeft size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">أحدث التحويلات الداخلية</h2>
            <p className="text-sm text-slate-500">سجل بآخر البضائع المنقولة بين المخازن</p>
          </div>
        </div>
        <Link to="/inventory" className="text-sm font-bold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-xl transition-colors flex items-center gap-2">
          عرض الكل
          <ArrowLeft size={16} />
        </Link>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">التاريخ</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">من مخزن</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">إلى مخزن</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">المنتج (الصنف والمقاس)</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">الكمية</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transfers.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-slate-600 font-medium">
                    {new Date(t.createdAt).toLocaleDateString('ar-EG')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-800 font-semibold">
                  {t.fromWarehouse?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-800 font-semibold">
                  {t.toWarehouse?.name}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  <div className="font-bold">{t.variant.product.name}</div>
                  <div className="text-xs text-slate-400 font-mono" dir="ltr">
                    {t.variant.thickness}x{t.variant.width}x{t.variant.length}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-purple-100 text-purple-700">
                    {t.quantity} وحدة
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

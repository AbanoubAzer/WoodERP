import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { FileText, ArrowRight, Printer } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { PageLoader } from '../../../components/ui/Spinner';

export function CustomerStatement() {
  const { id } = useParams();
  const token = useAuthStore((state) => state.token);
  const [statementData, setStatementData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatement();
  }, [id]);

  const fetchStatement = async () => {
    try {
      // Use the new detailed endpoint we created in reports controller
      const res = await fetch(`/api/reports/customers/${id}/statement`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      setStatementData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageLoader text="جاري تحميل كشف حساب العميل..." />;
  if (!statementData?.customer) return <div className="p-12 text-center text-rose-500">العميل غير موجود</div>;

  return (
    <div className="space-y-6">
      {/* Controls: Hidden when printing */}
      <div className="print:hidden flex justify-between items-start bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <Link to="/customers" className="inline-flex items-center space-x-2 space-x-reverse text-[var(--color-brand-primary)] hover:underline mb-4 font-semibold text-sm">
            <ArrowRight size={16} />
            <span>العودة لقائمة العملاء</span>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{statementData.customer.name}</h1>
          <div className="text-slate-500 flex items-center space-x-4 space-x-reverse font-mono text-sm">
            <span>كود: {statementData.customer.code}</span>
            {statementData.customer.phone && <span>جوال: {statementData.customer.phone}</span>}
            {statementData.customer.taxNumber && <span>الرقم الضريبي: {statementData.customer.taxNumber}</span>}
          </div>
        </div>
        <div className="text-left">
          <button 
            onClick={() => window.print()}
            className="flex items-center space-x-2 space-x-reverse bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg"
          >
            <Printer size={20} />
            <span>طباعة الكشف</span>
          </button>
        </div>
      </div>

      {/* Print Document Layout */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 print:shadow-none print:border-none print:p-0 w-full" dir="rtl">
        
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-2xl font-bold mb-2">كشف حساب عميل</h1>
          <h2 className="text-xl font-semibold">{statementData.customer.name}</h2>
          {statementData.customer.phone && <p className="text-gray-600 text-sm mt-1">تليفون: {statementData.customer.phone}</p>}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-400 text-[13px] print:text-[11px]">
            <thead className="bg-slate-100 print:bg-slate-100">
              <tr>
                <th className="border border-slate-400 px-3 py-2 text-center w-28 whitespace-nowrap">التاريخ</th>
                <th className="border border-slate-400 px-3 py-2 text-center">البيان / الصنف</th>
                <th className="border border-slate-400 px-3 py-2 text-center w-16">كمية</th>
                <th className="border border-slate-400 px-3 py-2 text-center w-20">سعر المتر</th>
                <th className="border border-slate-400 px-3 py-2 text-center w-24">القيمة (مدين)</th>
                <th className="border border-slate-400 px-3 py-2 text-center w-24">الدفعات (دائن)</th>
                <th className="border border-slate-400 px-3 py-2 text-center w-28">الرصيد</th>
              </tr>
            </thead>
            <tbody>
              {statementData.statement.map((row: any, idx: number) => {
                const hasItems = row.items && row.items.length > 0;
                
                if (hasItems) {
                  // Render a row for each item in the invoice. Instead of rowSpan (which breaks across print pages), 
                  // we just leave the cells empty for subsequent items.
                  return row.items.map((item: any, itemIdx: number) => {
                    const isFirst = itemIdx === 0;
                    return (
                      <tr key={`${row.id}-${itemIdx}`} className="page-break-inside-avoid">
                        <td className="border border-slate-400 px-3 py-2 text-center whitespace-nowrap">
                          {isFirst ? new Date(row.date).toLocaleDateString('ar-EG') : ''}
                        </td>
                        <td className="border border-slate-400 px-3 py-2 text-right">{item.productName}</td>
                        <td className="border border-slate-400 px-3 py-2 text-center">{item.quantity}</td>
                        <td className="border border-slate-400 px-3 py-2 text-center">{Number(item.price).toFixed(2)}</td>
                        <td className="border border-slate-400 px-3 py-2 text-center font-semibold">{Number(item.subtotal).toFixed(2)}</td>
                        <td className="border border-slate-400 px-3 py-2 text-center text-green-700 font-semibold">
                          {isFirst && row.payment > 0 ? Number(row.payment).toFixed(2) : ''}
                        </td>
                        <td className="border border-slate-400 px-3 py-2 text-center font-bold bg-slate-50">
                          {isFirst ? Number(row.balance).toFixed(2) : ''}
                        </td>
                      </tr>
                    );
                  });
                } else {
                  // Render simple transaction (payment or general)
                  return (
                    <tr key={row.id} className="page-break-inside-avoid bg-slate-50/50">
                      <td className="border border-slate-400 px-3 py-2 text-center whitespace-nowrap">{new Date(row.date).toLocaleDateString('ar-EG')}</td>
                      <td className="border border-slate-400 px-3 py-2 text-right font-medium">{row.description}</td>
                      <td className="border border-slate-400 px-3 py-2 text-center">-</td>
                      <td className="border border-slate-400 px-3 py-2 text-center">-</td>
                      <td className="border border-slate-400 px-3 py-2 text-center text-red-700 font-semibold">{row.value > 0 ? Number(row.value).toFixed(2) : ''}</td>
                      <td className="border border-slate-400 px-3 py-2 text-center text-green-700 font-semibold">{row.payment > 0 ? Number(row.payment).toFixed(2) : ''}</td>
                      <td className="border border-slate-400 px-3 py-2 text-center font-bold bg-slate-100">{Number(row.balance).toFixed(2)}</td>
                    </tr>
                  );
                }
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Signature Area */}
        <div className="mt-12 flex justify-between px-12 print:mt-12 page-break-inside-avoid">
          <div className="text-center">
            <p className="font-bold border-b-2 border-slate-400 w-32 pb-1 mb-2 text-sm">توقيع المستلم</p>
          </div>
          <div className="text-center">
            <p className="font-bold border-b-2 border-slate-400 w-32 pb-1 mb-2 text-sm">توقيع المحاسب</p>
          </div>
        </div>
      </div>
    </div>
  );
}

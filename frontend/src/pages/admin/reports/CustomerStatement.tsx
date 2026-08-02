import React, { useState, useEffect } from 'react';
import { Download, FileText, Printer, FileSpreadsheet } from 'lucide-react';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';

export default function CustomerStatement() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [statementData, setStatementData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch customers for the dropdown
    const fetchCustomers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/reports/customers', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        setCustomers(json.data);
      } catch (err) {
        console.error('Error fetching customers', err);
      }
    };
    fetchCustomers();
  }, []);

  const fetchStatement = async (customerId: string) => {
    if (!customerId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/reports/customers/${customerId}/statement`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      setStatementData(json);
    } catch (err) {
      console.error('Error fetching statement', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls: Hidden when printing */}
      <div className="print:hidden bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-end gap-4">
        <div className="flex-1 w-full">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">العميل</label>
            <SearchableSelect
              options={customers.map((c: any) => ({ value: c.id, label: c.name }))}
              value={selectedCustomerId}
              onChange={(val: string) => {
                setSelectedCustomerId(val);
                fetchStatement(val);
              }}
              placeholder="-- اختر العميل --"
            />
          </div>
        </div>
        
        {statementData && (
          <button 
            onClick={() => window.print()}
            className="bg-slate-800 text-white px-6 py-2 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الكشف</span>
          </button>
        )}
      </div>

      {loading && <div className="text-center py-8">جاري التحميل...</div>}

      {/* Print Document Layout */}
      {statementData && !loading && (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 print:shadow-none print:border-none print:p-0 w-full" dir="rtl">
          
          {/* Header */}
          <div className="text-center border-b-2 border-black pb-4 mb-6">
            <h1 className="text-2xl font-bold mb-2">كشف حساب عميل</h1>
            <h2 className="text-xl font-semibold">{statementData.customer.name}</h2>
            {statementData.customer.phone && <p className="text-gray-600 text-sm mt-1">تليفون: {statementData.customer.phone}</p>}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-black text-sm">
              <thead className="bg-gray-100 print:bg-gray-100">
                <tr>
                  <th className="border border-black px-4 py-2 text-center w-32">التاريخ</th>
                  <th className="border border-black px-4 py-2 text-center">البيان</th>
                  <th className="border border-black px-4 py-2 text-center w-24">كمية</th>
                  <th className="border border-black px-4 py-2 text-center w-24">سعر المتر</th>
                  <th className="border border-black px-4 py-2 text-center w-28">القيمة (مدين)</th>
                  <th className="border border-black px-4 py-2 text-center w-28">الدفعات (دائن)</th>
                  <th className="border border-black px-4 py-2 text-center w-28">الرصيد</th>
                </tr>
              </thead>
              <tbody>
                {/* Opening Balance or just raw transactions */}
                {statementData.statement.map((row: any, idx: number) => {
                  const hasItems = row.items && row.items.length > 0;
                  
                  if (hasItems) {
                    // Render a row for each item in the invoice to match the provided image
                    return row.items.map((item: any, itemIdx: number) => (
                      <tr key={`${row.id}-${itemIdx}`}>
                        {itemIdx === 0 && (
                          <td className="border border-black px-4 py-2 text-center" rowSpan={row.items.length}>
                            {new Date(row.date).toLocaleDateString('ar-EG')}
                          </td>
                        )}
                        <td className="border border-black px-4 py-2 text-right">{item.productName}</td>
                        <td className="border border-black px-4 py-2 text-center">{item.quantity}</td>
                        <td className="border border-black px-4 py-2 text-center">{item.price}</td>
                        <td className="border border-black px-4 py-2 text-center font-semibold">{item.subtotal}</td>
                        {itemIdx === 0 && (
                          <td className="border border-black px-4 py-2 text-center text-green-700" rowSpan={row.items.length}>
                            {row.payment > 0 ? row.payment : ''}
                          </td>
                        )}
                        {itemIdx === 0 && (
                          <td className="border border-black px-4 py-2 text-center font-bold bg-gray-50" rowSpan={row.items.length}>
                            {row.balance.toFixed(2)}
                          </td>
                        )}
                      </tr>
                    ));
                  } else {
                    // Render simple transaction (payment or general)
                    return (
                      <tr key={row.id}>
                        <td className="border border-black px-4 py-2 text-center">{new Date(row.date).toLocaleDateString('ar-EG')}</td>
                        <td className="border border-black px-4 py-2 text-right font-medium">{row.description}</td>
                        <td className="border border-black px-4 py-2 text-center">-</td>
                        <td className="border border-black px-4 py-2 text-center">-</td>
                        <td className="border border-black px-4 py-2 text-center text-red-700 font-semibold">{row.value > 0 ? row.value : ''}</td>
                        <td className="border border-black px-4 py-2 text-center text-green-700 font-semibold">{row.payment > 0 ? row.payment : ''}</td>
                        <td className="border border-black px-4 py-2 text-center font-bold bg-gray-50">{row.balance.toFixed(2)}</td>
                      </tr>
                    );
                  }
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Signature Area */}
          <div className="mt-12 flex justify-between px-12 print:mt-16">
            <div className="text-center">
              <p className="font-bold border-b border-black w-32 pb-1">توقيع المستلم</p>
            </div>
            <div className="text-center">
              <p className="font-bold border-b border-black w-32 pb-1">توقيع المحاسب</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

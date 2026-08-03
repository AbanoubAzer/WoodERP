import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { Printer, ArrowRight } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { PageLoader } from '../../../components/ui/Spinner';

export function InvoiceView() {
  const { id } = useParams();
  const token = useAuthStore(state => state.token);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/sales/invoices/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoice(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageLoader text="جاري تحميل فاتورة البيع..." />;
  if (!invoice) return <div className="p-12 text-center text-rose-500">الفاتورة غير موجودة</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <Link to="/sales/invoices" className="flex items-center space-x-2 space-x-reverse text-emerald-600 font-bold hover:underline">
          <ArrowRight size={20} />
          <span>العودة للمبيعات</span>
        </Link>
        <button onClick={() => window.print()} className="flex items-center space-x-2 space-x-reverse bg-slate-900 text-white px-6 py-2 rounded-lg font-bold">
          <Printer size={20} />
          <span>طباعة A4</span>
        </button>
      </div>

      <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-0">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-8 mb-8">
          <div>
            <h1 className="text-4xl font-black text-slate-900 mb-2">فاتورة مبيعات</h1>
            <p className="text-lg text-slate-600">رقم الفاتورة: <span className="font-mono text-slate-900 font-bold">{invoice.invoiceNumber}</span></p>
            <p className="text-slate-500">التاريخ: {new Date(invoice.issuedAt).toLocaleDateString('ar-EG')}</p>
          </div>
          <div className="text-left">
            <h2 className="text-2xl font-bold text-emerald-700">Wood ERP</h2>
            <p className="text-slate-500 mt-1">تجارة الأخشاب والمستلزمات</p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-10 bg-slate-50 p-6 rounded-xl border border-slate-200">
          <h3 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">بيانات العميل</h3>
          <p className="text-2xl font-bold text-slate-900 mb-1">{invoice.customer.name}</p>
          {invoice.customer.companyName && <p className="text-slate-600">{invoice.customer.companyName}</p>}
          <div className="flex items-center space-x-6 space-x-reverse mt-3 text-sm text-slate-500 font-mono">
            {invoice.customer.phone && <span>جوال: {invoice.customer.phone}</span>}
            {invoice.customer.taxNumber && <span>رقم ضريبي: {invoice.customer.taxNumber}</span>}
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-right mb-10">
          <thead className="border-b-2 border-slate-300 bg-slate-100">
            <tr>
              <th className="py-3 px-4 font-bold text-slate-700">م</th>
              <th className="py-3 px-4 font-bold text-slate-700">الصنف</th>
              <th className="py-3 px-4 font-bold text-slate-700">المستودع</th>
              <th className="py-3 px-4 font-bold text-slate-700 text-center">الكمية</th>
              <th className="py-3 px-4 font-bold text-slate-700 text-center">سعر الوحدة</th>
              <th className="py-3 px-4 font-bold text-slate-700">الإجمالي</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {invoice.items.map((item: any, idx: number) => (
              <tr key={item.id}>
                <td className="py-4 px-4 text-slate-500">{idx + 1}</td>
                <td className="py-4 px-4">
                  <p className="font-bold text-slate-900">{item.variant.product.name}</p>
                  <p className="text-xs text-slate-500 font-mono mt-1">SKU: {item.variant.sku}</p>
                </td>
                <td className="py-4 px-4 text-sm text-slate-600">{item.warehouse.name}</td>
                <td className="py-4 px-4 text-center font-bold text-slate-800">{item.quantity}</td>
                <td className="py-4 px-4 text-center text-slate-600">{item.unitPrice.toLocaleString()}</td>
                <td className="py-4 px-4 font-bold text-slate-900">{item.subtotal.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-72 bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div className="flex justify-between mb-3 text-slate-600">
              <span>المجموع الفرعي:</span>
              <span className="font-bold">{invoice.subtotal.toLocaleString()} ج.م</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between mb-3 text-rose-600">
                <span>الخصم:</span>
                <span className="font-bold">- {invoice.discount.toLocaleString()} ج.م</span>
              </div>
            )}
            <div className="flex justify-between mt-4 pt-4 border-t-2 border-slate-300 text-xl font-black text-emerald-700">
              <span>الإجمالي:</span>
              <span>{invoice.totalAmount.toLocaleString()} ج.م</span>
            </div>
            
            {/* Payment Summary */}
            {invoice.paymentMethod?.name && (
              <div className="flex justify-between mt-2 text-slate-700">
                <span>طريقة السداد:</span>
                <span className="font-bold text-slate-800">{invoice.paymentMethod.name}</span>
              </div>
            )}
            {invoice.amountPaid > 0 && (
              <div className="flex justify-between mt-2 text-slate-700">
                <span>المبلغ المدفوع:</span>
                <span className="font-bold text-emerald-600">{invoice.amountPaid.toLocaleString()} ج.م</span>
              </div>
            )}
            {invoice.installmentPlan && (
              <div className="flex justify-between mt-2 text-rose-600 font-bold">
                <span>الباقي تقسيط:</span>
                <span>{(invoice.totalAmount - invoice.amountPaid).toLocaleString()} ج.م</span>
              </div>
            )}
          </div>
        </div>

        {/* Installments Schedule */}
        {invoice.installmentPlan && (
          <div className="mt-12 border-t-2 border-slate-800 pt-8">
            <h3 className="text-xl font-black text-slate-900 mb-4">جدول الأقساط والدفعات</h3>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <div className="flex gap-8 mb-6 text-sm text-slate-600">
                <p><strong>عدد الدفعات:</strong> {invoice.installmentPlan.numberOfMonths} دفعات</p>
                <p><strong>إجمالي مبلغ التقسيط (شامل الفوائد إن وجدت):</strong> {invoice.installmentPlan.totalAmount.toLocaleString()} ج.م</p>
              </div>
              <table className="w-full text-right bg-white rounded-lg overflow-hidden border border-slate-200">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-4 font-bold text-slate-700">رقم الدفعة / القسط</th>
                    <th className="py-2 px-4 font-bold text-slate-700 text-center">تاريخ الاستحقاق (التحصيل)</th>
                    <th className="py-2 px-4 font-bold text-slate-700 text-left">المبلغ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.installmentPlan.installments.map((inst: any) => (
                    <tr key={inst.id}>
                      <td className="py-2 px-4 text-slate-600 font-medium">دفعة #{inst.installmentNumber}</td>
                      <td className="py-2 px-4 text-center text-slate-600 font-mono">
                        {inst.dueDate ? new Date(inst.dueDate).toLocaleDateString('ar-EG') : 'دفعة بدون تاريخ (مرنة)'}
                      </td>
                      <td className="py-2 px-4 text-left font-bold text-slate-900">{inst.amount.toLocaleString()} ج.م</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

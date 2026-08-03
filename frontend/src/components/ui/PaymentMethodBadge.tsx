import React from 'react';

interface PaymentMethodBadgeProps {
  name?: string;
  isPayment?: boolean;
  className?: string;
}

export function PaymentMethodBadge({ name, isPayment = false, className = '' }: PaymentMethodBadgeProps) {
  const methodStr = (name || (isPayment ? 'نقدي / تحصيل' : 'آجل / تقسيط')).trim();

  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';

  if (methodStr.includes('InstaPay') || methodStr.includes('انستا') || methodStr.includes('إنستا')) {
    badgeStyle = 'bg-purple-50 text-purple-700 border-purple-200/80';
  } else if (methodStr.includes('تحويل') || methodStr.includes('بنك') || methodStr.includes('Bank')) {
    badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
  } else if (methodStr.includes('نقدي') || methodStr.includes('كاش') || methodStr.includes('Cash')) {
    badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
  } else if (methodStr.includes('آجل') || methodStr.includes('تقسيط') || methodStr.includes('مؤجل')) {
    badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200/80';
  } else if (methodStr.includes('فيزا') || methodStr.includes('Visa') || methodStr.includes('بطاقة')) {
    badgeStyle = 'bg-sky-50 text-sky-700 border-sky-200/80';
  }

  return (
    <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeStyle} ${className}`}>
      {methodStr}
    </span>
  );
}

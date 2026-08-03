import React from 'react';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-10 h-10',
  xl: 'w-16 h-16',
};

export function Spinner({ size = 'md', color = 'text-[var(--color-brand-primary)]', className = '' }: SpinnerProps) {
  return (
    <Loader2
      className={`animate-spin ${sizeClasses[size]} ${color} ${className}`}
    />
  );
}

interface PageLoaderProps {
  text?: string;
}

export function PageLoader({ text = 'جاري جلب البيانات...' }: PageLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 min-h-[400px] w-full text-center space-y-4 my-auto self-center" dir="rtl">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing aura */}
        <div className="absolute w-20 h-20 rounded-full bg-emerald-500/20 animate-ping" />
        {/* Inner Spinner */}
        <div className="relative p-5 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 flex items-center justify-center">
          <Spinner size="lg" color="text-emerald-600" />
        </div>
      </div>
      <p className="text-sm font-bold text-slate-700 animate-pulse tracking-wide font-cairo">{text}</p>
    </div>
  );
}

interface TableLoaderProps {
  cols?: number;
  rows?: number;
  text?: string;
}

export function TableLoader({ cols = 5, text = 'جاري تحميل البيانات...' }: TableLoaderProps) {
  return (
    <tr>
      <td colSpan={cols} className="py-16 text-center">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-12 h-12 rounded-full bg-emerald-500/20 animate-ping" />
            <div className="relative p-3 bg-white rounded-xl shadow-md border border-slate-100 flex items-center justify-center">
              <Spinner size="md" color="text-emerald-600" />
            </div>
          </div>
          <span className="text-sm font-bold text-slate-600 animate-pulse font-cairo mt-2">{text}</span>
        </div>
      </td>
    </tr>
  );
}

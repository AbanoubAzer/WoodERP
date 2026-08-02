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
    <div className="flex flex-col items-center justify-center p-12 min-h-[300px] w-full text-center space-y-4" dir="rtl">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing aura */}
        <div className="absolute w-16 h-16 rounded-full bg-[var(--color-brand-primary)]/20 animate-ping" />
        {/* Inner Spinner */}
        <div className="relative p-4 bg-white rounded-2xl shadow-xl border border-slate-100 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </div>
      <p className="text-sm font-bold text-slate-600 animate-pulse tracking-wide">{text}</p>
    </div>
  );
}

interface TableLoaderProps {
  cols?: number;
  rows?: number;
  text?: string;
}

export function TableLoader({ cols = 5, text = 'جاري التحميل...' }: TableLoaderProps) {
  return (
    <tr>
      <td colSpan={cols} className="py-12 text-center">
        <div className="flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <span className="text-sm font-bold text-slate-500 animate-pulse">{text}</span>
        </div>
      </td>
    </tr>
  );
}

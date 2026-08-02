import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  subtitleColor?: string;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  colorBorder: string; // e.g. 'border-blue-500'
}

export function KpiCard({
  title,
  value,
  subtitle,
  subtitleColor = 'text-slate-500',
  subtext,
  trend,
  colorBorder
}: KpiCardProps) {
  return (
    <div className={twMerge(
      "bg-white rounded-xl shadow-sm p-6 relative overflow-hidden flex flex-col justify-center items-center text-center",
      "border-r-4", // In RTL, the colored bar is on the right
      colorBorder
    )}>
      <h3 className="text-sm font-semibold text-slate-500 mb-2">{title}</h3>
      <div className="flex items-baseline justify-center gap-1">
        {trend === 'up' && <span className="text-emerald-500 font-bold text-2xl">+</span>}
        {trend === 'down' && <span className="text-red-500 font-bold text-2xl">-</span>}
        <span className="text-3xl font-extrabold text-slate-800">{value}</span>
      </div>
      
      {subtitle && (
        <p className={twMerge("text-sm mt-1 font-bold", subtitleColor)}>{subtitle}</p>
      )}
      
      {subtext && (
        <div className="mt-2 text-xs text-slate-500 flex items-center justify-center gap-1">
          {trend === 'up' && <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />}
          {trend === 'down' && <span className="text-red-500">⚠️</span>}
          {subtext}
        </div>
      )}
    </div>
  );
}

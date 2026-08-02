import React from 'react';

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

export function TableSkeleton({ rows = 5, cols = 5 }: TableSkeletonProps) {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="flex gap-4 p-4 bg-slate-50 border-b border-slate-100 rounded-t-xl">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="flex-1 h-4 bg-slate-200 rounded-full" />
        ))}
      </div>
      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4 p-4 border-b border-slate-50">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <div
              key={colIdx}
              className="flex-1 h-3.5 bg-slate-100 rounded-full"
              style={{ width: `${60 + Math.random() * 40}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
      <div className="h-4 bg-slate-200 rounded-full w-1/3 mb-4" />
      <div className="h-8 bg-slate-100 rounded-full w-2/3 mb-2" />
      <div className="h-3 bg-slate-100 rounded-full w-1/2" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 max-w-[1600px] mx-auto animate-pulse">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-slate-200 rounded-3xl h-36" />
        ))}
      </div>
      {/* Content */}
      <div className="bg-white rounded-3xl h-64 border border-slate-100" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl h-80 border border-slate-100" />
        <div className="bg-white rounded-3xl h-80 border border-slate-100" />
      </div>
    </div>
  );
}

import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl">
      <p className="text-xs text-slate-500 font-medium">
        عرض <span className="font-bold text-slate-800">{startItem}</span> إلى{' '}
        <span className="font-bold text-slate-800">{endItem}</span> من أصل{' '}
        <span className="font-bold text-slate-800">{totalItems}</span> عنصر
      </p>

      <div className="flex items-center gap-1">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          title="الصفحة السابقة"
        >
          <ChevronRight size={18} />
        </button>

        {Array.from({ length: totalPages }).map((_, idx) => {
          const page = idx + 1;
          // Show first, last, current, and adjacent pages
          if (
            page === 1 ||
            page === totalPages ||
            (page >= currentPage - 1 && page <= currentPage + 1)
          ) {
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                  currentPage === page
                    ? 'bg-[var(--color-brand-primary)] text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {page}
              </button>
            );
          }
          if (page === currentPage - 2 || page === currentPage + 2) {
            return <span key={page} className="text-slate-400 text-xs px-1">...</span>;
          }
          return null;
        })}

        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          title="الصفحة التالية"
        >
          <ChevronLeft size={18} />
        </button>
      </div>
    </div>
  );
}

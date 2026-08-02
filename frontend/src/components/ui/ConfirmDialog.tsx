import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ 
  isOpen, title, message, 
  confirmLabel = 'تأكيد', cancelLabel = 'إلغاء', 
  variant = 'default',
  onConfirm, onCancel 
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const colors = {
    danger: { bg: 'bg-rose-600 hover:bg-rose-700', icon: 'bg-rose-100 text-rose-600' },
    warning: { bg: 'bg-amber-600 hover:bg-amber-700', icon: 'bg-amber-100 text-amber-600' },
    default: { bg: 'bg-slate-900 hover:bg-slate-800', icon: 'bg-slate-100 text-slate-600' },
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <div className={`mx-auto w-14 h-14 rounded-2xl ${colors[variant].icon} flex items-center justify-center mb-4`}>
            <AlertTriangle size={28} />
          </div>
          <h3 className="text-lg font-black text-slate-900 mb-2">{title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
        </div>
        <div className="flex border-t border-slate-100">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3.5 text-sm font-bold text-white ${colors[variant].bg} transition-colors`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

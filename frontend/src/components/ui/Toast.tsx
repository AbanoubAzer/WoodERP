import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToastStore } from '../../store/toastStore';

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-rose-50 border-rose-200 text-rose-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const iconStyles = {
  success: 'text-emerald-500',
  error: 'text-rose-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
};

export function ToastContainer() {
  const toasts = useToastStore(state => state.toasts);
  const removeToast = useToastStore(state => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-6 z-[300] flex flex-col gap-3 max-w-sm" dir="rtl">
      {toasts.map(t => {
        const Icon = icons[t.type];
        return (
          <div
            key={t.id}
            className={`flex items-start gap-3 p-4 rounded-2xl border shadow-lg backdrop-blur-sm ${styles[t.type]} animate-in slide-in-from-bottom-4 fade-in duration-300`}
          >
            <Icon size={20} className={`mt-0.5 flex-shrink-0 ${iconStyles[t.type]}`} />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{t.title}</p>
              {t.message && <p className="text-xs opacity-80 mt-0.5">{t.message}</p>}
            </div>
            <button onClick={() => removeToast(t.id)} className="opacity-50 hover:opacity-100 transition-opacity flex-shrink-0">
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

import { create } from 'zustand';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    set(state => ({ toasts: [...state.toasts, { ...toast, id }] }));
    // Auto-remove after 4 seconds
    setTimeout(() => {
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, 4000);
  },
  removeToast: (id) => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }))
}));

// Convenience helpers
export const toast = {
  success: (title: string, message?: string) => useToastStore.getState().addToast({ type: 'success', title, message }),
  error: (title: string, message?: string) => useToastStore.getState().addToast({ type: 'error', title, message }),
  warning: (title: string, message?: string) => useToastStore.getState().addToast({ type: 'warning', title, message }),
  info: (title: string, message?: string) => useToastStore.getState().addToast({ type: 'info', title, message }),
};

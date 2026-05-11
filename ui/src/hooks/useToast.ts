import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  
  addToast: (message, type = 'info', duration = 3000) => {
    const id = crypto.randomUUID();
    set((state) => ({ 
      toasts: [...state.toasts, { id, message, type, duration }] 
    }));
    // Auto-remove after duration
    setTimeout(() => {
      set((state) => ({ 
        toasts: state.toasts.filter((t) => t.id !== id) 
      }));
    }, duration);
  },
  
  removeToast: (id) => set((state) => ({ 
    toasts: state.toasts.filter((t) => t.id !== id) 
  })),
  
  clearToasts: () => set({ toasts: [] }),
}));

// Helper to get toast icon class
export const getToastIcon = (type: ToastType): string => {
  const icons: Record<ToastType, string> = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle',
  };
  return icons[type];
};

// Helper to get toast color class
export const getToastClass = (type: ToastType): string => {
  const classes: Record<ToastType, string> = {
    success: 'bg-emerald-500/20 border-emerald-500 text-emerald-400',
    error: 'bg-red-500/20 border-red-500 text-red-400',
    warning: 'bg-yellow-500/20 border-yellow-500 text-yellow-400',
    info: 'bg-blue-500/20 border-blue-500 text-blue-400',
  };
  return classes[type];
};

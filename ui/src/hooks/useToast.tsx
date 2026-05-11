import { create } from 'zustand';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, type: Toast['type'], duration?: number) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const DEFAULT_DURATION = 3000;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  
  addToast: (message, type = 'info', duration = DEFAULT_DURATION) => {
    const id = crypto.randomUUID();
    
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }));
    
    // Auto-remove after duration
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },
  
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
    
  clearToasts: () => set({ toasts: [] }),
}));

// Convenience hook for components
export function useToast() {
  const { addToast, removeToast } = useToastStore();
  
  return {
    success: (message: string, duration?: number) => addToast(message, 'success', duration),
    error: (message: string, duration?: number) => addToast(message, 'error', duration),
    warning: (message: string, duration?: number) => addToast(message, 'warning', duration),
    info: (message: string, duration?: number) => addToast(message, 'info', duration),
    dismiss: removeToast,
  };
}

// Toast Container Component
export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();
  
  if (toasts.length === 0) return null;
  
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          onClick={() => removeToast(toast.id)}
        >
          <i className={`fas fa-${getIcon(toast.type)} mr-2`} />
          {toast.message}
        </div>
      ))}
    </div>
  );
}

function getIcon(type: Toast['type']): string {
  switch (type) {
    case 'success': return 'check-circle';
    case 'error': return 'exclamation-circle';
    case 'warning': return 'exclamation-triangle';
    case 'info': return 'info-circle';
    default: return 'info-circle';
  }
}

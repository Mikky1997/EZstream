'use client';

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
}

// ============================================================================
// Context
// ============================================================================

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

interface ToastProviderProps {
  children: ReactNode;
  /** Default duration in milliseconds (default: 4000) */
  defaultDuration?: number;
  /** Maximum number of toasts to show at once */
  maxToasts?: number;
}

export function ToastProvider({
  children,
  defaultDuration = 4000,
  maxToasts = 1,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration?: number) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      const toastDuration = duration ?? defaultDuration;

      setToasts(prev => {
        // Limit number of toasts
        const newToasts = [...prev, { id, message, type, duration: toastDuration }];
        if (newToasts.length > maxToasts) {
          return newToasts.slice(-maxToasts);
        }
        return newToasts;
      });

      // Auto-dismiss after duration
      if (toastDuration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, toastDuration);
      }
    },
    [defaultDuration, maxToasts, dismissToast]
  );

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const contextValue = useMemo(
    () => ({
      toasts,
      showToast,
      dismissToast,
      clearToasts,
    }),
    [toasts, showToast, dismissToast, clearToasts]
  );

  return <ToastContext.Provider value={contextValue}>{children}</ToastContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

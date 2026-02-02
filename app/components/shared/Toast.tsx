'use client';

import { memo, useState } from 'react';
import { useToast } from '@/app/contexts/ToastContext';
import type { Toast as ToastType, ToastType as ToastVariant } from '@/app/contexts/ToastContext';

// ============================================================================
// Single Toast Component
// ============================================================================

interface ToastItemProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

const ToastItem = memo(function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 200);
  };

  // Black background, theme reddish outline
  const getTypeStyles = (_type: ToastVariant): string => {
    return 'bg-black border border-red-500';
  };

  const getIcon = (type: ToastVariant) => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
        );
    }
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`flex items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3 rounded-lg border shadow-lg text-white transition-all duration-200 min-w-0 ${getTypeStyles(
        toast.type
      )} ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}`}
    >
      <span className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 [&>svg]:w-full [&>svg]:h-full">
        {getIcon(toast.type)}
      </span>
      <p className="flex-1 min-w-0 text-xs font-medium sm:text-sm truncate">{toast.message}</p>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 rounded hover:bg-white/20 transition-colors touch-manipulation"
        aria-label="Dismiss notification"
      >
        <svg
          className="w-3.5 h-3.5 sm:w-4 sm:h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
});

// ============================================================================
// Toast Container
// ============================================================================

interface ToastContainerProps {
  toasts: ToastType[];
  onDismiss: (id: string) => void;
  /** Position of the toast container */
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';
}

const positionClasses: Record<string, string> = {
  'top-right': 'top-2 left-2 right-2 sm:left-auto sm:right-4 sm:top-4',
  'top-left': 'top-2 left-2 right-2 sm:right-auto sm:left-4 sm:top-4',
  'bottom-right': 'bottom-2 left-2 right-2 sm:left-auto sm:right-4 sm:bottom-4',
  'bottom-left': 'bottom-2 left-2 right-2 sm:right-auto sm:left-4 sm:bottom-4',
  'top-center': 'top-2 left-2 right-2 sm:left-1/2 sm:right-auto sm:top-4 sm:-translate-x-1/2',
  'bottom-center':
    'bottom-2 left-2 right-2 sm:left-1/2 sm:right-auto sm:bottom-4 sm:-translate-x-1/2',
};

export const ToastContainer = memo(function ToastContainer({
  toasts,
  onDismiss,
  position = 'top-right',
}: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className={`fixed z-50 flex flex-col gap-2 w-[calc(100vw-1rem)] max-w-sm sm:w-full ${positionClasses[position]}`}
      aria-label="Notifications"
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
});

// ============================================================================
// Global Toast Display Component
// ============================================================================

/**
 * Global toast display component - add to layout
 *
 * @example
 * ```tsx
 * // In layout.tsx
 * <ToastProvider>
 *   {children}
 *   <ToastDisplay />
 * </ToastProvider>
 * ```
 */
export function ToastDisplay() {
  const { toasts, dismissToast } = useToast();
  return <ToastContainer toasts={toasts} onDismiss={dismissToast} />;
}

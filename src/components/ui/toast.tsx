'use client'

import { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
  exiting?: boolean
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

const TOAST_DURATION = 4000
const EXIT_DURATION = 400

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const removeToast = useCallback((id: string) => {
    // Clear any existing timer
    const existing = timersRef.current.get(id)
    if (existing) clearTimeout(existing)
    timersRef.current.delete(id)

    // Start exit animation
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)))

    // Remove after animation completes
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, EXIT_DURATION)
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, message, type }])

    // Auto-dismiss
    const timer = setTimeout(() => removeToast(id), TOAST_DURATION)
    timersRef.current.set(id, timer)
  }, [removeToast])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer))
    }
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto"
            style={{
              animation: t.exiting
                ? `toast-exit ${EXIT_DURATION}ms ease-in forwards`
                : `toast-enter 400ms cubic-bezier(0.21, 1.02, 0.73, 1) forwards`,
            }}
          >
            <div
              className={`flex items-center gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-sm ${
                t.type === 'success'
                  ? 'bg-green-50/95 dark:bg-green-900/30 border-green-200 dark:border-green-800/30 text-green-700 dark:text-green-400'
                  : t.type === 'error'
                    ? 'bg-red-50/95 dark:bg-red-900/30 border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400'
                    : 'bg-white/95 dark:bg-zinc-900/95 border-[var(--border)] text-[var(--foreground)]'
              }`}
            >
              {t.type === 'success' && <CheckCircle size={18} className="flex-shrink-0" />}
              {t.type === 'error' && <AlertCircle size={18} className="flex-shrink-0" />}
              {t.type === 'info' && <Info size={18} className="flex-shrink-0" />}
              <p className="text-sm font-medium flex-1">{t.message}</p>
              <button
                onClick={() => removeToast(t.id)}
                className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Keyframe animations */}
      <style jsx global>{`
        @keyframes toast-enter {
          0% {
            opacity: 0;
            transform: translateX(100%) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @keyframes toast-exit {
          0% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateX(100%) scale(0.95);
          }
        }
      `}</style>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

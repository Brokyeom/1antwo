"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "destructive";

type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type ToastFn = (message: string, options?: { variant?: ToastVariant }) => void;

const ToastContext = createContext<ToastFn | null>(null);

const TOAST_DURATION_MS = 4000;

export function useToast() {
  const toast = useContext(ToastContext);
  if (!toast) {
    throw new Error("useToast must be used inside ToastProvider.");
  }
  return toast;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback<ToastFn>(
    (message, options) => {
      counterRef.current += 1;
      const id = counterRef.current;
      setToasts((current) => [...current.slice(-4), { id, message, variant: options?.variant || "default" }]);
      window.setTimeout(() => dismiss(id), TOAST_DURATION_MS);
    },
    [dismiss],
  );

  const value = useMemo(() => toast, [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
        {toasts.map((item) => (
          <div
            key={item.id}
            role="status"
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-lg border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-lg",
              item.variant === "destructive" && "border-destructive/40 bg-destructive/10 text-destructive",
            )}
          >
            {item.variant === "destructive" ? (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            )}
            <span className="min-w-0 flex-1 break-words leading-5">{item.message}</span>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

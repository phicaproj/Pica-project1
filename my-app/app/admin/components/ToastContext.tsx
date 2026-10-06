"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { useTheme } from "@/app/components/theme-provider";

export type ToastType = "success" | "error" | "info";

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove after 13 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 13000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-4 max-w-sm w-full">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: () => void }) {
  const { dark } = useTheme();
  const d = dark;
  
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const duration = 13000;
    const interval = 50; // Update every 50ms
    const step = 100 / (duration / interval);
    
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const bgClass = d ? "bg-[#1a1f2e] border-white/10" : "bg-white border-gray-200";
  const textClass = d ? "text-white" : "text-gray-900";
  
  const typeStyles = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      barColor: "bg-emerald-500",
    },
    error: {
      icon: <AlertCircle className="w-5 h-5 text-red-500" />,
      barColor: "bg-red-500",
    },
    info: {
      icon: <Info className="w-5 h-5 text-blue-500" />,
      barColor: "bg-blue-500",
    },
  };

  const style = typeStyles[toast.type];

  return (
    <div className={`relative flex items-start gap-3 p-4 border rounded-lg shadow-lg ${bgClass} animate-in slide-in-from-right-8 fade-in duration-300 overflow-hidden`}>
      <div className="flex-shrink-0 mt-0.5">
        {style.icon}
      </div>
      <div className={`flex-1 text-sm font-medium ${textClass}`}>
        {toast.message}
      </div>
      <button
        onClick={onRemove}
        className={`flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity ${d ? "text-gray-400" : "text-gray-500"}`}
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 h-1 w-full bg-black/10 dark:bg-white/10">
        <div 
          className={`h-full transition-all duration-75 ease-linear ${style.barColor}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

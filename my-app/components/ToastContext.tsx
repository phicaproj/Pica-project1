"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

type ToastType = "success" | "error";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      removeToast(id);
    }, 13000); // 13 seconds
  }, [removeToast]);

  const success = useCallback((message: string) => toast(message, "success"), [toast]);
  const error = useCallback((message: string) => toast(message, "error"), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error }}>
      {children}
      <div className="fixed top-4 right-4 z-[99999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto relative overflow-hidden rounded-xl shadow-2xl p-4 min-w-[300px] max-w-[400px] flex items-start gap-3 backdrop-blur-md transform transition-all duration-300 ${
              t.type === "success" 
                ? "bg-white border border-green-200 text-green-800 dark:bg-[#161b22] dark:border-green-900/50 dark:text-green-400" 
                : "bg-white border border-red-200 text-red-800 dark:bg-[#161b22] dark:border-red-900/50 dark:text-red-400"
            }`}
          >
            {t.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            )}
            
            <div className="flex-1 font-medium text-sm pr-4">
              {t.message}
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="absolute top-4 right-3 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Receding progress bar */}
            <div
              className={`absolute bottom-0 left-0 h-1 transition-all ease-linear ${
                t.type === "success" ? "bg-green-500" : "bg-red-500"
              }`}
              style={{
                width: '100%',
                animation: 'toast-progress 13s linear forwards'
              }}
            />
          </div>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}} />
    </ToastContext.Provider>
  );
};

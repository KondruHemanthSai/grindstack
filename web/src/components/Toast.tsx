import React, { createContext, useContext, useState, useCallback } from "react";

interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastContextType {
  showToast: (message: string, type?: ToastItem["type"]) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastItem["type"] = "success") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2800);
  }, []);

  const colorMap: Record<ToastItem["type"], { bg: string; border: string; icon: string }> = {
    success: { bg: "rgba(34, 197, 94, 0.12)", border: "rgba(34, 197, 94, 0.3)", icon: "✓" },
    error:   { bg: "rgba(239, 68, 68, 0.12)",  border: "rgba(239, 68, 68, 0.3)",  icon: "✕" },
    info:    { bg: "rgba(99, 102, 241, 0.12)", border: "rgba(99, 102, 241, 0.3)", icon: "ℹ" },
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: "90px", // above the nav bar
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          pointerEvents: "none",
          width: "calc(100% - 40px)",
          maxWidth: "400px",
        }}
      >
        {toasts.map(toast => {
          const colors = colorMap[toast.type];
          return (
            <div
              key={toast.id}
              style={{
                padding: "12px 16px",
                borderRadius: "12px",
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                color: "var(--text-primary)",
                fontSize: "14px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
                animation: "toastIn 0.25s ease",
              }}
            >
              <span style={{ fontSize: "16px", flexShrink: 0 }}>{colors.icon}</span>
              <span style={{ flex: 1 }}>{toast.message}</span>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
};

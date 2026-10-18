'use client';
import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const success = (m) => toast(m, 'success');
  const error = (m) => toast(m, 'error');
  const info = (m) => toast(m, 'info');
  const warning = (m) => toast(m, 'warning');

  const COLORS = {
    success: { bg: 'linear-gradient(135deg,#10b981,#059669)', icon: '✅' },
    error:   { bg: 'linear-gradient(135deg,#ef4444,#dc2626)', icon: '❌' },
    warning: { bg: 'linear-gradient(135deg,#f59e0b,#d97706)', icon: '⚠️' },
    info:    { bg: 'linear-gradient(135deg,#3b82f6,#2563eb)', icon: 'ℹ️' },
  };

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}
      <div className="sanad-toast-container">
        {toasts.map((t) => {
          const c = COLORS[t.type] || COLORS.info;
          return (
            <div
              key={t.id}
              className="sanad-toast"
              style={{ background: c.bg }}
            >
              <span style={{ fontSize: 18 }}>{c.icon}</span>
              <span style={{ flex: 1, textAlign: 'right' }}>{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toast: (m) => alert(m),
      success: (m) => alert('✅ ' + m),
      error: (m) => alert('❌ ' + m),
      info: (m) => alert('ℹ️ ' + m),
      warning: (m) => alert('⚠️ ' + m),
    };
  }
  return ctx;
}

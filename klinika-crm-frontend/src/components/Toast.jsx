// src/components/Toast.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type, duration }]);

        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const success = useCallback((message, duration) => addToast(message, 'success', duration), [addToast]);
    const error = useCallback((message, duration) => addToast(message, 'error', duration), [addToast]);
    const warning = useCallback((message, duration) => addToast(message, 'warning', duration), [addToast]);
    const info = useCallback((message, duration) => addToast(message, 'info', duration), [addToast]);

    return (
        <ToastContext.Provider value={{ success, error, warning, info, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
}

function ToastContainer({ toasts, onRemove }) {
    if (toasts.length === 0) return null;

    return (
        <div style={styles.container}>
            {toasts.map(toast => (
                <Toast key={toast.id} {...toast} onClose={() => onRemove(toast.id)} />
            ))}
        </div>
    );
}

function Toast({ message, type, onClose }) {
    const config = {
        success: { icon: '✓', color: '#10b981', bg: '#d1fae5' },
        error: { icon: '✕', color: '#ef4444', bg: '#fee2e2' },
        warning: { icon: '⚠', color: '#f59e0b', bg: '#fef3c7' },
        info: { icon: 'ℹ', color: '#3b82f6', bg: '#dbeafe' },
    }[type] || { icon: 'ℹ', color: '#6b7280', bg: '#f3f4f6' };

    return (
        <div style={{ ...styles.toast, borderLeft: `4px solid ${config.color}` }}>
            <div style={{ ...styles.icon, background: config.bg, color: config.color }}>
                {config.icon}
            </div>
            <div style={styles.message}>{message}</div>
            <button onClick={onClose} style={styles.close}>×</button>
        </div>
    );
}

const styles = {
    container: {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: '400px',
    },
    toast: {
        background: '#fff',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        animation: 'slideIn 0.3s ease-out',
    },
    icon: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        fontWeight: 700,
        flexShrink: 0,
    },
    message: {
        flex: 1,
        fontSize: '14px',
        color: '#374151',
        lineHeight: 1.5,
    },
    close: {
        background: 'none',
        border: 'none',
        fontSize: '24px',
        color: '#9ca3af',
        cursor: 'pointer',
        padding: 0,
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
};

// Add animation
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
    document.head.appendChild(style);
}

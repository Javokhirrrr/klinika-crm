// Quick Action Button Component - For Fast Workflows
import React from 'react';

export function QuickActionButton({ icon, label, onClick, variant = 'primary', size = 'md', disabled = false, style = {} }) {
    const variants = {
        primary: 'btn-primary',
        success: 'btn-success',
        secondary: 'btn-secondary',
    };

    const sizes = {
        sm: 'btn-sm',
        md: '',
        lg: 'btn-lg',
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`btn ${variants[variant]} ${sizes[size]}`}
            style={style}
        >
            {icon && <span>{icon}</span>}
            <span>{label}</span>
        </button>
    );
}

// Quick Search Component - Fast Patient/Appointment Search
export function QuickSearch({ placeholder, onSearch, value, onChange }) {
    return (
        <div style={{ position: 'relative' }}>
            <input
                type="text"
                className="input"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && onSearch()}
                style={{ paddingLeft: '2.5rem' }}
            />
            <span style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--gray-400)',
            }}>
                🔍
            </span>
        </div>
    );
}

// Status Badge - Visual Status Indicators
export function StatusBadge({ status }) {
    const statusConfig = {
        scheduled: { label: 'Rejalashtirilgan', variant: 'primary' },
        in_progress: { label: 'Jarayonda', variant: 'warning' },
        completed: { label: 'Tugallangan', variant: 'success' },
        cancelled: { label: 'Bekor qilingan', variant: 'error' },
        pending: { label: 'Kutilmoqda', variant: 'warning' },
        paid: { label: 'To\'langan', variant: 'success' },
        unpaid: { label: 'To\'lanmagan', variant: 'error' },
    };

    const config = statusConfig[status] || { label: status, variant: 'primary' };

    return (
        <span className={`badge badge-${config.variant}`}>
            {config.label}
        </span>
    );
}

// Loading Spinner
export function LoadingSpinner({ size = 20 }) {
    return (
        <div className="spinner" style={{ width: size, height: size }} />
    );
}

// Toast Notification - Enhanced with auto-dismiss and stacking
export function Toast({ message, type = 'success', onClose, duration = 3000 }) {
    React.useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [onClose, duration]);

    const typeStyles = {
        success: {
            borderColor: 'var(--success-600)',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            icon: '✅',
        },
        error: {
            borderColor: 'var(--error-600)',
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            icon: '❌',
        },
        warning: {
            borderColor: 'var(--warning-600)',
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            icon: '⚠️',
        },
        info: {
            borderColor: 'var(--primary-600)',
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            icon: 'ℹ️',
        },
    };

    const style = typeStyles[type] || typeStyles.info;

    return (
        <div
            className="toast"
            style={{
                borderLeftColor: style.borderColor,
                background: style.background,
                animation: 'slideIn 0.3s ease-out',
            }}
        >
            <div className="flex items-center gap-4">
                <span style={{ fontSize: '1.5rem' }}>{style.icon}</span>
                <div className="flex-1">
                    <p className="font-medium" style={{ color: 'var(--gray-900)' }}>{message}</p>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.5rem',
                        color: 'var(--gray-400)',
                        padding: '0 4px',
                        lineHeight: 1,
                    }}
                >
                    ×
                </button>
            </div>
        </div>
    );
}

// Toast Container - Manages multiple toasts
export function ToastContainer({ toasts = [], onRemove }) {
    return (
        <div style={{
            position: 'fixed',
            bottom: 'var(--space-6)',
            right: 'var(--space-6)',
            zIndex: 'var(--z-tooltip)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
            maxWidth: '400px',
        }}>
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    duration={toast.duration}
                    onClose={() => onRemove(toast.id)}
                />
            ))}
        </div>
    );
}

// Hook for using toasts
export function useToast() {
    const [toasts, setToasts] = React.useState([]);

    const addToast = React.useCallback((message, type = 'success', duration = 3000) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type, duration }]);
    }, []);

    const removeToast = React.useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return { toasts, addToast, removeToast };
}

// Empty State Component
export function EmptyState({ icon = '📋', title, description, action }) {
    return (
        <div style={{
            textAlign: 'center',
            padding: 'var(--space-12)',
            color: 'var(--gray-500)',
        }}>
            <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>
                {icon}
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 'var(--space-2)', color: 'var(--gray-700)' }}>
                {title}
            </h3>
            <p style={{ marginBottom: 'var(--space-6)' }}>
                {description}
            </p>
            {action && action}
        </div>
    );
}

// Card Component
export function Card({ children, hover = false, className = '' }) {
    return (
        <div className={`card ${hover ? 'card-hover' : ''} ${className}`}>
            {children}
        </div>
    );
}

Card.Header = function CardHeader({ children }) {
    return <div className="card-header">{children}</div>;
};

Card.Body = function CardBody({ children }) {
    return <div className="card-body">{children}</div>;
};

Card.Footer = function CardFooter({ children }) {
    return <div className="card-footer">{children}</div>;
};

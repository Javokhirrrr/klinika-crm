// Quick Action Button Component - For Fast Workflows
import React from 'react';

export function QuickActionButton({ icon, label, onClick, variant = 'primary', size = 'md' }) {
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
            className={`btn ${variants[variant]} ${sizes[size]}`}
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

// Toast Notification
export function Toast({ message, type = 'success', onClose }) {
    React.useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
    };

    return (
        <div className="toast" style={{ borderLeftColor: `var(--${type}-600)` }}>
            <div className="flex items-center gap-4">
                <span style={{ fontSize: '1.5rem' }}>{icons[type]}</span>
                <div className="flex-1">
                    <p className="font-medium">{message}</p>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.25rem',
                        color: 'var(--gray-400)',
                    }}
                >
                    ×
                </button>
            </div>
        </div>
    );
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

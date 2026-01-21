// src/components/LoadingStates.jsx
import React from 'react';

// Simple Spinner
export function LoadingSpinner({ size = 40, color = '#2563eb' }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <div
                style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    border: `3px solid #e5e7eb`,
                    borderTop: `3px solid ${color}`,
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                }}
            />
            <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}

// Skeleton Line
export function SkeletonLine({ width = '100%', height = '16px', style = {} }) {
    return (
        <div
            style={{
                width,
                height,
                background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
                borderRadius: '4px',
                ...style,
            }}
        >
            <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
        </div>
    );
}

// Skeleton Card
export function SkeletonCard() {
    return (
        <div style={{ padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <SkeletonLine width="60%" height="20px" style={{ marginBottom: '12px' }} />
            <SkeletonLine width="100%" height="14px" style={{ marginBottom: '8px' }} />
            <SkeletonLine width="80%" height="14px" style={{ marginBottom: '8px' }} />
            <SkeletonLine width="40%" height="14px" />
        </div>
    );
}

// Skeleton Table
export function SkeletonTable({ rows = 5, columns = 5 }) {
    return (
        <div style={{ width: '100%' }}>
            {/* Header */}
            <div style={{ display: 'flex', gap: '12px', padding: '12px', background: '#f9fafb', borderRadius: '8px 8px 0 0' }}>
                {Array.from({ length: columns }).map((_, i) => (
                    <SkeletonLine key={i} width={`${100 / columns}%`} height="16px" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIdx) => (
                <div key={rowIdx} style={{ display: 'flex', gap: '12px', padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    {Array.from({ length: columns }).map((_, colIdx) => (
                        <SkeletonLine key={colIdx} width={`${100 / columns}%`} height="14px" />
                    ))}
                </div>
            ))}
        </div>
    );
}

// Full Page Loading
export function PageLoading({ message = 'Yuklanmoqda...' }) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
            gap: '16px'
        }}>
            <LoadingSpinner size={48} />
            <p style={{ color: '#6b7280', fontSize: '14px' }}>{message}</p>
        </div>
    );
}

// Button Loading State
export function ButtonLoading({ children, loading, ...props }) {
    return (
        <button {...props} disabled={loading || props.disabled}>
            {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LoadingSpinner size={16} color="#fff" />
                    Yuklanmoqda...
                </span>
            ) : children}
        </button>
    );
}

// Progress Bar
export function ProgressBar({ progress = 0, showLabel = true }) {
    return (
        <div style={{ width: '100%' }}>
            <div style={{
                width: '100%',
                height: '8px',
                background: '#e5e7eb',
                borderRadius: '4px',
                overflow: 'hidden'
            }}>
                <div style={{
                    width: `${Math.min(100, Math.max(0, progress))}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #2563eb, #0ea5a4)',
                    transition: 'width 0.3s ease',
                    borderRadius: '4px'
                }} />
            </div>
            {showLabel && (
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', textAlign: 'right' }}>
                    {Math.round(progress)}%
                </p>
            )}
        </div>
    );
}

// Empty State
export function EmptyState({ icon = '📭', title = 'Ma\'lumot topilmadi', message, action }) {
    return (
        <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            color: '#6b7280'
        }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>{icon}</div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>{title}</h3>
            {message && <p style={{ fontSize: '14px', marginBottom: '16px' }}>{message}</p>}
            {action && <div style={{ marginTop: '24px' }}>{action}</div>}
        </div>
    );
}

// src/components/LoadingStates.jsx
import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

// Simple Spinner
export function LoadingSpinner({ size = 40, className }) {
    return (
        <div className={cn("flex justify-center items-center p-5", className)}>
            <Loader2 className="animate-spin text-primary" style={{ width: size, height: size }} />
        </div>
    );
}

// Skeleton Line
export function SkeletonLine({ className, width, height, style }) {
    return (
        <div
            className={cn("animate-pulse bg-muted rounded-md", className)}
            style={{ width, height, ...style }}
        />
    );
}

// Skeleton Card
export function SkeletonCard({ className }) {
    return (
        <div className={cn("p-4 bg-card rounded-xl border border-border shadow-sm", className)}>
            <SkeletonLine className="w-3/5 h-5 mb-3" />
            <SkeletonLine className="w-full h-3.5 mb-2" />
            <SkeletonLine className="w-4/5 h-3.5 mb-2" />
            <SkeletonLine className="w-2/5 h-3.5" />
        </div>
    );
}

// Skeleton Table
export function SkeletonTable({ rows = 5, columns = 5, className }) {
    return (
        <div className={cn("w-full border border-border rounded-xl overflow-hidden", className)}>
            {/* Header */}
            <div className="flex gap-3 p-3 bg-muted/50 border-b border-border">
                {Array.from({ length: columns }).map((_, i) => (
                    <SkeletonLine key={i} className="flex-1 h-4" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIdx) => (
                <div key={rowIdx} className="flex gap-3 p-3 border-b border-border bg-card last:border-0">
                    {Array.from({ length: columns }).map((_, colIdx) => (
                        <SkeletonLine key={colIdx} className="flex-1 h-3.5" />
                    ))}
                </div>
            ))}
        </div>
    );
}

// Full Page Loading
export function PageLoading({ message = 'Yuklanmoqda...' }) {
    return (
        <div className="flex flex-col justify-center items-center min-h-[400px] gap-4">
            <LoadingSpinner size={48} />
            <p className="text-muted-foreground text-sm font-medium">{message}</p>
        </div>
    );
}

// Button Loading State
export function ButtonLoading({ children, loading, className, ...props }) {
    return (
        <button className={cn("inline-flex items-center justify-center gap-2", className)} {...props} disabled={loading || props.disabled}>
            {loading ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Yuklanmoqda...
                </>
            ) : children}
        </button>
    );
}

// Progress Bar
export function ProgressBar({ progress = 0, showLabel = true, className }) {
    return (
        <div className={cn("w-full", className)}>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div 
                    className="h-full bg-primary transition-all duration-300 ease-in-out rounded-full"
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
            </div>
            {showLabel && (
                <p className="text-xs text-muted-foreground mt-1 text-right">
                    {Math.round(progress)}%
                </p>
            )}
        </div>
    );
}

// Empty State
export function EmptyState({ icon = '📭', title = 'Ma\'lumot topilmadi', message, action, className }) {
    return (
        <div className={cn("flex flex-col items-center justify-center text-center p-12 text-muted-foreground", className)}>
            <div className="text-5xl mb-4">{icon}</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
            {message && <p className="text-sm mb-4 max-w-sm">{message}</p>}
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
}

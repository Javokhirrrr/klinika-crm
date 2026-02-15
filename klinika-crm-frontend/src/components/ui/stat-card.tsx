import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
    className?: string;
}

const variantStyles = {
    primary: {
        bg: 'bg-blue-50',
        iconBg: 'bg-gradient-primary',
        iconColor: 'text-white',
        valueColor: 'text-blue-600'
    },
    success: {
        bg: 'bg-emerald-50',
        iconBg: 'bg-gradient-success',
        iconColor: 'text-white',
        valueColor: 'text-emerald-600'
    },
    warning: {
        bg: 'bg-amber-50',
        iconBg: 'bg-gradient-warning',
        iconColor: 'text-white',
        valueColor: 'text-amber-600'
    },
    danger: {
        bg: 'bg-red-50',
        iconBg: 'bg-gradient-danger',
        iconColor: 'text-white',
        valueColor: 'text-red-600'
    },
    info: {
        bg: 'bg-sky-50',
        iconBg: 'bg-gradient-info',
        iconColor: 'text-white',
        valueColor: 'text-sky-600'
    }
};

export function StatCard({ label, value, icon: Icon, trend, variant = 'primary', className }: StatCardProps) {
    const styles = variantStyles[variant];

    return (
        <Card className={cn(
            'border-0 overflow-hidden hover-lift transition-smooth',
            styles.bg,
            className
        )}>
            <CardContent className="p-6">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        'w-14 h-14 rounded-2xl flex items-center justify-center shadow-premium',
                        styles.iconBg
                    )}>
                        <Icon className={cn('h-7 w-7', styles.iconColor)} />
                    </div>
                    <div className="flex-1">
                        <div className="text-sm font-medium text-muted-foreground mb-1">{label}</div>
                        <div className="flex items-baseline gap-2">
                            <div className={cn('text-3xl font-bold', styles.valueColor)}>{value}</div>
                            {trend && (
                                <span className={cn(
                                    'text-xs font-semibold',
                                    trend.isPositive ? 'text-emerald-600' : 'text-red-600'
                                )}>
                                    {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const premiumButtonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground hover:bg-primary-hover shadow-lg hover:shadow-xl',
                gradient: 'gradient-primary text-white shadow-lg hover:shadow-xl glow-primary hover:glow-primary-lg',
                'gradient-success': 'gradient-success text-white shadow-lg hover:shadow-xl',
                'gradient-warning': 'gradient-warning text-white shadow-lg hover:shadow-xl',
                'gradient-danger': 'gradient-danger text-white shadow-lg hover:shadow-xl',
                destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md',
                outline: 'border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground',
                secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                ghost: 'hover:bg-accent hover:text-accent-foreground',
                link: 'text-primary underline-offset-4 hover:underline',
                glass: 'glass text-foreground hover:bg-white/80 shadow-premium',
            },
            size: {
                default: 'h-11 px-5 py-2.5',
                sm: 'h-9 rounded-lg px-3.5',
                lg: 'h-12 rounded-xl px-8 text-base',
                xl: 'h-14 rounded-2xl px-10 text-lg',
                icon: 'h-10 w-10',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

export interface PremiumButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof premiumButtonVariants> {
    asChild?: boolean;
}

const PremiumButton = React.forwardRef<HTMLButtonElement, PremiumButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button';
        return (
            <Comp
                className={cn(premiumButtonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);
PremiumButton.displayName = 'PremiumButton';

export { PremiumButton, premiumButtonVariants };

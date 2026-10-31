import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        default:
          'bg-emerald-500 text-slate-950 font-semibold shadow hover:bg-emerald-600 active:scale-[0.98]',
        destructive:
          'bg-red-500 text-white shadow-sm hover:bg-red-600 active:scale-[0.98]',
        outline:
          'border border-border/80 bg-background/50 hover:bg-accent hover:text-accent-foreground shadow-sm',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm',
        ghost:
          'hover:bg-accent hover:text-accent-foreground',
        link:
          'text-primary underline-offset-4 hover:underline',
        glass:
          'bg-slate-900/40 backdrop-blur-md border border-white/10 text-slate-100 hover:bg-slate-800/60 shadow-simplicity',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-7 rounded-lg px-2.5 text-xs',
        lg: 'h-10 rounded-xl px-6 text-sm',
        icon: 'h-8 w-8 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';


import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex touch-manipulation select-none items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-[0_12px_32px_-18px_rgb(221_109_54_/_0.95)]',
        secondary: 'bg-secondary text-secondary-foreground',
        outline: 'border border-border bg-card text-foreground',
        ghost: 'text-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-8 px-3 text-sm',
        lg: 'h-11 px-5 text-base',
        icon: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

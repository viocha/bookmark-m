import * as React from 'react';

import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-xl border border-input bg-white/90 px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10',
        className,
      )}
      {...props}
    />
  );
});

Input.displayName = 'Input';

import { Toaster as Sonner } from 'sonner';

export function Toaster() {
  return (
    <Sonner
      position="top-center"
      toastOptions={{
        classNames: {
          toast: 'rounded-[1.25rem] border border-border bg-card text-foreground shadow-xl',
          title: 'text-sm font-semibold',
          description: 'text-xs text-muted-foreground',
        },
      }}
    />
  );
}

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { cn, swallowNextDocumentClick } from '@/lib/utils';

const DialogCloseContext = React.createContext<(() => void) | null>(null);

export function Dialog({
  children,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  const handleClose = React.useCallback(() => {
    onOpenChange?.(false);
  }, [onOpenChange]);

  return (
    <DialogCloseContext.Provider value={handleClose}>
      <DialogPrimitive.Root onOpenChange={onOpenChange} {...props}>
        {children}
      </DialogPrimitive.Root>
    </DialogCloseContext.Provider>
  );
}
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

export function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  const closeDialog = React.useContext(DialogCloseContext);

  return (
    <DialogPrimitive.Overlay
      {...props}
      data-slot="dialog-overlay"
      className={cn(
        'fixed inset-0 z-[260] bg-black/50 backdrop-blur-sm duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
        className,
      )}
      onPointerDown={(event) => {
        props.onPointerDown?.(event);
        if (event.defaultPrevented) return;
        event.preventDefault();
        event.stopPropagation();
        swallowNextDocumentClick();
        closeDialog?.();
      }}
    />
  );
}

export function DialogContent({
  className,
  children,
  showClose = true,
  showCloseButton,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showClose?: boolean;
  showCloseButton?: boolean;
}) {
  const shouldShowClose = showCloseButton ?? showClose;

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          'fixed top-1/2 left-1/2 z-[260] grid max-h-[85vh] w-[min(calc(100vw-1.5rem),32rem)] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-hidden rounded-[1.5rem] border bg-card p-4 shadow-2xl outline-none duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          className,
        )}
        {...props}
      >
        {children}
        {shouldShowClose ? (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="absolute top-3 right-3 inline-flex size-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground opacity-80 transition-[opacity,background-color] hover:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
          >
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

export function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="dialog-header" className={cn('flex flex-col gap-1.5 pr-10 text-left', className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="dialog-footer" className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title data-slot="dialog-title" className={cn('text-lg leading-none font-semibold', className)} {...props} />;
}

export function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

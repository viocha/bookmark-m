import { useEffect } from 'react';
import { swallowNextDocumentClick } from '@/lib/utils';

type UseImmediateMenuDismissOptions = {
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  contentRef: React.RefObject<HTMLElement | null>;
};

function eventTargetsElement(event: PointerEvent, element: HTMLElement | null) {
  if (!element) return false;
  const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
  return path.includes(element) || element.contains(event.target as Node | null);
}

export function useImmediateMenuDismiss({
  open,
  onClose,
  triggerRef,
  contentRef,
}: UseImmediateMenuDismissOptions) {
  useEffect(() => {
    if (!open) return;

    const handleDocumentPointerDown = (event: PointerEvent) => {
      if (eventTargetsElement(event, triggerRef.current) || eventTargetsElement(event, contentRef.current)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      swallowNextDocumentClick();
      onClose();
    };

    const handleTriggerPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      swallowNextDocumentClick();
      onClose();
    };

    const trigger = triggerRef.current;
    document.addEventListener('pointerdown', handleDocumentPointerDown, true);
    trigger?.addEventListener('pointerdown', handleTriggerPointerDown, true);

    return () => {
      document.removeEventListener('pointerdown', handleDocumentPointerDown, true);
      trigger?.removeEventListener('pointerdown', handleTriggerPointerDown, true);
    };
  }, [contentRef, onClose, open, triggerRef]);
}

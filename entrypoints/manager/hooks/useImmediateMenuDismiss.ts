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
    let blockedPointerId: number | null = null;

    const handleDocumentPointerDown = (event: PointerEvent) => {
      if (eventTargetsElement(event, triggerRef.current) || eventTargetsElement(event, contentRef.current)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      swallowNextDocumentClick();
      // 保留遮罩直到本次手势松开，避免它在按下时消失后让底层元素进入 :active。
      blockedPointerId = event.pointerId;
    };

    const handleDocumentPointerEnd = (event: PointerEvent) => {
      if (event.pointerId !== blockedPointerId) return;
      blockedPointerId = null;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      onClose();
    };

    document.addEventListener('pointerdown', handleDocumentPointerDown, true);
    document.addEventListener('pointerup', handleDocumentPointerEnd, true);
    document.addEventListener('pointercancel', handleDocumentPointerEnd, true);

    return () => {
      document.removeEventListener('pointerdown', handleDocumentPointerDown, true);
      document.removeEventListener('pointerup', handleDocumentPointerEnd, true);
      document.removeEventListener('pointercancel', handleDocumentPointerEnd, true);
    };
  }, [contentRef, onClose, open, triggerRef]);
}

import { useRef } from 'react';

type UseTouchDropdownTriggerOptions = {
  onToggle: () => void;
};

type TouchTriggerElement = HTMLButtonElement;

export function useTouchDropdownTrigger({ onToggle }: UseTouchDropdownTriggerOptions) {
  const pendingTouchTapRef = useRef(false);

  const resetPendingTouchTap = () => {
    pendingTouchTapRef.current = false;
  };

  return {
    onPointerDownCapture: (event: React.PointerEvent<TouchTriggerElement>) => {
      if (event.pointerType !== 'touch') {
        pendingTouchTapRef.current = false;
        return;
      }

      pendingTouchTapRef.current = true;
      event.stopPropagation();
      event.nativeEvent.stopImmediatePropagation?.();
    },
    onPointerCancel: () => {
      resetPendingTouchTap();
    },
    onClick: () => {
      if (!pendingTouchTapRef.current) return;

      resetPendingTouchTap();
      onToggle();
    },
  };
}

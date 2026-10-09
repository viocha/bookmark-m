import type { ReactNode } from 'react';
import { toast as toastManager } from '@/components/ui/toast';

type ToastOptions = {
  description?: ReactNode;
  action?: { label: string; onClick: () => void };
};

export function toast(title: string, options: ToastOptions = {}) {
  const action = options.action;
  let actionHandled = false;
  const toastId = toastManager.add({
    title,
    description: options.description,
    actionProps: action
      ? {
          children: action.label,
          onClick: () => {
            if (actionHandled) return;
            actionHandled = true;
            toastManager.close(toastId);
            action.onClick();
          },
        }
      : undefined,
  });
  return toastId;
}

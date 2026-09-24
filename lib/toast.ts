import type { ReactNode } from 'react';
import { toast as toastManager } from '@/components/ui/toast';

type ToastOptions = {
  description?: ReactNode;
  action?: { label: string; onClick: () => void };
};

export function toast(title: string, options: ToastOptions = {}) {
  return toastManager.add({
    title,
    description: options.description,
    actionProps: options.action
      ? { children: options.action.label, onClick: options.action.onClick }
      : undefined,
  });
}

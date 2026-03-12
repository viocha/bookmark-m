import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

let pendingClickSwallowCleanup: ReturnType<typeof setTimeout> | null = null;
let pendingClickSwallowHandler: ((event: MouseEvent) => void) | null = null;

export function swallowNextDocumentClick() {
  if (pendingClickSwallowHandler) {
    document.removeEventListener('click', pendingClickSwallowHandler, true);
  }
  if (pendingClickSwallowCleanup) {
    clearTimeout(pendingClickSwallowCleanup);
  }

  pendingClickSwallowHandler = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    if (pendingClickSwallowHandler) {
      document.removeEventListener('click', pendingClickSwallowHandler, true);
      pendingClickSwallowHandler = null;
    }
    if (pendingClickSwallowCleanup) {
      clearTimeout(pendingClickSwallowCleanup);
      pendingClickSwallowCleanup = null;
    }
  };

  document.addEventListener('click', pendingClickSwallowHandler, true);
  pendingClickSwallowCleanup = setTimeout(() => {
    if (pendingClickSwallowHandler) {
      document.removeEventListener('click', pendingClickSwallowHandler, true);
      pendingClickSwallowHandler = null;
    }
    pendingClickSwallowCleanup = null;
  }, 400);
}

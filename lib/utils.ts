import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

let pendingClickSwallowCleanup: (() => void) | null = null;

export function swallowNextDocumentClick() {
  pendingClickSwallowCleanup?.();

  const handleClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    cleanup();
  };
  const cleanup = () => {
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('pointerdown', cleanup, true);
    document.removeEventListener('pointercancel', cleanup, true);
    pendingClickSwallowCleanup = null;
  };
  // 拦截本次手势的点击；取消手势或下一次按下时释放，避免长按后点击穿透。
  pendingClickSwallowCleanup = cleanup;
  document.addEventListener('click', handleClick, true);
  document.addEventListener('pointerdown', cleanup, true);
  document.addEventListener('pointercancel', cleanup, true);
}

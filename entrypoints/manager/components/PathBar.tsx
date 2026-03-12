import { House } from 'lucide-react';

import { cn } from '@/lib/utils';

type PathBarProps = {
  visible: boolean;
  isHomeView: boolean;
  breadcrumbs: chrome.bookmarks.BookmarkTreeNode[];
  onGoHome: () => void;
  onGoToFolder: (id: string) => void;
  getTitle: (node: chrome.bookmarks.BookmarkTreeNode) => string;
};

export function PathBar({ visible, isHomeView, breadcrumbs, onGoHome, onGoToFolder, getTitle }: PathBarProps) {
  if (!visible) return null;

  return (
    <div className="flex h-9 shrink-0 items-center border-b border-border/60 bg-background/82 px-3 backdrop-blur">
      <div className="flex w-full items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={onGoHome}
          className={cn(
            'inline-flex h-6 shrink-0 touch-manipulation items-center justify-center rounded-full px-2 text-xs',
            isHomeView ? 'bg-secondary font-semibold text-foreground' : 'bg-muted text-muted-foreground',
          )}
        >
          <House className="size-3.5" />
        </button>
        {breadcrumbs.map((node, index) => (
          <button
            key={node.id}
            type="button"
            onClick={() => onGoToFolder(node.id)}
            className={cn(
              'inline-flex h-6 shrink-0 touch-manipulation items-center rounded-full px-2.5 text-xs',
              index === breadcrumbs.length - 1 ? 'bg-secondary font-semibold' : 'bg-muted text-muted-foreground',
            )}
          >
            {getTitle(node)}
          </button>
        ))}
      </div>
    </div>
  );
}

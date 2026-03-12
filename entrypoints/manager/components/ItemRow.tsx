import { ChevronDown, ChevronRight, Folder, MoreHorizontal } from 'lucide-react';
import { useRef } from 'react';

import { getDisplayTitle, isFolder } from '@/lib/bookmark-service';
import { cn } from '@/lib/utils';

import { getBookmarkMeta, getFaviconUrl } from '../utils';

type ItemRowProps = {
  node: chrome.bookmarks.BookmarkTreeNode;
  folderChildCount?: number;
  selected: boolean;
  selectionMode: boolean;
  searchPath?: string;
  compact?: boolean;
  longPressMenu?: boolean;
  expanded?: boolean;
  menuOpen: boolean;
  menuDirection: 'up' | 'down';
  menuContent?: React.ReactNode;
  onClick: () => void;
  onAction: (button: HTMLElement) => void;
};

export function ItemRow({
  node,
  folderChildCount,
  selected,
  selectionMode,
  searchPath,
  compact,
  longPressMenu,
  expanded,
  menuOpen,
  menuDirection,
  menuContent,
  onClick,
  onAction,
}: ItemRowProps) {
  const folder = isFolder(node);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const rowClassName = cn(
    'block min-w-0 max-w-full flex-1 overflow-hidden text-left text-foreground',
    compact && 'py-1',
  );

  const rowContent = compact ? (
    <div className="flex w-full items-center gap-2">
      {folder ? (
        <span className="flex size-4 shrink-0 items-center justify-center text-muted-foreground">
          {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </span>
      ) : null}
      <div className="min-w-0 flex-1 truncate text-sm font-semibold">{getDisplayTitle(node)}</div>
      {folder ? <div className="shrink-0 text-[11px] text-muted-foreground">{getBookmarkMeta(node, folderChildCount)}</div> : null}
    </div>
  ) : folder ? (
    <div className="flex w-full items-center gap-2">
      <div className="min-w-0 flex-1 truncate text-sm font-semibold">{getDisplayTitle(node)}</div>
      <div className="shrink-0 text-[11px] text-muted-foreground">{getBookmarkMeta(node, folderChildCount)}</div>
    </div>
  ) : (
    <div className="w-full min-w-0 max-w-full">
      <div className="block truncate text-sm font-semibold">{getDisplayTitle(node)}</div>
      <div className="block truncate text-[12px] text-muted-foreground">{searchPath ?? getBookmarkMeta(node, folderChildCount)}</div>
    </div>
  );

  return (
    <div className="relative" data-item-menu>
      <div
        className={cn(
          'flex items-center gap-2 rounded-2xl border bg-white/88 px-2.5 shadow-sm',
          compact ? 'min-h-9 py-1.5' : folder ? 'min-h-11 py-2' : 'min-h-14 py-2.5',
          selected && 'border-primary bg-primary/8',
        )}
      >
        <div
          className={cn(
            'flex shrink-0 items-center justify-center rounded-xl',
            folder ? 'size-8' : 'size-9',
            folder ? 'bg-primary/12 text-primary' : 'bg-secondary text-secondary-foreground',
          )}
        >
          {folder ? (
            <Folder className="size-4" />
          ) : (
            <img
              src={node.url ? getFaviconUrl(node.url) : undefined}
              alt=""
              className="size-4 rounded"
              onError={(event) => {
                (event.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            if (longPressTriggeredRef.current) {
              longPressTriggeredRef.current = false;
              return;
            }
            onClick();
          }}
          onPointerDown={(event) => {
            if (!longPressMenu || selectionMode) return;
            longPressTriggeredRef.current = false;
            clearLongPress();
            const target = event.currentTarget as HTMLElement;
            longPressTimerRef.current = window.setTimeout(() => {
              longPressTriggeredRef.current = true;
              onAction(target);
            }, 420);
          }}
          onPointerUp={() => clearLongPress()}
          onPointerLeave={() => clearLongPress()}
          onPointerCancel={() => clearLongPress()}
          onContextMenu={(event) => {
            if (!longPressMenu) return;
            event.preventDefault();
          }}
          className={rowClassName}
        >
          {rowContent}
        </button>

        {!selectionMode && !longPressMenu ? (
          <button
            type="button"
            data-item-menu-button
            onClick={(event) => {
              event.stopPropagation();
              onAction(event.currentTarget as HTMLElement);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onAction(event.currentTarget as HTMLElement);
              }
            }}
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition active:scale-[0.96]',
              menuOpen && 'bg-primary/12 text-primary',
            )}
          >
            <MoreHorizontal className="size-4" />
          </button>
        ) : null}
      </div>

      {menuOpen ? (
        <div
          className={cn(
            'absolute right-2 z-[70] w-36 rounded-2xl border bg-white/96 p-1 shadow-xl',
            menuDirection === 'up' ? 'bottom-11' : 'top-11',
          )}
        >
          {menuContent}
        </div>
      ) : null}
    </div>
  );
}

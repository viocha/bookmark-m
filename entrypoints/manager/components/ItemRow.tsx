import { ChevronDown, ChevronRight, Folder, MoreHorizontal } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import type { ButtonHTMLAttributes, CSSProperties, Ref } from 'react';

import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getDisplayTitle, isFolder } from '@/lib/bookmark-service';
import { cn } from '@/lib/utils';

import { useImmediateMenuDismiss } from '../hooks/useImmediateMenuDismiss';
import { getBookmarkMeta, getFaviconUrl } from '../utils';

type ItemRowProps = {
  node: chrome.bookmarks.BookmarkTreeNode;
  folderChildCount?: number;
  selected: boolean;
  selectionMode: boolean;
  searchPath?: string;
  compact?: boolean;
  treeRow?: boolean;
  compactTree?: boolean;
  longPressMenu?: boolean;
  expanded?: boolean;
  menuContent?: (closeMenu: () => void) => React.ReactNode;
  highlighted?: boolean;
  onClick: () => void;
  onToggleExpand?: () => void;
  wrapperRef?: Ref<HTMLDivElement>;
  wrapperStyle?: CSSProperties;
  wrapperClassName?: string;
  contentButtonProps?: ButtonHTMLAttributes<HTMLButtonElement>;
};

export function ItemRow({
  node,
  folderChildCount,
  selected,
  selectionMode,
  searchPath,
  compact,
  treeRow,
  compactTree,
  longPressMenu,
  expanded,
  menuContent,
  highlighted,
  onClick,
  onToggleExpand,
  wrapperRef,
  wrapperStyle,
  wrapperClassName,
  contentButtonProps,
}: ItemRowProps) {
  const folder = isFolder(node);
  const folderItemCount = folderChildCount ?? node.children?.length ?? 0;
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);
  useImmediateMenuDismiss({ open: menuOpen, onClose: closeMenu, triggerRef, contentRef });

  const rowClassName = cn(
    'block min-w-0 max-w-full flex-1 touch-manipulation text-left text-foreground',
    compact && 'py-0.5',
  );

  const rowContent = compact ? (
    folder ? (
      <div className="flex w-full items-center gap-1.5">
        <div className="min-w-0 flex-1 truncate text-[13px] font-semibold leading-4">{getDisplayTitle(node)}</div>
        {folderItemCount > 0 ? (
          <div className="shrink-0 text-[10px] text-muted-foreground">
            {folderItemCount}
          </div>
        ) : null}
      </div>
    ) : (
      <div className="min-w-0 flex-1 truncate text-[13px] font-semibold leading-4">{getDisplayTitle(node)}</div>
    )
  ) : folder ? (
    searchPath ? (
      <div className="flex w-full min-w-0 items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="block truncate text-sm font-semibold">{getDisplayTitle(node)}</div>
          <div className="block truncate text-[12px] text-muted-foreground">{searchPath}</div>
        </div>
        {folderItemCount > 0 ? <div className="shrink-0 self-center text-[11px] text-muted-foreground">{folderItemCount}</div> : null}
      </div>
    ) : (
      <div className="flex w-full items-center gap-2">
        <div className="min-w-0 flex-1 truncate text-sm font-semibold">{getDisplayTitle(node)}</div>
        {folderItemCount > 0 ? <div className="shrink-0 text-[11px] text-muted-foreground">{folderItemCount}</div> : null}
      </div>
    )
  ) : (
    <div className="w-full min-w-0 max-w-full">
      <div className="block truncate text-sm font-semibold">{getDisplayTitle(node)}</div>
      <div className="block truncate text-[12px] text-muted-foreground">{searchPath ?? getBookmarkMeta(node, folderChildCount)}</div>
    </div>
  );

  return (
    <div ref={wrapperRef} style={wrapperStyle} className={cn('relative', wrapperClassName)} data-item-menu data-item-node-id={node.id}>
      <div
        className={cn(
          'flex items-center gap-2 rounded-2xl border bg-white/88 px-2.5 shadow-sm',
          treeRow && !compact && 'gap-1.5',
          compact ? 'min-h-7 gap-0 rounded-xl px-1.5 py-1' : folder ? (searchPath ? 'min-h-14 py-2.5' : 'min-h-11 py-2') : 'min-h-14 py-2.5',
          selected && 'border-primary bg-primary/8',
          highlighted && 'border-primary/70 bg-primary/12 shadow-[0_0_0_2px_rgba(221,109,54,0.14)]',
        )}
      >
        <div
          className={cn(
            'flex shrink-0 items-center justify-center rounded-xl',
            compact ? 'size-6 rounded-lg' : folder ? 'size-8' : 'size-9',
            folder ? 'bg-primary/12 text-primary' : 'bg-secondary text-secondary-foreground',
          )}
        >
          {folder ? (
            <Folder className={cn(compact ? 'size-3.5' : 'size-4')} />
          ) : (
            <img
              src={node.url ? getFaviconUrl(node.url) : undefined}
              alt=""
              className={cn(compact ? 'size-3.5 rounded-[3px]' : 'size-4 rounded')}
              onError={(event) => {
                (event.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
        </div>

        {compact ? (
          <div
            className={cn(
              'flex min-w-0 max-w-full flex-1 items-center gap-0.5',
              compactTree && 'mr-1',
              !treeRow && !onToggleExpand && 'mx-1.5',
            )}
          >
            {folder && onToggleExpand ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleExpand?.();
                }}
                className="flex size-3.5 shrink-0 touch-manipulation items-center justify-center text-muted-foreground"
              >
                {expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
              </button>
            ) : treeRow ? (
              <span aria-hidden className="block size-3.5 shrink-0" />
            ) : null}
            <button
              type="button"
              {...contentButtonProps}
              onClick={() => {
                onClick();
              }}
              className={rowClassName}
            >
              {rowContent}
            </button>
          </div>
        ) : (
          <div className="flex min-w-0 max-w-full flex-1 items-center gap-1.5">
            {folder && onToggleExpand ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleExpand();
                }}
                className="flex size-4 shrink-0 touch-manipulation items-center justify-center text-muted-foreground"
              >
                {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
              </button>
            ) : treeRow ? (
              <span aria-hidden className="block size-4 shrink-0" />
            ) : null}
            <button
              type="button"
              {...contentButtonProps}
              onClick={() => {
                onClick();
              }}
              className={rowClassName}
            >
              {rowContent}
            </button>
          </div>
        )}

        {!selectionMode && !longPressMenu ? (
          <DropdownMenu
            open={menuOpen}
            onOpenChange={(nextOpen) => {
              setMenuOpen(nextOpen);
            }}
          >
            <DropdownMenuTrigger asChild>
              <button
                ref={triggerRef}
                type="button"
                data-item-menu-button
                className={cn(
                  compact
                    ? 'flex size-6 shrink-0 touch-manipulation items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-[background-color,color,transform] active:scale-[0.96]'
                    : 'flex size-8 shrink-0 touch-manipulation items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-[background-color,color,transform] active:scale-[0.96]',
                  menuOpen && 'bg-muted text-foreground',
                )}
              >
                <MoreHorizontal className={cn(compact ? 'size-3.5' : 'size-4')} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              ref={contentRef}
              align="end"
              collisionPadding={8}
              className={cn(compact ? 'w-32 rounded-lg p-0.5' : 'w-36 rounded-2xl p-1')}
            >
              {menuContent?.(closeMenu)}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </div>
  );
}

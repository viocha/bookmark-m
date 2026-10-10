import { ChevronDown, ChevronRight, Folder, MoreHorizontal } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import type { ButtonHTMLAttributes, CSSProperties, Ref } from 'react';

import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
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
  bookmarkTitleLines?: number;
  compactShowUrl?: boolean;
  treeRow?: boolean;
  compactTree?: boolean;
  longPressMenu?: boolean;
  expanded?: boolean;
  menuContent?: (closeMenu: (afterClose?: () => void) => void) => React.ReactNode;
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
  bookmarkTitleLines = 1,
  compactShowUrl = false,
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
  const afterMenuCloseRef = useRef<(() => void) | undefined>(undefined);
  const closeMenu = useCallback((afterClose?: () => void) => {
    if (afterClose) afterMenuCloseRef.current = afterClose;
    setMenuOpen(false);
  }, []);
  useImmediateMenuDismiss({ open: menuOpen, onClose: closeMenu, triggerRef, contentRef });

  const rowClassName = cn(
    'block min-w-0 max-w-full flex-1 text-left',
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
      <div className="min-w-0 flex-1">
        <div data-bookmark-title className="overflow-hidden break-words text-[13px] font-semibold leading-4" style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: bookmarkTitleLines }}>{getDisplayTitle(node)}</div>
        {compactShowUrl ? <div data-bookmark-url className="truncate text-[11px] leading-4 text-muted-foreground">{getBookmarkMeta(node, folderChildCount)}</div> : null}
      </div>
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
      <div data-bookmark-title className="overflow-hidden break-words text-sm font-semibold" style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: bookmarkTitleLines }}>{getDisplayTitle(node)}</div>
      <div data-bookmark-url className="block truncate text-[12px] text-muted-foreground">{searchPath ?? getBookmarkMeta(node, folderChildCount)}</div>
    </div>
  );

  return (
    <div ref={wrapperRef} style={wrapperStyle} className={cn('relative select-none [-webkit-touch-callout:none]', wrapperClassName)} data-item-menu data-item-node-id={node.id}>
      <div
        className={cn(
          'relative isolate flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 shadow-sm transition-colors has-[[data-item-content-button]:active]:translate-y-px has-[[data-item-content-button]:focus-visible]:border-ring has-[[data-item-content-button]:focus-visible]:ring-2 has-[[data-item-content-button]:focus-visible]:ring-ring/50',
          treeRow && !compact && 'gap-1.5',
          compact ? 'min-h-7 gap-0 rounded-md px-1.5 py-1' : folder ? (searchPath ? 'min-h-14 py-2.5' : 'min-h-11 py-2') : 'min-h-14 py-2.5',
          selected
            ? 'border-ring bg-ring/10 has-[[data-item-content-button]:hover]:bg-ring/12'
            : 'has-[[data-item-content-button]:hover]:bg-muted/40',
          highlighted && 'border-ring bg-accent ring-2 ring-ring/50',
        )}
      >
        <Button
          type="button"
          variant="ghost"
          {...contentButtonProps}
          data-item-content-button
          aria-label={getDisplayTitle(node)}
          aria-pressed={selectionMode ? selected : undefined}
          onClick={onClick}
          className="absolute inset-0 z-0 h-full w-full touch-manipulation rounded-[inherit] p-0 hover:bg-transparent focus-visible:border-transparent focus-visible:ring-0 active:not-aria-[haspopup]:translate-y-0"
        />
        {treeRow && folder ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={expanded ? '折叠文件夹' : '展开文件夹'}
            aria-expanded={expanded}
            disabled={!onToggleExpand}
            onClick={onToggleExpand}
            className={cn(
              'relative z-10 touch-manipulation rounded-md aria-expanded:bg-transparent',
              compact ? 'size-6' : 'size-8',
              onToggleExpand && 'cursor-pointer',
            )}
          >
            {expanded ? <ChevronDown className={cn(compact ? 'size-3.5' : 'size-4')} /> : <ChevronRight className={cn(compact ? 'size-3.5' : 'size-4')} />}
          </Button>
        ) : (
          <div
            className={cn(
              'pointer-events-none flex shrink-0 items-center justify-center rounded-md',
              compact ? 'size-6 rounded-lg' : folder ? 'size-8' : 'size-9',
              folder ? 'bg-accent text-primary' : 'bg-secondary text-secondary-foreground',
            )}
          >
            {folder ? (
              <Folder className={cn(compact ? 'size-3.5' : 'size-4')} />
            ) : (
              <img
                src={node.url ? getFaviconUrl(node.url) : undefined}
                alt=""
                className={cn(compact ? 'size-3.5 rounded-sm' : 'size-4 rounded')}
                onError={(event) => {
                  (event.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
          </div>
        )}

        {compact ? (
          <div
            className={cn(
              'pointer-events-none flex min-w-0 max-w-full flex-1 items-center gap-0.5',
              compactTree && 'mr-1',
              !treeRow && !onToggleExpand && 'mx-1.5',
            )}
          >
            <div className={rowClassName}>
              {rowContent}
            </div>
          </div>
        ) : (
          <div className="pointer-events-none flex min-w-0 max-w-full flex-1 items-center gap-1.5">
            <div className={rowClassName}>
              {rowContent}
            </div>
          </div>
        )}

        {!selectionMode && !longPressMenu ? (
          <DropdownMenu
            open={menuOpen}
            onOpenChange={(nextOpen) => {
              setMenuOpen(nextOpen);
            }}
            onOpenChangeComplete={(open) => {
              if (open) return;
              const afterClose = afterMenuCloseRef.current;
              afterMenuCloseRef.current = undefined;
              afterClose?.();
            }}
          >
            <DropdownMenuTrigger render={<Button
                ref={triggerRef}
                type="button"
                variant="outline"
                size="icon"
                aria-label="打开项目菜单"
                data-item-menu-button
                className={cn(
                  'relative z-10 touch-manipulation rounded-full',
                  compact ? 'size-6' : 'size-8',
                  menuOpen ? 'bg-muted text-foreground' : 'text-muted-foreground',
                )}
              />}>
                <MoreHorizontal className={cn(compact ? 'size-3.5' : 'size-4')} />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              ref={contentRef}
              align="end"
              side="bottom"

              className={cn(compact ? 'w-32 rounded-lg p-0.5' : 'w-36 rounded-lg p-1')}
            >
              {menuContent?.(closeMenu)}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </div>
  );
}

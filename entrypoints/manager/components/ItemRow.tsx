import { ChevronDown, ChevronRight, Folder, MoreHorizontal } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useLayoutEffect, useRef, useState } from 'react';
import type { ButtonHTMLAttributes, CSSProperties, Ref } from 'react';

import { getDisplayTitle, isFolder } from '@/lib/bookmark-service';
import { cn, swallowNextDocumentClick } from '@/lib/utils';

import { getBookmarkMeta, getCompensatedMenuPosition, getFaviconUrl } from '../utils';

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
  menuOpen: boolean;
  menuAnchor?: { top: number; bottom: number; right: number } | null;
  menuDirection: 'up' | 'down';
  menuContent?: React.ReactNode;
  onCloseMenu?: () => void;
  highlighted?: boolean;
  onClick: () => void;
  onAction: (button: HTMLElement) => void;
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
  menuOpen,
  menuAnchor,
  menuDirection,
  menuContent,
  onCloseMenu,
  highlighted,
  onClick,
  onAction,
  onToggleExpand,
  wrapperRef,
  wrapperStyle,
  wrapperClassName,
  contentButtonProps,
}: ItemRowProps) {
  const folder = isFolder(node);
  const folderItemCount = folderChildCount ?? node.children?.length ?? 0;
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [portalMenuStyle, setPortalMenuStyle] = useState<CSSProperties | null>(null);
  const compactMenuStyle = compact
    ? (menuDirection === 'up'
        ? ({ bottom: '100%' } satisfies CSSProperties)
        : ({ top: '100%' } satisfies CSSProperties))
    : undefined;

  useLayoutEffect(() => {
    if (!menuOpen || !menuAnchor || !menuRef.current) {
      setPortalMenuStyle(null);
      return;
    }

    const rect = menuRef.current.getBoundingClientRect();
    const preferredTop = menuDirection === 'down'
      ? menuAnchor.top
      : window.innerHeight - menuAnchor.bottom - rect.height;

    setPortalMenuStyle({
      ...getCompensatedMenuPosition({
        anchorRight: menuAnchor.right,
        preferredTop,
        menuWidth: rect.width,
        menuHeight: rect.height,
        viewportMargin: 0,
      }),
      visibility: 'visible',
    });
  }, [compact, menuAnchor, menuDirection, menuOpen]);

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
              compact
                ? 'flex size-6 shrink-0 touch-manipulation items-center justify-center rounded-full bg-secondary text-secondary-foreground active:scale-[0.96]'
                : 'flex size-8 shrink-0 touch-manipulation items-center justify-center rounded-full bg-secondary text-secondary-foreground active:scale-[0.96]',
              menuOpen && 'bg-muted text-foreground',
            )}
          >
            <MoreHorizontal className={cn(compact ? 'size-3.5' : 'size-4')} />
          </button>
        ) : null}
      </div>

      {menuOpen ? (
        menuAnchor ? createPortal(
          <>
            <div
              className="fixed inset-0 z-[210]"
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                swallowNextDocumentClick();
                onCloseMenu?.();
              }}
            />
            <div
              ref={menuRef}
              data-item-menu
              className={cn(
                'fixed z-[220] border bg-white p-1 shadow-xl',
                compact ? 'w-32 rounded-lg p-0.5' : 'w-36 rounded-2xl',
              )}
              style={portalMenuStyle ?? { left: -9999, top: -9999, visibility: 'hidden' }}
            >
              {menuContent}
            </div>
          </>,
          document.body,
        ) : (
          <div
            style={compactMenuStyle}
            className={cn(
              'absolute right-2 z-[70] border bg-white shadow-xl',
              compact ? 'w-32 rounded-lg p-0.5' : 'w-36 rounded-2xl p-1',
              !compact && (menuDirection === 'up' ? 'bottom-11' : 'top-11'),
            )}
          >
            {menuContent}
          </div>
        )
      ) : null}
    </div>
  );
}

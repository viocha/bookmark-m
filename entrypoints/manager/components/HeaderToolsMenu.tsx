import { createPortal } from 'react-dom';
import { Bookmark, FolderPlus, Plus, Settings2, SquareCheckBig } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

import { cn, swallowNextDocumentClick } from '@/lib/utils';
import type { BookmarkDisplayMode, LaunchContext } from '@/lib/bookmark-service';
import { getCompensatedMenuPosition } from '../utils';

type HeaderToolsMenuProps = {
  open: boolean;
  displayMode: BookmarkDisplayMode;
  hasLaunchContext: boolean;
  hasLaunchBookmark: boolean;
  launchContext: LaunchContext | null;
  toolsDisabledOnHome: boolean;
  selectableCount: number;
  searching: boolean;
  canCreateInCurrentFolder: boolean;
  menuAnchor: { top: number; right: number } | null;
  onClose: () => void;
  onSwitchMode: (mode: BookmarkDisplayMode) => void;
  onOpenSettings: () => void;
  onSaveLaunch: () => void;
  onSelectMode: () => void;
  onCreateFolder: () => void;
  onCreateBookmark: () => void;
};

export function HeaderToolsMenu({
  open,
  displayMode,
  hasLaunchContext,
  hasLaunchBookmark,
  launchContext,
  toolsDisabledOnHome,
  selectableCount,
  searching,
  canCreateInCurrentFolder,
  menuAnchor,
  onClose,
  onSwitchMode,
  onOpenSettings,
  onSaveLaunch,
  onSelectMode,
  onCreateFolder,
  onCreateBookmark,
}: HeaderToolsMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);

  useLayoutEffect(() => {
    if (!open || !menuAnchor || !menuRef.current) {
      setMenuStyle(null);
      return;
    }

    const rect = menuRef.current.getBoundingClientRect();
    setMenuStyle({
      ...getCompensatedMenuPosition({
        anchorRight: menuAnchor.right,
        preferredTop: menuAnchor.top,
        menuWidth: rect.width,
        menuHeight: rect.height,
      }),
      visibility: 'visible',
    });
  }, [menuAnchor, open]);

  if (!open || !menuAnchor) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[85]"
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          swallowNextDocumentClick();
          onClose();
        }}
      />
      <div
        ref={menuRef}
        data-tools-menu
        className="fixed z-[90] w-56 rounded-2xl border bg-white p-1 shadow-xl"
        style={menuStyle ?? { left: -9999, top: -9999, visibility: 'hidden' }}
      >
        <div className="mb-1 grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => onSwitchMode('list')}
            className={cn(
              'flex h-8 touch-manipulation items-center justify-center rounded-xl text-xs font-medium transition-colors',
              displayMode === 'list' ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground',
            )}
          >
            列表
          </button>
          <button
            type="button"
            onClick={() => onSwitchMode('tree')}
            className={cn(
              'flex h-8 touch-manipulation items-center justify-center rounded-xl text-xs font-medium transition-colors',
              displayMode === 'tree' ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground',
            )}
          >
            树形
          </button>
        </div>
        {hasLaunchContext ? (
          <button
            type="button"
            disabled={displayMode === 'list' ? toolsDisabledOnHome : false}
            onClick={onSaveLaunch}
            className="flex h-8 w-full touch-manipulation items-center gap-1.5 rounded-xl px-2.5 text-left text-xs font-medium disabled:opacity-50"
          >
            <Bookmark className="size-4" />
            {hasLaunchBookmark ? '编辑当前页面' : '添加当前页面'}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onCreateFolder}
          disabled={displayMode === 'tree' || toolsDisabledOnHome || !canCreateInCurrentFolder}
          className="flex h-8 w-full touch-manipulation items-center gap-1.5 rounded-xl px-2.5 text-left text-xs font-medium disabled:opacity-50"
        >
          <FolderPlus className="size-4" />
          新建文件夹
        </button>
        <button
          type="button"
          onClick={onCreateBookmark}
          disabled={displayMode === 'tree' || toolsDisabledOnHome || !canCreateInCurrentFolder}
          className="flex h-8 w-full touch-manipulation items-center gap-1.5 rounded-xl px-2.5 text-left text-xs font-medium disabled:opacity-50"
        >
          <Plus className="size-4" />
          添加书签
        </button>
        <button
          type="button"
          onClick={onSelectMode}
          disabled={toolsDisabledOnHome || selectableCount === 0 || searching}
          className="flex h-8 w-full touch-manipulation items-center gap-1.5 rounded-xl px-2.5 text-left text-xs font-medium disabled:opacity-50"
        >
          <SquareCheckBig className="size-4" />
          选择项目
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex h-8 w-full touch-manipulation items-center gap-1.5 rounded-xl px-2.5 text-left text-xs font-medium"
        >
          <Settings2 className="size-4" />
          全局设置
        </button>
        {launchContext ? (
          <div className="mt-1 border-t border-border/60 px-2.5 pt-1.5">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">当前页面</div>
            <div className="mt-0.5 truncate text-xs font-medium">{launchContext.title}</div>
            <div className="truncate text-[11px] text-muted-foreground">{launchContext.url}</div>
          </div>
        ) : null}
      </div>
    </>,
    document.body,
  );
}

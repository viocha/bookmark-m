import { Bookmark, FolderPlus, Plus, Settings2, SquareCheckBig } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { BookmarkDisplayMode } from '@/lib/bookmark-service';

type HeaderToolsMenuProps = {
  open: boolean;
  displayMode: BookmarkDisplayMode;
  hasLaunchContext: boolean;
  hasLaunchBookmark: boolean;
  toolsDisabledOnHome: boolean;
  selectableCount: number;
  searching: boolean;
  canCreateInCurrentFolder: boolean;
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
  toolsDisabledOnHome,
  selectableCount,
  searching,
  canCreateInCurrentFolder,
  onSwitchMode,
  onOpenSettings,
  onSaveLaunch,
  onSelectMode,
  onCreateFolder,
  onCreateBookmark,
}: HeaderToolsMenuProps) {
  if (!open) return null;

  return (
    <div className="absolute right-3 top-[calc(100%-2px)] z-[90] w-44 rounded-2xl border bg-white/96 p-1 shadow-xl">
      <div className="mb-1 grid grid-cols-2 gap-1">
        <button
          type="button"
          onClick={() => onSwitchMode('list')}
          className={cn(
            'flex h-8 items-center justify-center rounded-xl text-xs font-medium',
            displayMode === 'list' ? 'bg-secondary text-secondary-foreground' : 'bg-muted/70 text-muted-foreground active:bg-muted',
          )}
        >
          列表
        </button>
        <button
          type="button"
          onClick={() => onSwitchMode('tree')}
          className={cn(
            'flex h-8 items-center justify-center rounded-xl text-xs font-medium',
            displayMode === 'tree' ? 'bg-secondary text-secondary-foreground' : 'bg-muted/70 text-muted-foreground active:bg-muted',
          )}
        >
          树形
        </button>
      </div>
      <button
        type="button"
        onClick={onOpenSettings}
        className="flex h-8 w-full items-center gap-1.5 rounded-xl px-2.5 text-left text-xs font-medium"
      >
        <Settings2 className="size-4" />
        全局设置
      </button>
      {hasLaunchContext ? (
        <button
          type="button"
          disabled={displayMode === 'list' ? toolsDisabledOnHome : false}
          onClick={onSaveLaunch}
          className="flex h-8 w-full items-center gap-1.5 rounded-xl px-2.5 text-left text-xs font-medium disabled:opacity-50"
        >
          <Bookmark className="size-4" />
          {hasLaunchBookmark ? '编辑当前页面' : '保存当前页面'}
        </button>
      ) : null}
      <button
        type="button"
        onClick={onSelectMode}
        disabled={toolsDisabledOnHome || selectableCount === 0 || searching}
        className="flex h-8 w-full items-center gap-1.5 rounded-xl px-2.5 text-left text-xs font-medium disabled:opacity-50"
      >
        <SquareCheckBig className="size-4" />
        选择项目
      </button>
      <button
        type="button"
        onClick={onCreateFolder}
        disabled={displayMode === 'tree' || toolsDisabledOnHome || !canCreateInCurrentFolder}
        className="flex h-8 w-full items-center gap-1.5 rounded-xl px-2.5 text-left text-xs font-medium disabled:opacity-50"
      >
        <FolderPlus className="size-4" />
        新建文件夹
      </button>
      <button
        type="button"
        onClick={onCreateBookmark}
        disabled={displayMode === 'tree' || toolsDisabledOnHome || !canCreateInCurrentFolder}
        className="flex h-8 w-full items-center gap-1.5 rounded-xl px-2.5 text-left text-xs font-medium disabled:opacity-50"
      >
        <Plus className="size-4" />
        添加书签
      </button>
    </div>
  );
}

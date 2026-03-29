import { Bookmark, FolderPlus, MoreHorizontal, Plus, Settings2, SquareCheckBig } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { BookmarkDisplayMode, LaunchContext } from '@/lib/bookmark-service';
import { useImmediateMenuDismiss } from '../hooks/useImmediateMenuDismiss';
import { useTouchDropdownTrigger } from '../hooks/useTouchDropdownTrigger';

type HeaderToolsMenuProps = {
  displayMode: BookmarkDisplayMode;
  hasLaunchContext: boolean;
  hasLaunchBookmark: boolean;
  launchContext: LaunchContext | null;
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
  displayMode,
  hasLaunchContext,
  hasLaunchBookmark,
  launchContext,
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
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const closeMenu = useCallback(() => {
    setOpen(false);
  }, []);
  useImmediateMenuDismiss({ open, onClose: closeMenu, triggerRef, contentRef });
  const touchMenuTriggerProps = useTouchDropdownTrigger({
    onToggle: () => {
      setOpen((currentOpen) => !currentOpen);
    },
  });

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          size="icon"
          {...touchMenuTriggerProps}
          className={cn('size-8 rounded-full', open && 'bg-muted/60 text-foreground')}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        ref={contentRef}
        align="end"
        side="bottom"
        className="z-[90] w-56 rounded-2xl p-1 shadow-xl"
      >
        <div className="mb-1 grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => {
              closeMenu();
              onSwitchMode('list');
            }}
            className={cn(
              'flex h-8 touch-manipulation items-center justify-center rounded-xl text-xs font-medium transition-[background-color,color,transform] active:scale-[0.98]',
              displayMode === 'list' ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground',
            )}
          >
            列表
          </button>
          <button
            type="button"
            onClick={() => {
              closeMenu();
              onSwitchMode('tree');
            }}
            className={cn(
              'flex h-8 touch-manipulation items-center justify-center rounded-xl text-xs font-medium transition-[background-color,color,transform] active:scale-[0.98]',
              displayMode === 'tree' ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground',
            )}
          >
            树形
          </button>
        </div>
        {hasLaunchContext ? (
          <DropdownMenuItem
            disabled={displayMode === 'list' ? toolsDisabledOnHome : false}
            onSelect={() => {
              closeMenu();
              onSaveLaunch();
            }}
            className="h-8 rounded-xl px-2.5 text-xs font-medium"
          >
            <Bookmark className="size-4" />
            {hasLaunchBookmark ? '编辑当前页面' : '添加当前页面'}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          disabled={displayMode === 'tree' || toolsDisabledOnHome || !canCreateInCurrentFolder}
          onSelect={() => {
            closeMenu();
            onCreateFolder();
          }}
          className="h-8 rounded-xl px-2.5 text-xs font-medium"
        >
          <FolderPlus className="size-4" />
          新建文件夹
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={displayMode === 'tree' || toolsDisabledOnHome || !canCreateInCurrentFolder}
          onSelect={() => {
            closeMenu();
            onCreateBookmark();
          }}
          className="h-8 rounded-xl px-2.5 text-xs font-medium"
        >
          <Plus className="size-4" />
          添加书签
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={toolsDisabledOnHome || selectableCount === 0 || searching}
          onSelect={() => {
            closeMenu();
            onSelectMode();
          }}
          className="h-8 rounded-xl px-2.5 text-xs font-medium"
        >
          <SquareCheckBig className="size-4" />
          选择项目
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            closeMenu();
            onOpenSettings();
          }}
          className="h-8 rounded-xl px-2.5 text-xs font-medium"
        >
          <Settings2 className="size-4" />
          全局设置
        </DropdownMenuItem>
        {launchContext ? <DropdownMenuSeparator className="mx-1 my-1" /> : null}
        {launchContext ? (
          <div className="px-2.5 pb-1 pt-0.5">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">当前页面</div>
            <div className="mt-0.5 truncate text-xs font-medium">{launchContext.title}</div>
            <div className="truncate text-[11px] text-muted-foreground">{launchContext.url}</div>
          </div>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

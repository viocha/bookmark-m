import { Bookmark, FilePenLine, FolderPlus, MoreHorizontal, Settings2, SquareCheckBig, Star } from 'lucide-react';
import { useCallback, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import type { BookmarkDisplayMode, LaunchContext } from '@/lib/bookmark-service';
import { useImmediateMenuDismiss } from '../hooks/useImmediateMenuDismiss';
import { useBackMenuState } from '../hooks/menu-back-layer';

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
  const [open, setOpen] = useBackMenuState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const closeMenu = useCallback(() => {
    setOpen(false);
  }, [setOpen]);
  useImmediateMenuDismiss({ open, onClose: closeMenu, triggerRef, contentRef });

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger render={<Button
          ref={triggerRef}
          variant="outline"
          size="icon"
          className={cn('size-8 rounded-full', open && 'bg-muted/60 text-foreground')}
        />}>
          <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        ref={contentRef}
        align="end"
        side="bottom"
        className="z-[90] w-56 rounded-lg p-1 shadow-xl"
      >
        <ToggleGroup
          value={[displayMode]}
          onValueChange={(values) => {
            const mode = values[0];
            if (mode === 'list' || mode === 'tree') onSwitchMode(mode);
          }}
          variant="outline"
          spacing={1}
          className="mb-1 grid w-full grid-cols-2"
          aria-label="显示模式"
        >
          <ToggleGroupItem value="list" onClick={closeMenu} className="w-full touch-manipulation text-xs">
            列表
          </ToggleGroupItem>
          <ToggleGroupItem value="tree" onClick={closeMenu} className="w-full touch-manipulation text-xs">
            树形
          </ToggleGroupItem>
        </ToggleGroup>
        {displayMode === 'list' && hasLaunchContext ? (
          <DropdownMenuItem
            disabled={toolsDisabledOnHome}
            onClick={() => {
              closeMenu();
              onSaveLaunch();
            }}
            className="h-8 rounded-md px-2.5 text-xs font-medium"
          >
            {hasLaunchBookmark ? <FilePenLine className="size-4" /> : <Star className="size-4" />}
            {hasLaunchBookmark ? '编辑当前页面' : '添加当前页面'}
          </DropdownMenuItem>
        ) : null}
        {displayMode === 'list' ? (
          <>
            <DropdownMenuItem
              disabled={toolsDisabledOnHome || !canCreateInCurrentFolder}
              onClick={() => {
                closeMenu();
                onCreateFolder();
              }}
              className="h-8 rounded-md px-2.5 text-xs font-medium"
            >
              <FolderPlus className="size-4" />
              新建文件夹
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={toolsDisabledOnHome || !canCreateInCurrentFolder}
              onClick={() => {
                closeMenu();
                onCreateBookmark();
              }}
              className="h-8 rounded-md px-2.5 text-xs font-medium"
            >
              <Bookmark className="size-4" />
              添加书签
            </DropdownMenuItem>
          </>
        ) : null}
        <DropdownMenuItem
          disabled={toolsDisabledOnHome || selectableCount === 0 || searching}
          onClick={() => {
            closeMenu();
            onSelectMode();
          }}
          className="h-8 rounded-md px-2.5 text-xs font-medium"
        >
          <SquareCheckBig className="size-4" />
          选择项目
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            closeMenu();
            onOpenSettings();
          }}
          className="h-8 rounded-md px-2.5 text-xs font-medium"
        >
          <Settings2 className="size-4" />
          设置
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

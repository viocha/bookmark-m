import { ChevronDown, ChevronRight, Folder, FolderPlus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { isProtectedNode, type FolderTreeNode } from '@/lib/bookmark-service';
import { cn } from '@/lib/utils';
import { useImmediateMenuDismiss } from '../hooks/useImmediateMenuDismiss';

type MoveFolderTreeProps = {
  nodes: FolderTreeNode[];
  expandedIds: string[];
  targetFolderId: string;
  movingIds: string[];
  onToggleExpanded: (folderId: string) => void;
  onSelectTarget: (folder: FolderTreeNode) => void;
  onCreateFolder: (folder: FolderTreeNode) => void;
  onRenameFolder: (folder: FolderTreeNode) => void;
  onDeleteFolder: (folder: FolderTreeNode) => void;
};

export function MoveFolderTree({
  nodes,
  expandedIds,
  targetFolderId,
  movingIds,
  onToggleExpanded,
  onSelectTarget,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
}: MoveFolderTreeProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const selectedFolderRef = useRef<HTMLButtonElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const closeMenu = useCallback(() => {
    setOpenMenuId(null);
  }, []);
  useImmediateMenuDismiss({ open: openMenuId !== null, onClose: closeMenu, triggerRef, contentRef });

  useLayoutEffect(() => {
    selectedFolderRef.current?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
  }, []);

  const renderNodes = (treeNodes: FolderTreeNode[]): React.ReactNode =>
    <div className="flex flex-col gap-1">{treeNodes.map((folder) => {
      const expanded = expandedIds.includes(folder.id);
      const selectable = !movingIds.includes(folder.id);
      return (
        <div key={folder.id} className="flex flex-col gap-1">
          <div
            className={cn(
              'relative flex min-h-7 items-center gap-0.5 rounded-lg pr-9 transition-colors',
              targetFolderId === folder.id
                ? 'bg-accent'
                : selectable && 'hover:bg-muted/40',
            )}
            style={{ paddingLeft: `${6 + folder.depth * 12}px` }}
          >
              {folder.children.length > 0 ? (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="size-5 hover:bg-transparent aria-expanded:bg-transparent"
                  aria-label={expanded ? '折叠文件夹' : '展开文件夹'}
                  aria-expanded={expanded}
                  disabled={!selectable}
                  onClick={() => onToggleExpanded(folder.id)}
                >
                  {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                </Button>
              ) : (
                <span className="size-5 shrink-0" />
              )}
              <Button
                ref={targetFolderId === folder.id ? selectedFolderRef : undefined}
                variant="ghost"
                size="sm"
                disabled={!selectable}
                aria-pressed={targetFolderId === folder.id}
                onClick={() => onSelectTarget(folder)}
                className="min-w-0 flex-1 justify-start gap-1.5 px-1.5 py-0 text-left hover:bg-transparent"
              >
                <Folder data-icon="inline-start" />
                <span className="min-w-0 flex-1 truncate">{folder.title}</span>
                {folder.childCount > 0 ? (
                  <span className="shrink-0 px-0.5 text-[11px] text-muted-foreground">
                    {folder.childCount}
                  </span>
                ) : null}
              </Button>
            <div className="absolute right-1 top-1/2 -translate-y-1/2" data-move-item-menu>
              <DropdownMenu
                open={openMenuId === folder.id}
                onOpenChange={(open) => setOpenMenuId(open ? folder.id : null)}
              >
                <DropdownMenuTrigger render={<Button
                    ref={openMenuId === folder.id ? triggerRef : undefined}
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label="打开文件夹菜单"
                    className={cn(
                      'touch-manipulation rounded-full',
                      openMenuId === folder.id && 'bg-muted text-foreground',
                    )}
                  />}>
                    <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  ref={openMenuId === folder.id ? contentRef : undefined}
                  align="end"
                  side="bottom"

                  className="w-32 rounded-lg p-1"
                >
                  <DropdownMenuItem
                    onClick={() => {
                      closeMenu();
                      onCreateFolder(folder);
                    }}
                    className="h-8 rounded-md px-2.5 text-xs font-medium"
                  >
                    <FolderPlus className="size-4" />
                    新建文件夹
                  </DropdownMenuItem>
                  {!isProtectedNode(folder.id) ? (
                    <DropdownMenuItem
                      onClick={() => {
                        closeMenu();
                        onRenameFolder(folder);
                      }}
                      className="h-8 rounded-md px-2.5 text-xs font-medium"
                    >
                      <Pencil className="size-4" />
                      重命名
                    </DropdownMenuItem>
                  ) : null}
                  {!isProtectedNode(folder.id) ? (
                    <DropdownMenuItem
                      onClick={() => {
                        closeMenu();
                        onDeleteFolder(folder);
                      }}
                      variant="destructive"
                      className="h-8 rounded-md px-2.5 text-xs font-medium"
                    >
                      <Trash2 className="size-4" />
                      删除
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {expanded && folder.children.length > 0 ? renderNodes(folder.children) : null}
        </div>
      );
    })}</div>;

  return <>{renderNodes(nodes)}</>;
}

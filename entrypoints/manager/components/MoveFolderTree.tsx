import { ChevronDown, ChevronRight, Folder, FolderPlus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const closeMenu = useCallback(() => {
    setOpenMenuId(null);
  }, []);
  useImmediateMenuDismiss({ open: openMenuId !== null, onClose: closeMenu, triggerRef, contentRef });

  const renderNodes = (treeNodes: FolderTreeNode[]): React.ReactNode =>
    treeNodes.map((folder) => {
      const expanded = expandedIds.includes(folder.id);
      const selectable = !movingIds.includes(folder.id);

      return (
        <div key={folder.id}>
          <div className="relative">
            <button
              type="button"
              className={cn(
                'flex w-full touch-manipulation items-center gap-0.5 rounded-lg px-1 py-0.5 pr-10 text-left',
                targetFolderId === folder.id && 'bg-primary/10',
              )}
              disabled={!selectable}
              onClick={() => onSelectTarget(folder)}
              style={{ paddingLeft: `${6 + folder.depth * 12}px` }}
            >
              {folder.children.length > 0 ? (
                <span
                  role="button"
                  tabIndex={0}
                  className="flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground"
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleExpanded(folder.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      event.stopPropagation();
                      onToggleExpanded(folder.id);
                    }
                  }}
                >
                  {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                </span>
              ) : (
                <span className="size-5 shrink-0" />
              )}
              <div
                className={cn(
                  'flex min-w-0 flex-1 items-center gap-1.5 rounded-lg px-1.5 py-1 text-sm',
                  selectable ? 'text-foreground' : 'cursor-not-allowed text-muted-foreground',
                )}
              >
                <Folder className="size-3.5 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate">{folder.title}</span>
                {folder.childCount > 0 ? (
                  <span className="shrink-0 px-0.5 text-[11px] text-muted-foreground">
                    {folder.childCount}
                  </span>
                ) : null}
              </div>
            </button>
            <div className="absolute right-1 top-1/2 -translate-y-1/2" data-move-item-menu>
              <DropdownMenu
                open={openMenuId === folder.id}
                onOpenChange={(open) => setOpenMenuId(open ? folder.id : null)}
              >
                <DropdownMenuTrigger asChild>
                  <button
                    ref={openMenuId === folder.id ? triggerRef : undefined}
                    type="button"
                    className={cn(
                      'flex size-7 touch-manipulation items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-[background-color,color,transform] active:scale-[0.96]',
                      openMenuId === folder.id && 'bg-muted text-foreground',
                    )}
                  >
                    <MoreHorizontal className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  ref={openMenuId === folder.id ? contentRef : undefined}
                  align="end"
                  collisionPadding={8}
                  className="w-32 rounded-2xl p-1"
                >
                  <DropdownMenuItem
                    onSelect={() => {
                      closeMenu();
                      onCreateFolder(folder);
                    }}
                    className="h-8 rounded-xl px-2.5 text-xs font-medium"
                  >
                    <FolderPlus className="size-4" />
                    新建文件夹
                  </DropdownMenuItem>
                  {!isProtectedNode(folder.id) ? (
                    <DropdownMenuItem
                      onSelect={() => {
                        closeMenu();
                        onRenameFolder(folder);
                      }}
                      className="h-8 rounded-xl px-2.5 text-xs font-medium"
                    >
                      <Pencil className="size-4" />
                      重命名
                    </DropdownMenuItem>
                  ) : null}
                  {!isProtectedNode(folder.id) ? (
                    <DropdownMenuItem
                      onSelect={() => {
                        closeMenu();
                        onDeleteFolder(folder);
                      }}
                      variant="destructive"
                      className="h-8 rounded-xl px-2.5 text-xs font-medium"
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
    });

  return <>{renderNodes(nodes)}</>;
}

import { Folder, FolderPlus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { isProtectedNode, type FolderTreeNode } from '@/lib/bookmark-service';
import { cn } from '@/lib/utils';

type MoveFolderTreeProps = {
  nodes: FolderTreeNode[];
  expandedIds: string[];
  targetFolderId: string;
  movingIds: string[];
  actionTargetId?: string;
  menuDirection: 'up' | 'down';
  onToggleExpanded: (folderId: string) => void;
  onSelectTarget: (folder: FolderTreeNode) => void;
  onToggleActionMenu: (folder: FolderTreeNode, button: HTMLElement) => void;
  onCreateFolder: (folder: FolderTreeNode) => void;
  onRenameFolder: (folder: FolderTreeNode) => void;
  onDeleteFolder: (folder: FolderTreeNode) => void;
};

export function MoveFolderTree({
  nodes,
  expandedIds,
  targetFolderId,
  movingIds,
  actionTargetId,
  menuDirection,
  onToggleExpanded,
  onSelectTarget,
  onToggleActionMenu,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
}: MoveFolderTreeProps) {
  const renderNodes = (treeNodes: FolderTreeNode[]): React.ReactNode =>
    treeNodes.map((folder) => {
      const expanded = expandedIds.includes(folder.id);
      const selectable = !movingIds.includes(folder.id);

      return (
        <div key={folder.id}>
          <button
            type="button"
            className={cn(
              'flex w-full items-center gap-0.5 rounded-lg px-1 py-0.5 text-left',
              targetFolderId === folder.id && 'bg-primary/10',
            )}
            disabled={!selectable}
            onClick={() => onSelectTarget(folder)}
            style={{ paddingLeft: `${6 + folder.depth * 12}px` }}
          >
            {folder.children.length > 0 ? (
              <span className="flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground">
                <span className={cn('transition-transform', expanded ? 'rotate-90' : 'rotate-0')}>›</span>
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
                <span className="shrink-0 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground">
                  {folder.childCount}
                </span>
              ) : null}
            </div>
          </button>
          <div className="relative -mt-7 mr-1 flex justify-end" data-move-item-menu>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onToggleActionMenu(folder, event.currentTarget);
              }}
              className={cn(
                'flex size-7 items-center justify-center rounded-full bg-secondary text-secondary-foreground active:bg-secondary/80',
                actionTargetId === folder.id && 'bg-primary/12 text-primary',
              )}
            >
              <MoreHorizontal className="size-4" />
            </button>
            {actionTargetId === folder.id ? (
              <div
                className={cn(
                  'absolute right-0 z-[95] w-32 rounded-2xl border bg-white/96 p-1 shadow-xl',
                  menuDirection === 'up' ? 'bottom-8' : 'top-8',
                )}
              >
                <button
                  type="button"
                  onClick={() => onCreateFolder(folder)}
                  className="flex h-8 w-full items-center gap-1.5 rounded-xl px-2.5 text-left text-xs font-medium"
                >
                  <FolderPlus className="size-4" />
                  新建文件夹
                </button>
                {!isProtectedNode(folder.id) ? (
                  <button
                    type="button"
                    onClick={() => onRenameFolder(folder)}
                    className="flex h-8 w-full items-center gap-1.5 rounded-xl px-2.5 text-left text-xs font-medium"
                  >
                    <Pencil className="size-4" />
                    重命名
                  </button>
                ) : null}
                {!isProtectedNode(folder.id) ? (
                  <button
                    type="button"
                    onClick={() => onDeleteFolder(folder)}
                    className="flex h-8 w-full items-center gap-1.5 rounded-xl px-2.5 text-left text-xs font-medium text-destructive"
                  >
                    <Trash2 className="size-4" />
                    删除
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
          {expanded && folder.children.length > 0 ? renderNodes(folder.children) : null}
        </div>
      );
    });

  return <>{renderNodes(nodes)}</>;
}

import { createPortal } from 'react-dom';
import { ChevronDown, ChevronRight, Folder, FolderPlus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

import { isProtectedNode, type FolderTreeNode } from '@/lib/bookmark-service';
import { cn, swallowNextDocumentClick } from '@/lib/utils';
import { getCompensatedMenuPosition } from '../utils';

type MoveFolderTreeProps = {
  nodes: FolderTreeNode[];
  expandedIds: string[];
  targetFolderId: string;
  movingIds: string[];
  actionTargetId?: string;
  menuAnchor: { top: number; bottom: number; right: number } | null;
  menuDirection: 'up' | 'down';
  onCloseActionMenu: () => void;
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
  menuAnchor,
  menuDirection,
  onCloseActionMenu,
  onToggleExpanded,
  onSelectTarget,
  onToggleActionMenu,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
}: MoveFolderTreeProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);

  useLayoutEffect(() => {
    if (!actionTargetId || !menuAnchor || !menuRef.current) {
      setMenuStyle(null);
      return;
    }

    const rect = menuRef.current.getBoundingClientRect();
    const preferredTop = menuDirection === 'down'
      ? menuAnchor.top
      : window.innerHeight - menuAnchor.bottom - rect.height;

    setMenuStyle({
      ...getCompensatedMenuPosition({
        anchorRight: menuAnchor.right,
        preferredTop,
        menuWidth: rect.width,
        menuHeight: rect.height,
      }),
      visibility: 'visible',
    });
  }, [actionTargetId, menuAnchor, menuDirection]);

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
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleActionMenu(folder, event.currentTarget);
                }}
                className={cn(
                  'flex size-7 touch-manipulation items-center justify-center rounded-full bg-secondary text-secondary-foreground',
                  actionTargetId === folder.id && 'bg-muted text-foreground',
                )}
              >
                <MoreHorizontal className="size-4" />
              </button>
              {actionTargetId === folder.id ? (
                menuAnchor ? createPortal(
                  <>
                    <div
                      className="fixed inset-0 z-[210]"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        swallowNextDocumentClick();
                        onCloseActionMenu();
                      }}
                    />
                    <div
                      ref={menuRef}
                      data-move-item-menu
                      className="fixed z-[220] w-32 rounded-2xl border bg-white p-1 shadow-xl"
                      style={menuStyle ?? { left: -9999, top: -9999, visibility: 'hidden' }}
                    >
                      <button
                        type="button"
                        onClick={() => onCreateFolder(folder)}
                        className="flex h-8 w-full touch-manipulation items-center gap-1.5 rounded-xl px-2.5 text-left text-xs font-medium"
                      >
                        <FolderPlus className="size-4" />
                        新建文件夹
                      </button>
                      {!isProtectedNode(folder.id) ? (
                        <button
                          type="button"
                          onClick={() => onRenameFolder(folder)}
                          className="flex h-8 w-full touch-manipulation items-center gap-1.5 rounded-xl px-2.5 text-left text-xs font-medium"
                        >
                          <Pencil className="size-4" />
                          重命名
                        </button>
                      ) : null}
                      {!isProtectedNode(folder.id) ? (
                        <button
                          type="button"
                          onClick={() => onDeleteFolder(folder)}
                          className="flex h-8 w-full touch-manipulation items-center gap-1.5 rounded-xl px-2.5 text-left text-xs font-medium text-destructive"
                        >
                          <Trash2 className="size-4" />
                          删除
                        </button>
                      ) : null}
                    </div>
                  </>,
                  document.body,
                ) : null
              ) : null}
            </div>
          </div>
          {expanded && folder.children.length > 0 ? renderNodes(folder.children) : null}
        </div>
      );
    });

  return <>{renderNodes(nodes)}</>;
}

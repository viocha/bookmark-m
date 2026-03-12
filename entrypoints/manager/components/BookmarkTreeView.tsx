import { sortFoldersFirst } from '@/lib/bookmark-service';

import { ItemRow } from './ItemRow';

type BookmarkTreeViewProps = {
  nodes: chrome.bookmarks.BookmarkTreeNode[];
  expandedIds: string[];
  folderChildCounts: Record<string, number>;
  selectedIds: string[];
  selectionMode: boolean;
  actionTargetId?: string;
  actionMenuDirection: 'up' | 'down';
  renderItemMenu: (node: chrome.bookmarks.BookmarkTreeNode) => React.ReactNode;
  onToggleFolder: (folderId: string) => void;
  onOpenNode: (node: chrome.bookmarks.BookmarkTreeNode) => void;
  onToggleSelect: (id: string) => void;
  onToggleActionMenu: (node: chrome.bookmarks.BookmarkTreeNode, button: HTMLElement) => void;
};

export function BookmarkTreeView({
  nodes,
  expandedIds,
  folderChildCounts,
  selectedIds,
  selectionMode,
  actionTargetId,
  actionMenuDirection,
  renderItemMenu,
  onToggleFolder,
  onOpenNode,
  onToggleSelect,
  onToggleActionMenu,
}: BookmarkTreeViewProps) {
  const renderNodes = (treeNodes: chrome.bookmarks.BookmarkTreeNode[], depth = 0): React.ReactNode =>
    sortFoldersFirst(treeNodes).map((node) => {
      const folder = !node.url;
      const expanded = folder ? expandedIds.includes(node.id) : false;
      const children = folder ? sortFoldersFirst(node.children ?? []) : [];

      return (
        <div key={node.id} data-tree-node-id={node.id}>
          <div style={{ paddingLeft: `${depth * 14}px` }}>
            <ItemRow
              node={node}
              folderChildCount={folderChildCounts[node.id]}
              selected={selectedIds.includes(node.id)}
              selectionMode={selectionMode}
              compact
              longPressMenu={false}
              expanded={expanded}
              menuOpen={actionTargetId === node.id}
              menuDirection={actionMenuDirection}
              menuContent={renderItemMenu(node)}
              onClick={() => {
                if (selectionMode) {
                  onToggleSelect(node.id);
                  return;
                }
                if (folder) {
                  onToggleFolder(node.id);
                  return;
                }
                onOpenNode(node);
              }}
              onAction={(button) => onToggleActionMenu(node, button)}
            />
          </div>
          {folder && expanded && children.length > 0 ? renderNodes(children, depth + 1) : null}
        </div>
      );
    });

  return <>{renderNodes(nodes)}</>;
}

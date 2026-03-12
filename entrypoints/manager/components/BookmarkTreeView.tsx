import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { sortFoldersFirst } from '@/lib/bookmark-service';

import { ItemRow } from './ItemRow';

type BookmarkTreeViewProps = {
  nodes: chrome.bookmarks.BookmarkTreeNode[];
  expandedIds: string[];
  folderChildCounts: Record<string, number>;
  selectedIds: string[];
  selectionMode: boolean;
  compact: boolean;
  actionTargetId?: string;
  actionMenuAnchor: { top: number; bottom: number; right: number } | null;
  actionMenuDirection: 'up' | 'down';
  renderItemMenu: (node: chrome.bookmarks.BookmarkTreeNode, compact: boolean) => React.ReactNode;
  onCloseActionMenu: () => void;
  onToggleFolder: (folderId: string) => void;
  onOpenNode: (node: chrome.bookmarks.BookmarkTreeNode) => void;
  onToggleSelect: (id: string) => void;
  onToggleActionMenu: (node: chrome.bookmarks.BookmarkTreeNode, button: HTMLElement) => void;
  dragEnabled: boolean;
  highlightedNodeId?: string | null;
};

type SortableTreeRowProps = {
  node: chrome.bookmarks.BookmarkTreeNode;
  folderChildCounts: Record<string, number>;
  selectedIds: string[];
  selectionMode: boolean;
  compact: boolean;
  actionTargetId?: string;
  actionMenuAnchor: { top: number; bottom: number; right: number } | null;
  actionMenuDirection: 'up' | 'down';
  renderItemMenu: (node: chrome.bookmarks.BookmarkTreeNode, compact: boolean) => React.ReactNode;
  onCloseActionMenu: () => void;
  onToggleFolder: (folderId: string) => void;
  onOpenNode: (node: chrome.bookmarks.BookmarkTreeNode) => void;
  onToggleSelect: (id: string) => void;
  onToggleActionMenu: (node: chrome.bookmarks.BookmarkTreeNode, button: HTMLElement) => void;
  expanded: boolean;
  dragEnabled: boolean;
  highlightedNodeId?: string | null;
};

function SortableTreeRow({
  node,
  folderChildCounts,
  selectedIds,
  selectionMode,
  compact,
  actionTargetId,
  actionMenuAnchor,
  actionMenuDirection,
  renderItemMenu,
  onCloseActionMenu,
  onToggleFolder,
  onOpenNode,
  onToggleSelect,
  onToggleActionMenu,
  expanded,
  dragEnabled,
  highlightedNodeId,
}: SortableTreeRowProps) {
  const folder = !node.url;
  const rowDragEnabled = dragEnabled && node.parentId !== '0';
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id,
    disabled: !rowDragEnabled,
  });

  return (
    <ItemRow
      node={node}
      folderChildCount={folderChildCounts[node.id]}
      selected={selectedIds.includes(node.id)}
      selectionMode={selectionMode}
      compact={compact}
      treeRow
      compactTree={compact}
      longPressMenu={false}
      expanded={expanded}
      menuOpen={actionTargetId === node.id}
      menuAnchor={actionTargetId === node.id ? actionMenuAnchor : null}
      menuDirection={actionMenuDirection}
      menuContent={renderItemMenu(node, compact)}
      onCloseMenu={onCloseActionMenu}
      highlighted={highlightedNodeId === node.id}
      onToggleExpand={folder ? () => onToggleFolder(node.id) : undefined}
      onClick={() => {
        if (selectionMode) {
          onToggleSelect(node.id);
          if (folder) {
            onToggleFolder(node.id);
          }
          return;
        }
        if (folder) {
          onToggleFolder(node.id);
          return;
        }
        onOpenNode(node);
      }}
      onAction={(button) => onToggleActionMenu(node, button)}
      wrapperRef={setNodeRef}
      wrapperStyle={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : undefined,
      }}
      wrapperClassName={isDragging ? 'pointer-events-none' : undefined}
      contentButtonProps={rowDragEnabled ? { ...attributes, ...listeners } : undefined}
    />
  );
}

export function BookmarkTreeView({
  nodes,
  expandedIds,
  folderChildCounts,
  selectedIds,
  selectionMode,
  compact,
  actionTargetId,
  actionMenuAnchor,
  actionMenuDirection,
  renderItemMenu,
  onCloseActionMenu,
  onToggleFolder,
  onOpenNode,
  onToggleSelect,
  onToggleActionMenu,
  dragEnabled,
  highlightedNodeId,
}: BookmarkTreeViewProps) {
  const renderNodes = (treeNodes: chrome.bookmarks.BookmarkTreeNode[], depth = 0): React.ReactNode =>
    (
      <SortableContext items={sortFoldersFirst(treeNodes).map((node) => node.id)} strategy={verticalListSortingStrategy}>
        {sortFoldersFirst(treeNodes).map((node) => {
      const folder = !node.url;
      const expanded = folder ? expandedIds.includes(node.id) : false;
      const children = folder ? sortFoldersFirst(node.children ?? []) : [];

      return (
        <div key={node.id} data-tree-node-id={node.id}>
          <div style={{ paddingLeft: `${depth * 10}px` }}>
            <SortableTreeRow
              node={node}
              folderChildCounts={folderChildCounts}
              selectedIds={selectedIds}
              selectionMode={selectionMode}
              compact={compact}
              expanded={expanded}
              actionTargetId={actionTargetId}
              actionMenuAnchor={actionMenuAnchor}
              actionMenuDirection={actionMenuDirection}
              renderItemMenu={renderItemMenu}
              onCloseActionMenu={onCloseActionMenu}
              onToggleFolder={onToggleFolder}
              onOpenNode={onOpenNode}
              onToggleSelect={onToggleSelect}
              onToggleActionMenu={onToggleActionMenu}
              dragEnabled={dragEnabled}
              highlightedNodeId={highlightedNodeId}
            />
          </div>
          {folder && expanded && children.length > 0 ? renderNodes(children, depth + 1) : null}
        </div>
      );
    })}
      </SortableContext>
    );

  return <>{renderNodes(nodes)}</>;
}

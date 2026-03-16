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
  renderItemMenu: (node: chrome.bookmarks.BookmarkTreeNode, compact: boolean, closeMenu: () => void) => React.ReactNode;
  onToggleFolder: (folderId: string) => void;
  onOpenNode: (node: chrome.bookmarks.BookmarkTreeNode) => void;
  onToggleSelect: (id: string) => void;
  dragEnabled: boolean;
  highlightedNodeId?: string | null;
};

type SortableTreeRowProps = {
  node: chrome.bookmarks.BookmarkTreeNode;
  folderChildCounts: Record<string, number>;
  selectedIds: string[];
  selectionMode: boolean;
  compact: boolean;
  renderItemMenu: (node: chrome.bookmarks.BookmarkTreeNode, compact: boolean, closeMenu: () => void) => React.ReactNode;
  onToggleFolder: (folderId: string) => void;
  onOpenNode: (node: chrome.bookmarks.BookmarkTreeNode) => void;
  onToggleSelect: (id: string) => void;
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
  renderItemMenu,
  onToggleFolder,
  onOpenNode,
  onToggleSelect,
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
      menuContent={(closeMenu) => renderItemMenu(node, compact, closeMenu)}
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
  renderItemMenu,
  onToggleFolder,
  onOpenNode,
  onToggleSelect,
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
              renderItemMenu={renderItemMenu}
              onToggleFolder={onToggleFolder}
              onOpenNode={onOpenNode}
              onToggleSelect={onToggleSelect}
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

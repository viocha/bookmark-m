import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useMemo, useRef, useState } from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { getDisplayTitle, sortFoldersFirst } from '@/lib/bookmark-service';

import { BookmarkTreeView } from './BookmarkTreeView';
import { ItemRow } from './ItemRow';
import { PathBar } from './PathBar';

type SortableListRowProps = {
  node: chrome.bookmarks.BookmarkTreeNode;
  folderChildCount?: number;
  selected: boolean;
  selectionMode: boolean;
  searchPath?: string;
  compact: boolean;
  menuContent: (closeMenu: () => void) => React.ReactNode;
  highlighted: boolean;
  onClick: () => void;
  dragEnabled: boolean;
};

function SortableListRow({
  node,
  folderChildCount,
  selected,
  selectionMode,
  searchPath,
  compact,
  menuContent,
  highlighted,
  onClick,
  dragEnabled,
}: SortableListRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id,
    disabled: !dragEnabled,
  });

  return (
    <ItemRow
      node={node}
      folderChildCount={folderChildCount}
      selected={selected}
      selectionMode={selectionMode}
      searchPath={searchPath}
      compact={compact}
      treeRow={false}
      compactTree={false}
      longPressMenu={false}
      expanded={false}
      menuContent={menuContent}
      highlighted={highlighted}
      onClick={onClick}
      wrapperRef={setNodeRef}
      wrapperStyle={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : undefined,
      }}
      wrapperClassName={isDragging ? 'pointer-events-none' : undefined}
      contentButtonProps={dragEnabled ? { ...attributes, ...listeners } : undefined}
    />
  );
}

function reorderVisibleIds(
  nodes: chrome.bookmarks.BookmarkTreeNode[],
  nodeId: string,
  visibleInsertIndex: number,
) {
  const draggedNode = nodes.find((node) => node.id === nodeId);
  if (!draggedNode) return nodes.map((node) => node.id);

  const visibleWithoutDragged = nodes.filter((node) => node.id !== nodeId);
  const clampedInsertIndex = Math.max(0, Math.min(visibleInsertIndex, visibleWithoutDragged.length));
  const nodesBeforeInsert = visibleWithoutDragged.slice(0, clampedInsertIndex);

  const targetIndex = draggedNode.url
    ? visibleWithoutDragged.filter((node) => !node.url).length + nodesBeforeInsert.filter((node) => !!node.url).length
    : nodesBeforeInsert.filter((node) => !node.url).length;

  const nextNodes = [...visibleWithoutDragged];
  nextNodes.splice(targetIndex, 0, draggedNode);
  return nextNodes.map((node) => node.id);
}

function findTreeNode(nodes: chrome.bookmarks.BookmarkTreeNode[], nodeId: string): chrome.bookmarks.BookmarkTreeNode | null {
  for (const node of nodes) {
    if (node.id === nodeId) return node;
    if (!node.url) {
      const found = findTreeNode(node.children ?? [], nodeId);
      if (found) return found;
    }
  }

  return null;
}

function getSiblingNodes(nodes: chrome.bookmarks.BookmarkTreeNode[], parentId: string) {
  if (parentId === '0') {
    return sortFoldersFirst(nodes);
  }

  const parentNode = findTreeNode(nodes, parentId);
  if (!parentNode || parentNode.url) return [];
  return sortFoldersFirst(parentNode.children ?? []);
}

function reorderTreeNodes(
  nodes: chrome.bookmarks.BookmarkTreeNode[],
  parentId: string,
  nodeId: string,
  visibleInsertIndex: number,
): chrome.bookmarks.BookmarkTreeNode[] {
  if (parentId === '0') {
    const nextIds = reorderVisibleIds(sortFoldersFirst(nodes), nodeId, visibleInsertIndex);
    const nodeMap = new Map(nodes.map((node) => [node.id, node]));
    return nextIds.map((id) => nodeMap.get(id)).filter((node): node is chrome.bookmarks.BookmarkTreeNode => Boolean(node));
  }

  return nodes.map((node) => {
    if (node.id !== parentId || node.url) {
      if (node.url) return node;
      return {
        ...node,
        children: reorderTreeNodes(node.children ?? [], parentId, nodeId, visibleInsertIndex),
      };
    }

    const sortedChildren = sortFoldersFirst(node.children ?? []);
    const nextIds = reorderVisibleIds(sortedChildren, nodeId, visibleInsertIndex);
    const childMap = new Map((node.children ?? []).map((child) => [child.id, child]));
    return {
      ...node,
      children: nextIds.map((id) => childMap.get(id)).filter((child): child is chrome.bookmarks.BookmarkTreeNode => Boolean(child)),
    };
  });
}

type ManagerContentProps = {
  scrollAreaRef: React.RefObject<HTMLDivElement | null>;
  deferredSearch: string;
  displayMode: 'list' | 'tree';
  isHomeView: boolean;
  breadcrumbs: chrome.bookmarks.BookmarkTreeNode[];
  onGoHome: () => void;
  onGoToFolder: (id: string) => void;
  errorMessage: string;
  searching: boolean;
  loading: boolean;
  roots: chrome.bookmarks.BookmarkTreeNode[];
  visibleNodes: chrome.bookmarks.BookmarkTreeNode[];
  folderChildCounts: Record<string, number>;
  selectedIds: string[];
  selectionMode: boolean;
  searchPaths: Record<string, string>;
  listCompact: boolean;
  treeCompact: boolean;
  expandedTreeIds: string[];
  highlightedNodeId?: string | null;
  getItemMenuContent: (node: chrome.bookmarks.BookmarkTreeNode, compact: boolean, closeMenu: () => void) => React.ReactNode;
  onToggleTreeFolder: (folderId: string) => void;
  onOpenNode: (node: chrome.bookmarks.BookmarkTreeNode) => void;
  onToggleSelect: (id: string) => void;
  onReorderCurrentListItem: (nodeId: string, insertIndex: number, parentId?: string) => void;
};

export function ManagerContent({
  scrollAreaRef,
  deferredSearch,
  displayMode,
  isHomeView,
  breadcrumbs,
  onGoHome,
  onGoToFolder,
  errorMessage,
  searching,
  loading,
  roots,
  visibleNodes,
  folderChildCounts,
  selectedIds,
  selectionMode,
  searchPaths,
  listCompact,
  treeCompact,
  expandedTreeIds,
  highlightedNodeId,
  getItemMenuContent,
  onToggleTreeFolder,
  onOpenNode,
  onToggleSelect,
  onReorderCurrentListItem,
}: ManagerContentProps) {
  const isTreeMode = displayMode === 'tree' && !deferredSearch;
  const searchActive = Boolean(deferredSearch);
  const currentCompact = searchActive ? false : isTreeMode ? treeCompact : listCompact;
  const listRowCompact = searchActive ? false : listCompact;
  const canDragReorder = displayMode === 'list' && !deferredSearch && !selectionMode;
  const canDragTreeReorder = isTreeMode && !selectionMode;
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const [treeOrderedRoots, setTreeOrderedRoots] = useState<chrome.bookmarks.BookmarkTreeNode[]>([]);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const suppressClickRef = useRef<string | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 220,
        tolerance: 14,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    setOrderedIds(visibleNodes.map((node) => node.id));
  }, [visibleNodes]);

  useEffect(() => {
    setTreeOrderedRoots(roots);
  }, [roots]);

  const orderedVisibleNodes = useMemo(() => {
    const nodeMap = new Map(visibleNodes.map((node) => [node.id, node]));
    return orderedIds.map((id) => nodeMap.get(id)).filter((node): node is chrome.bookmarks.BookmarkTreeNode => Boolean(node));
  }, [orderedIds, visibleNodes]);

  const activeDragNode = useMemo(
    () => orderedVisibleNodes.find((node) => node.id === activeDragId) ?? findTreeNode(treeOrderedRoots, activeDragId ?? ''),
    [activeDragId, orderedVisibleNodes, treeOrderedRoots],
  );

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveDragId(String(active.id));
  };

  const handleDragCancel = () => {
    setActiveDragId(null);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveDragId(null);
    if (!over || active.id === over.id) return;

    if (isTreeMode) {
      const activeNode = findTreeNode(treeOrderedRoots, String(active.id));
      const overNode = findTreeNode(treeOrderedRoots, String(over.id));
      if (!activeNode || !overNode || activeNode.parentId !== overNode.parentId || !activeNode.parentId || activeNode.parentId === '0') {
        return;
      }

      const newIndex = getSiblingNodes(treeOrderedRoots, activeNode.parentId).findIndex((node) => node.id === String(over.id));
      if (newIndex === -1) return;

      setTreeOrderedRoots((prev) => reorderTreeNodes(prev, activeNode.parentId!, String(active.id), newIndex));
      suppressClickRef.current = String(active.id);
      window.setTimeout(() => {
        suppressClickRef.current = null;
      }, 180);
      onReorderCurrentListItem(String(active.id), newIndex, activeNode.parentId);
      return;
    }

    const oldIndex = orderedIds.indexOf(String(active.id));
    const newIndex = orderedIds.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const nextIds = reorderVisibleIds(orderedVisibleNodes, String(active.id), newIndex);
    setOrderedIds(nextIds);
    suppressClickRef.current = String(active.id);
    window.setTimeout(() => {
      suppressClickRef.current = null;
    }, 180);
    onReorderCurrentListItem(String(active.id), newIndex);
  };

  useEffect(() => {
    if (!highlightedNodeId) return;

    window.requestAnimationFrame(() => {
      const target = scrollAreaRef.current?.querySelector(`[data-tree-node-id="${highlightedNodeId}"], [data-item-node-id="${highlightedNodeId}"]`) as HTMLElement | null;
      target?.scrollIntoView({ block: 'center' });
    });
  }, [expandedTreeIds, highlightedNodeId, scrollAreaRef, roots, visibleNodes]);

  return (
    <>
      <PathBar
        visible={!deferredSearch && displayMode === 'list'}
        isHomeView={isHomeView}
        breadcrumbs={breadcrumbs}
        onGoHome={onGoHome}
        onGoToFolder={onGoToFolder}
        getTitle={getDisplayTitle}
      />

      <div ref={scrollAreaRef} className="min-h-0 flex-1">
        <ScrollArea className="h-full">
          <div className={cn(currentCompact ? 'p-2' : 'p-3')}>
            {errorMessage ? (
              <section className="mb-3 rounded-2xl border border-destructive/35 bg-destructive/8 px-3 py-3 text-sm text-destructive">
                {errorMessage}
              </section>
            ) : null}

            {(isTreeMode ? roots.length === 0 : visibleNodes.length === 0) ? (
              <div className="rounded-2xl border bg-white/86 px-3 py-6 text-center text-sm text-muted-foreground">
                {deferredSearch ? (searching ? '正在搜索…' : '没有找到匹配的书签。') : loading ? '' : '这个文件夹是空的。'}
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragCancel={handleDragCancel}
                onDragEnd={handleDragEnd}
              >
                {isTreeMode ? (
                  <BookmarkTreeView
                    nodes={treeOrderedRoots}
                    expandedIds={expandedTreeIds}
                    folderChildCounts={folderChildCounts}
                    selectedIds={selectedIds}
                    selectionMode={selectionMode}
                    compact={treeCompact}
                    renderItemMenu={getItemMenuContent}
                    onToggleFolder={onToggleTreeFolder}
                    onOpenNode={onOpenNode}
                    onToggleSelect={onToggleSelect}
                    dragEnabled={canDragTreeReorder}
                    highlightedNodeId={highlightedNodeId}
                  />
                ) : (
                  <div className={cn(listCompact ? 'space-y-0.5' : 'space-y-1')}>
                    <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
                      {orderedVisibleNodes.map((node) => (
                        <SortableListRow
                          key={node.id}
                          node={node}
                          folderChildCount={folderChildCounts[node.id]}
                          selected={selectedIds.includes(node.id)}
                          selectionMode={selectionMode}
                          searchPath={deferredSearch ? searchPaths[node.id] : undefined}
                          compact={listRowCompact}
                          menuContent={(closeMenu) => getItemMenuContent(node, listRowCompact, closeMenu)}
                          highlighted={highlightedNodeId === node.id}
                          onClick={() => {
                            if (suppressClickRef.current === node.id) return;
                            if (selectionMode) {
                              onToggleSelect(node.id);
                              return;
                            }
                            onOpenNode(node);
                          }}
                          dragEnabled={canDragReorder}
                        />
                      ))}
                    </SortableContext>
                  </div>
                )}
                <DragOverlay dropAnimation={null}>
                  {activeDragNode ? (
                    <div className="scale-[1.01] shadow-[0_18px_40px_-24px_rgba(0,0,0,0.45)]">
                      <ItemRow
                        node={activeDragNode}
                        folderChildCount={folderChildCounts[activeDragNode.id]}
                        selected={selectedIds.includes(activeDragNode.id)}
                        selectionMode={selectionMode}
                        searchPath={deferredSearch ? searchPaths[activeDragNode.id] : undefined}
                        compact={isTreeMode ? treeCompact : listRowCompact}
                        treeRow={isTreeMode}
                        compactTree={isTreeMode && treeCompact}
                        longPressMenu={false}
                        expanded={Boolean(!activeDragNode.url && expandedTreeIds.includes(activeDragNode.id))}
                        highlighted={false}
                        onClick={() => {}}
                      />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}

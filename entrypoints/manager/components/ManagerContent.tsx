import { ScrollArea } from '@/components/ui/scroll-area';
import { getDisplayTitle } from '@/lib/bookmark-service';

import { BookmarkTreeView } from './BookmarkTreeView';
import { ItemRow } from './ItemRow';
import { PathBar } from './PathBar';

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
  actionTargetId?: string;
  actionMenuDirection: 'up' | 'down';
  expandedTreeIds: string[];
  getItemMenuContent: (node: chrome.bookmarks.BookmarkTreeNode) => React.ReactNode;
  onToggleTreeFolder: (folderId: string) => void;
  onOpenNode: (node: chrome.bookmarks.BookmarkTreeNode) => void;
  onToggleSelect: (id: string) => void;
  onToggleActionMenu: (node: chrome.bookmarks.BookmarkTreeNode, button: HTMLElement) => void;
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
  actionTargetId,
  actionMenuDirection,
  expandedTreeIds,
  getItemMenuContent,
  onToggleTreeFolder,
  onOpenNode,
  onToggleSelect,
  onToggleActionMenu,
}: ManagerContentProps) {
  const isTreeMode = displayMode === 'tree' && !deferredSearch;

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
          <div className="space-y-3 px-3 py-3">
            {errorMessage ? (
              <section className="rounded-2xl border border-destructive/35 bg-destructive/8 px-3 py-3 text-sm text-destructive">
                {errorMessage}
              </section>
            ) : null}

            <section className="space-y-2">
              {(isTreeMode ? roots.length === 0 : visibleNodes.length === 0) ? (
                <div className="rounded-2xl border bg-white/86 px-3 py-6 text-center text-sm text-muted-foreground">
                  {deferredSearch ? (searching ? '正在搜索…' : '没有找到匹配的书签。') : loading ? '' : '这个文件夹是空的。'}
                </div>
              ) : isTreeMode ? (
                <BookmarkTreeView
                  nodes={roots}
                  expandedIds={expandedTreeIds}
                  folderChildCounts={folderChildCounts}
                  selectedIds={selectedIds}
                  selectionMode={selectionMode}
                  actionTargetId={actionTargetId}
                  actionMenuDirection={actionMenuDirection}
                  renderItemMenu={getItemMenuContent}
                  onToggleFolder={onToggleTreeFolder}
                  onOpenNode={onOpenNode}
                  onToggleSelect={onToggleSelect}
                  onToggleActionMenu={onToggleActionMenu}
                />
              ) : (
                visibleNodes.map((node) => (
                  <ItemRow
                    key={node.id}
                    node={node}
                    folderChildCount={folderChildCounts[node.id]}
                    selected={selectedIds.includes(node.id)}
                    selectionMode={selectionMode}
                    searchPath={deferredSearch ? searchPaths[node.id] : undefined}
                    compact={false}
                    longPressMenu={false}
                    expanded={false}
                    menuOpen={actionTargetId === node.id}
                    menuDirection={actionMenuDirection}
                    menuContent={getItemMenuContent(node)}
                    onClick={() => {
                      if (selectionMode) {
                        onToggleSelect(node.id);
                        return;
                      }
                      onOpenNode(node);
                    }}
                    onAction={(button) => onToggleActionMenu(node, button)}
                  />
                ))
              )}
            </section>
          </div>
        </ScrollArea>
      </div>
    </>
  );
}

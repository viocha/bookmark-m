import {
  Bookmark,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Folder,
  FolderPlus,
  House,
  Link2,
  MoreHorizontal,
  MoveRight,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  SquareCheckBig,
  Trash2,
  X,
} from 'lucide-react';
import { startTransition, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Toaster } from '@/components/ui/sonner';
import {
  captureDeletedNodes,
  collectFolderTree,
  createBookmark,
  createFolder,
  deleteNodes,
  ensureFolderId,
  getDisplayTitle,
  getFolderChildren,
  getFolderPath,
  getFolderPathNodes,
  getInitialFolderId,
  getInitialLocationId,
  getLaunchContext,
  getNode,
  getSavedScrollPositions,
  getTreeRoots,
  isFolder,
  isProtectedNode,
  moveNodes,
  normalizeUrl,
  rememberFolder,
  restoreDeletedNodes,
  searchNodes,
  setLastLocationId,
  setSavedScrollPositions,
  setLaunchContext,
  sortFoldersFirst,
  updateBookmarkNode,
  type FolderTreeNode,
  type LaunchContext,
} from '@/lib/bookmark-service';
import { cn } from '@/lib/utils';

type FolderComposerState = {
  open: boolean;
  mode: 'create' | 'edit';
  parentId: string;
  targetId?: string;
  title: string;
};

type BookmarkComposerState = {
  open: boolean;
  mode: 'create' | 'edit';
  parentId: string;
  originalParentId?: string;
  targetId?: string;
  title: string;
  url: string;
};

type MoveState = {
  open: boolean;
  mode: 'move' | 'pick-bookmark-parent';
  ids: string[];
  query: string;
  targetFolderId: string;
};

const HOME_FOLDER_ID = '__home__';

function getFaviconUrl(url: string) {
  return `${chrome.runtime.getURL('/_favicon/')}?pageUrl=${encodeURIComponent(url)}&size=32`;
}

function getBookmarkMeta(node: chrome.bookmarks.BookmarkTreeNode, folderChildCount?: number) {
  if (node.url) {
    return node.url;
  }

  const count = folderChildCount ?? node.children?.length ?? 0;
  return count === 0 ? '空文件夹' : `${count} 个项目`;
}

async function safeCall<T>(task: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await task();
  } catch {
    return fallback;
  }
}

async function safeCallWithTimeout<T>(task: () => Promise<T>, fallback: T, timeoutMs = 4000): Promise<T> {
  try {
    return await Promise.race([
      task(),
      new Promise<T>((resolve) => {
        window.setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } catch {
    return fallback;
  }
}

function collectFolderChildCounts(nodes: chrome.bookmarks.BookmarkTreeNode[]) {
  const counts: Record<string, number> = {};

  const visit = (node: chrome.bookmarks.BookmarkTreeNode) => {
    if (node.url) return;
    const children = node.children ?? [];
    counts[node.id] = children.length;
    for (const child of children) {
      visit(child);
    }
  };

  for (const node of nodes) {
    visit(node);
  }

  return counts;
}

function filterFolderTree(nodes: FolderTreeNode[], keyword: string): FolderTreeNode[] {
  if (!keyword) return nodes;
  const lowered = keyword.trim().toLowerCase();
  if (!lowered) return nodes;

  return nodes
    .map((node) => {
      const children = filterFolderTree(node.children, lowered);
      const matched = node.title.toLowerCase().includes(lowered) || node.path.toLowerCase().includes(lowered);
      if (!matched && children.length === 0) return null;
      return { ...node, children };
    })
    .filter((node): node is FolderTreeNode => Boolean(node));
}

function findFolderPath(nodes: FolderTreeNode[], id: string): string {
  for (const node of nodes) {
    if (node.id === id) return node.path;
    const nested = findFolderPath(node.children, id);
    if (nested) return nested;
  }
  return '';
}

function ItemRow({
  node,
  folderChildCount,
  selected,
  selectionMode,
  searchPath,
  menuOpen,
  menuDirection,
  menuContent,
  onClick,
  onAction,
}: {
  node: chrome.bookmarks.BookmarkTreeNode;
  folderChildCount?: number;
  selected: boolean;
  selectionMode: boolean;
  searchPath?: string;
  menuOpen: boolean;
  menuDirection: 'up' | 'down';
  menuContent?: React.ReactNode;
  onClick: () => void;
  onAction: (button: HTMLElement) => void;
}) {
  const folder = isFolder(node);

  return (
    <div className="relative" data-item-menu>
      <div
        className={cn(
          'flex items-center gap-2 rounded-2xl border bg-white/88 px-2.5 shadow-sm',
          folder ? 'min-h-11 py-2' : 'min-h-14 py-2.5',
          selected && 'border-primary bg-primary/8',
        )}
      >
        <div
          className={cn(
            'flex shrink-0 items-center justify-center rounded-xl',
            folder ? 'size-8' : 'size-9',
            folder ? 'bg-primary/12 text-primary' : 'bg-secondary text-secondary-foreground',
          )}
        >
          {selectionMode && selected ? (
            <Check className="size-4" />
          ) : folder ? (
            <Folder className="size-4" />
          ) : (
            <img
              src={node.url ? getFaviconUrl(node.url) : undefined}
              alt=""
              className="size-4 rounded"
              onError={(event) => {
                (event.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
        </div>

        <button
          type="button"
          onClick={onClick}
          className="block min-w-0 max-w-full flex-1 overflow-hidden text-left text-foreground"
        >
          {folder ? (
            <div className="flex w-full items-center gap-2">
              <div className="min-w-0 flex-1 truncate text-sm font-semibold">{getDisplayTitle(node)}</div>
              <div className="shrink-0 text-[11px] text-muted-foreground">{getBookmarkMeta(node, folderChildCount)}</div>
            </div>
          ) : (
            <div className="w-full min-w-0 max-w-full">
              <div className="block truncate text-sm font-semibold">{getDisplayTitle(node)}</div>
              <div className="block truncate text-[12px] text-muted-foreground">
                {searchPath ?? getBookmarkMeta(node, folderChildCount)}
              </div>
            </div>
          )}
        </button>

        {!selectionMode ? (
          <button
            type="button"
            data-item-menu-button
            onClick={(event) => {
              event.stopPropagation();
              onAction(event.currentTarget as HTMLElement);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onAction(event.currentTarget as HTMLElement);
              }
            }}
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition active:scale-[0.96]',
              menuOpen && 'bg-primary/12 text-primary',
            )}
          >
            <MoreHorizontal className="size-4" />
          </button>
        ) : null}
      </div>

      {menuOpen ? (
        <div
          className={cn(
            'absolute right-2 z-[70] w-36 rounded-2xl border bg-white/96 p-1 shadow-xl',
            menuDirection === 'up' ? 'bottom-11' : 'top-11',
          )}
        >
          {menuContent}
        </div>
      ) : null}
    </div>
  );
}

export default function App() {
  const reloadRequestRef = useRef(0);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const scrollPositionsRef = useRef<Record<string, number>>({});
  const toolsMenuRef = useRef<HTMLDivElement | null>(null);
  const toolsButtonRef = useRef<HTMLButtonElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [actionMenuDirection, setActionMenuDirection] = useState<'up' | 'down'>('down');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [roots, setRoots] = useState<chrome.bookmarks.BookmarkTreeNode[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState(HOME_FOLDER_ID);
  const [currentFolder, setCurrentFolder] = useState<chrome.bookmarks.BookmarkTreeNode | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<chrome.bookmarks.BookmarkTreeNode[]>([]);
  const [currentChildren, setCurrentChildren] = useState<chrome.bookmarks.BookmarkTreeNode[]>([]);
  const [folderTree, setFolderTree] = useState<FolderTreeNode[]>([]);
  const [folderChildCounts, setFolderChildCounts] = useState<Record<string, number>>({});
  const [launchContext, setLaunchContextState] = useState<LaunchContext | null>(null);
  const [launchBookmark, setLaunchBookmark] = useState<chrome.bookmarks.BookmarkTreeNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const deferredSearch = useDeferredValue(searchQuery.trim());
  const [searchResults, setSearchResults] = useState<chrome.bookmarks.BookmarkTreeNode[]>([]);
  const [searchPaths, setSearchPaths] = useState<Record<string, string>>({});
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionTarget, setActionTarget] = useState<chrome.bookmarks.BookmarkTreeNode | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [expandedMoveFolderIds, setExpandedMoveFolderIds] = useState<string[]>([]);
  const [folderComposer, setFolderComposer] = useState<FolderComposerState>({
    open: false,
    mode: 'create',
    parentId: '1',
    title: '',
  });
  const [bookmarkComposer, setBookmarkComposer] = useState<BookmarkComposerState>({
    open: false,
    mode: 'create',
    parentId: '1',
    originalParentId: '1',
    title: '',
    url: '',
  });
  const [moveState, setMoveState] = useState<MoveState>({
    open: false,
    mode: 'move',
    ids: [],
    query: '',
    targetFolderId: '1',
  });

  const currentFolderIdRef = useRef(currentFolderId);
  const scrollPersistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    currentFolderIdRef.current = currentFolderId;
  }, [currentFolderId]);

  const getScrollViewport = () =>
    scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement | null;

  const persistScrollPositions = useCallback(() => {
    if (scrollPersistTimerRef.current) {
      clearTimeout(scrollPersistTimerRef.current);
    }

    scrollPersistTimerRef.current = setTimeout(() => {
      void safeCall(() => setSavedScrollPositions({ ...scrollPositionsRef.current }), undefined);
    }, 120);
  }, []);

  const rememberViewportScroll = useCallback(() => {
    const viewport = getScrollViewport();
    if (!viewport) return;
    scrollPositionsRef.current[currentFolderIdRef.current] = viewport.scrollTop;
    persistScrollPositions();
  }, [persistScrollPositions]);

  const resetSelection = () => {
    setSelectionMode(false);
    setSelectedIds([]);
  };

  const reload = useCallback(async (preferredFolderId?: string) => {
    const requestId = ++reloadRequestRef.current;
    const shouldShowLoading = reloadRequestRef.current === 1;
    if (shouldShowLoading) {
      setLoading(true);
    }
    setErrorMessage('');

    try {
      const treeRoots = await safeCallWithTimeout(() => getTreeRoots(), []);
      const rememberedId = await safeCallWithTimeout(() => getInitialLocationId(HOME_FOLDER_ID), '1');
      const requestedId =
        preferredFolderId ?? (currentFolderIdRef.current === HOME_FOLDER_ID ? rememberedId : currentFolderIdRef.current) ?? rememberedId;
      const nextFolderChildCounts = collectFolderChildCounts(treeRoots);

      if (requestedId === HOME_FOLDER_ID) {
        const context = await safeCallWithTimeout(() => getLaunchContext(), null);

        if (requestId !== reloadRequestRef.current) return;

        setRoots(treeRoots);
        setCurrentFolderId(HOME_FOLDER_ID);
        setCurrentFolder(null);
        setBreadcrumbs([]);
        setCurrentChildren(sortFoldersFirst(treeRoots));
        setFolderChildCounts(nextFolderChildCounts);
        setLaunchContextState(context);
        void safeCall(() => setLastLocationId(HOME_FOLDER_ID), undefined);
      } else {
        const rootFallbackId = treeRoots[0]?.id ?? '1';
        const validatedId = await safeCallWithTimeout(() => ensureFolderId(requestedId), rootFallbackId);
        const nextFolderId =
          validatedId === '1' && !treeRoots.some((node) => node.id === '1') ? rootFallbackId : validatedId;

        void safeCall(() => rememberFolder(nextFolderId), undefined);

        const [folderNode, folderPathNodes, folderChildren, context] = await Promise.all([
          safeCallWithTimeout(() => getNode(nextFolderId), null),
          safeCallWithTimeout(() => getFolderPathNodes(nextFolderId), []),
          safeCallWithTimeout(() => getFolderChildren(nextFolderId), []),
          safeCallWithTimeout(() => getLaunchContext(), null),
        ]);

        if (requestId !== reloadRequestRef.current) return;

        setRoots(treeRoots);
        setCurrentFolderId(nextFolderId);
        setCurrentFolder(folderNode);
        setBreadcrumbs(folderPathNodes);
        setCurrentChildren(folderChildren);
        setFolderChildCounts(nextFolderChildCounts);
        setLaunchContextState(context);
      }

      const nextScrollKey = requestedId === HOME_FOLDER_ID ? HOME_FOLDER_ID : requestedId;
      window.requestAnimationFrame(() => {
        getScrollViewport()?.scrollTo({ top: scrollPositionsRef.current[nextScrollKey] ?? 0 });
      });

      void safeCallWithTimeout(() => collectFolderTree(), []).then((folders) => {
        if (requestId !== reloadRequestRef.current) return;
        setFolderTree(folders);
      });
    } catch (error) {
      if (requestId !== reloadRequestRef.current) return;
      setErrorMessage(error instanceof Error ? error.message : '书签加载失败');
    } finally {
      if (requestId === reloadRequestRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const goToFolder = async (folderId: string) => {
    rememberViewportScroll();
    resetSelection();
    setSearchQuery('');
    await reload(folderId);
  };

  const openNode = async (node: chrome.bookmarks.BookmarkTreeNode, active = true) => {
    if (!node.url) {
      await goToFolder(node.id);
      return;
    }

    await chrome.tabs.create({ url: node.url, active });
  };

  const goHome = async () => {
    rememberViewportScroll();
    resetSelection();
    setSearchQuery('');
    setSearchOpen(false);
    await safeCall(() => setLastLocationId(HOME_FOLDER_ID), undefined);
    await reload(HOME_FOLDER_ID);
  };

  const saveLaunchTab = async () => {
    if (!launchContext?.url || !launchContext.title) return;
    const targetFolderId = currentFolderId === HOME_FOLDER_ID ? await getInitialFolderId() : currentFolderId;
    const existing = await chrome.bookmarks.search({ url: launchContext.url });
    const existingBookmark = existing.find((node) => !!node.url);

    if (existingBookmark) {
      setLaunchBookmark(existingBookmark);
      openBookmarkComposer('edit', existingBookmark.parentId ?? targetFolderId, existingBookmark);
      return;
    }

    openBookmarkComposer('create', targetFolderId, undefined, {
      title: launchContext.title,
      url: launchContext.url,
    });
  };

  const openFolderComposer = (mode: 'create' | 'edit', parentId: string, node?: chrome.bookmarks.BookmarkTreeNode) => {
    setActionTarget(null);
    setFolderComposer({
      open: true,
      mode,
      parentId,
      targetId: node?.id,
      title: node ? getDisplayTitle(node) : '',
    });
  };

  const openBookmarkComposer = (
    mode: 'create' | 'edit',
    parentId: string,
    node?: chrome.bookmarks.BookmarkTreeNode,
    preset?: { title: string; url: string },
  ) => {
    setActionTarget(null);
    setBookmarkComposer({
      open: true,
      mode,
      parentId,
      originalParentId: node?.parentId ?? parentId,
      targetId: node?.id,
      title: preset?.title ?? node?.title ?? '',
      url: preset?.url ?? node?.url ?? '',
    });
  };

  const submitFolder = async () => {
    const title = folderComposer.title.trim();
    if (!title) {
      toast('请输入文件夹名称');
      return;
    }

    if (folderComposer.mode === 'create') {
      await createFolder(folderComposer.parentId, title);
      toast('文件夹已创建');
    } else if (folderComposer.targetId) {
      await updateBookmarkNode(folderComposer.targetId, { title });
      toast('文件夹已更新');
    }

    setFolderComposer((state) => ({ ...state, open: false, title: '' }));
    await reload(currentFolderId);
  };

  const submitBookmark = async () => {
    const title = bookmarkComposer.title.trim();
    const url = normalizeUrl(bookmarkComposer.url);

    if (!title || !url) {
      toast('标题和链接都需要填写');
      return;
    }

    let savedNode: chrome.bookmarks.BookmarkTreeNode | null = null;
    if (bookmarkComposer.mode === 'create') {
      savedNode = await createBookmark(bookmarkComposer.parentId, title, url);
      toast('书签已创建');
    } else if (bookmarkComposer.targetId) {
      if (bookmarkComposer.parentId !== bookmarkComposer.originalParentId) {
        await moveNodes([bookmarkComposer.targetId], bookmarkComposer.parentId);
      }
      savedNode = await updateBookmarkNode(bookmarkComposer.targetId, { title, url });
      toast('书签已更新');
    }

    if (launchContext?.url === url && savedNode) {
      setLaunchBookmark({
        ...savedNode,
        parentId: bookmarkComposer.parentId,
      });
    }

    setBookmarkComposer((state) => ({ ...state, open: false, title: '', url: '', originalParentId: state.parentId }));
    await reload(currentFolderId);
  };

  const askDelete = async (ids: string[]) => {
    const deletableIds = ids.filter((id) => !isProtectedNode(id));
    if (deletableIds.length === 0) {
      toast('这些项目不能删除');
      return;
    }

    setActionTarget(null);
    const snapshots = await captureDeletedNodes(deletableIds);
    const deletedLabel =
      snapshots.length === 1 ? getDisplayTitle(snapshots[0].node) : `已删除 ${snapshots.length} 个项目`;
    await deleteNodes(deletableIds);
    if (launchBookmark && deletableIds.includes(launchBookmark.id)) {
      setLaunchBookmark(null);
    }

    toast('已删除', {
      description: <span className="block max-w-[14rem] truncate">{deletedLabel}</span>,
      action: {
        label: '撤销',
        onClick: () => {
          void restoreDeletedNodes(snapshots).then(async () => {
            if (launchContext?.url) {
              const restored = await chrome.bookmarks.search({ url: launchContext.url });
              setLaunchBookmark(restored.find((node) => !!node.url) ?? null);
            }
            await reload(currentFolderIdRef.current);
          });
        },
      },
    });

    resetSelection();
    await reload(currentFolderId);
  };

  const openMoveDialog = (ids: string[]) => {
    setActionTarget(null);
    setExpandedMoveFolderIds((prev) => Array.from(new Set([...prev, ...breadcrumbs.map((node) => node.id), ...folderTree.map((node) => node.id)])));
    setMoveState({
      open: true,
      mode: 'move',
      ids,
      query: '',
      targetFolderId: currentFolderId,
    });
  };

  const submitMove = async () => {
    if (moveState.mode === 'pick-bookmark-parent') {
      setBookmarkComposer((state) => ({
        ...state,
        open: true,
        parentId: moveState.targetFolderId,
      }));
      setMoveState({ open: false, mode: 'move', ids: [], query: '', targetFolderId: currentFolderId });
      return;
    }

    if (moveState.ids.length === 0) return;
    await moveNodes(moveState.ids, moveState.targetFolderId);
    toast('已移动');
    resetSelection();
    setMoveState({ open: false, mode: 'move', ids: [], query: '', targetFolderId: currentFolderId });
    await reload(moveState.targetFolderId);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const visibleNodes = deferredSearch ? searchResults : currentChildren;
  const isHomeView = currentFolderId === HOME_FOLDER_ID && !deferredSearch;
  const canCreateInCurrentFolder = currentFolderId !== HOME_FOLDER_ID && !deferredSearch;
  const toolsDisabledOnHome = currentFolderId === HOME_FOLDER_ID;
  const pageTitle = deferredSearch
    ? `搜索：${deferredSearch}`
    : currentFolderId === HOME_FOLDER_ID
      ? '首页'
      : currentFolder
        ? getDisplayTitle(currentFolder)
        : '书签';

  const filteredFolderTree = useMemo(() => filterFolderTree(folderTree, moveState.query), [folderTree, moveState.query]);
  const bookmarkComposerPath = useMemo(
    () => findFolderPath(folderTree, bookmarkComposer.parentId) || (bookmarkComposer.parentId === HOME_FOLDER_ID ? '首页' : ''),
    [bookmarkComposer.parentId, folderTree],
  );

  const toggleMoveFolderExpanded = (folderId: string) => {
    setExpandedMoveFolderIds((prev) =>
      prev.includes(folderId) ? prev.filter((id) => id !== folderId) : [...prev, folderId],
    );
  };

  const renderMoveTree = (nodes: FolderTreeNode[]) =>
    nodes.map((folder) => {
      const expanded = moveState.query.trim() ? true : expandedMoveFolderIds.includes(folder.id);
      const selectable = !moveState.ids.includes(folder.id);

      return (
        <div key={folder.id}>
          <button
            type="button"
            className={cn(
              'flex w-full items-center gap-0.5 rounded-lg px-1 py-0.5 text-left',
              moveState.targetFolderId === folder.id && 'bg-primary/10',
            )}
            disabled={!selectable}
            onClick={() => {
              setMoveState((state) => ({ ...state, targetFolderId: folder.id }));
              if (folder.children.length > 0) {
                toggleMoveFolderExpanded(folder.id);
              }
            }}
            style={{ paddingLeft: `${6 + folder.depth * 12}px` }}
          >
            {folder.children.length > 0 ? (
              <span className="flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground">
                {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
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
              {moveState.targetFolderId === folder.id ? <Check className="size-4 shrink-0 text-primary" /> : null}
            </div>
          </button>

          {expanded && folder.children.length > 0 ? renderMoveTree(folder.children) : null}
        </div>
      );
    });

  const renderItemMenu = (node: chrome.bookmarks.BookmarkTreeNode) => {
    const protectedNode = isProtectedNode(node.id);
    const menuButtonClass = 'flex h-8 w-full items-center gap-1.5 rounded-xl px-2.5 text-left text-xs font-medium';

    if (node.url) {
      return (
        <>
          {deferredSearch && node.parentId ? (
            <button
              type="button"
              onClick={() => {
                setActionTarget(null);
                void goToFolder(node.parentId!);
              }}
              className={menuButtonClass}
            >
              <ChevronRight className="size-4" />
              显示位置
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setActionTarget(null);
              void navigator.clipboard.writeText(node.url!).then(() => toast('链接已复制'));
            }}
            className={menuButtonClass}
          >
            <Copy className="size-4" />
            复制链接
          </button>
          <button
            type="button"
            onClick={() => {
              setActionTarget(null);
              openBookmarkComposer('edit', node.parentId ?? currentFolderId, node);
            }}
            className={menuButtonClass}
          >
            <Pencil className="size-4" />
            编辑书签
          </button>
          <button
            type="button"
            onClick={() => {
              setActionTarget(null);
              openMoveDialog([node.id]);
            }}
            className={menuButtonClass}
          >
            <MoveRight className="size-4" />
            移动
          </button>
          <button
            type="button"
            onClick={() => void askDelete([node.id])}
            className={`${menuButtonClass} text-destructive`}
          >
            <Trash2 className="size-4" />
            删除
          </button>
        </>
      );
    }

    return (
      <>
        {deferredSearch && node.parentId ? (
          <button
            type="button"
            onClick={() => {
              setActionTarget(null);
              void goToFolder(node.parentId!);
            }}
            className={menuButtonClass}
          >
            <ChevronRight className="size-4" />
            显示位置
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setActionTarget(null);
            openFolderComposer('create', node.id);
          }}
          className={menuButtonClass}
        >
          <FolderPlus className="size-4" />
          新建子文件夹
        </button>
        <button
          type="button"
          onClick={() => {
            setActionTarget(null);
            openBookmarkComposer('create', node.id);
          }}
          className={menuButtonClass}
        >
          <Link2 className="size-4" />
          添加书签
        </button>
        {!protectedNode ? (
          <button
            type="button"
            onClick={() => {
              setActionTarget(null);
              openFolderComposer('edit', node.parentId ?? currentFolderId, node);
            }}
            className={menuButtonClass}
          >
            <Pencil className="size-4" />
            重命名
          </button>
        ) : null}
        {!protectedNode ? (
          <button
            type="button"
            onClick={() => {
              setActionTarget(null);
              openMoveDialog([node.id]);
            }}
            className={menuButtonClass}
          >
            <MoveRight className="size-4" />
            移动
          </button>
        ) : null}
        {!protectedNode ? (
          <button
            type="button"
            onClick={() => void askDelete([node.id])}
            className={`${menuButtonClass} text-destructive`}
          >
            <Trash2 className="size-4" />
            删除
          </button>
        ) : null}
      </>
    );
  };

  useEffect(() => {
    let cancelled = false;

    void safeCallWithTimeout<Record<string, number>>(() => getSavedScrollPositions(), {}).then((positions) => {
      if (cancelled) return;
      scrollPositionsRef.current = positions;
      void reload();
    });

    return () => {
      cancelled = true;
    };
  }, [reload]);

  useEffect(() => {
    const viewport = getScrollViewport();
    if (!viewport) return;

    const handleScroll = () => {
      scrollPositionsRef.current[currentFolderIdRef.current] = viewport.scrollTop;
      persistScrollPositions();
    };

    viewport.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      viewport.removeEventListener('scroll', handleScroll);
    };
  }, [currentFolderId, persistScrollPositions]);

  useEffect(() => {
    return () => {
      if (scrollPersistTimerRef.current) {
        clearTimeout(scrollPersistTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!toolsOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (toolsMenuRef.current?.contains(target) || toolsButtonRef.current?.contains(target)) {
        return;
      }
      setToolsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [toolsOpen]);

  useEffect(() => {
    if (!actionTarget) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-item-menu]')) return;
      setActionTarget(null);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [actionTarget]);

  useEffect(() => {
    if (!moveState.open || folderTree.length === 0) return;
    setExpandedMoveFolderIds((prev) => Array.from(new Set([...prev, ...folderTree.map((node) => node.id)])));
  }, [folderTree, moveState.open]);

  useEffect(() => {
    let cancelled = false;

    if (!launchContext?.url) {
      setLaunchBookmark(null);
      return;
    }

    void chrome.bookmarks.search({ url: launchContext.url }).then((results) => {
      if (cancelled) return;
      setLaunchBookmark(results.find((node) => !!node.url) ?? null);
    });

    return () => {
      cancelled = true;
    };
  }, [launchContext]);

  useEffect(() => {
    const handleChange = () => {
      void reload();
    };

    chrome.bookmarks.onCreated.addListener(handleChange);
    chrome.bookmarks.onChanged.addListener(handleChange);
    chrome.bookmarks.onRemoved.addListener(handleChange);
    chrome.bookmarks.onMoved.addListener(handleChange);

    return () => {
      chrome.bookmarks.onCreated.removeListener(handleChange);
      chrome.bookmarks.onChanged.removeListener(handleChange);
      chrome.bookmarks.onRemoved.removeListener(handleChange);
      chrome.bookmarks.onMoved.removeListener(handleChange);
    };
  }, [reload]);

  useEffect(() => {
    const handleMessage = (message: unknown) => {
      if (message && typeof message === 'object' && (message as { type?: string }).type === 'launch-context-updated') {
        setLaunchContextState((message as { payload: LaunchContext }).payload);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!deferredSearch) {
      setSearchResults([]);
      setSearchPaths({});
      setSearching(false);
      return;
    }

    setSearching(true);
    void searchNodes(deferredSearch)
      .then(async (results) => {
        const sorted = sortFoldersFirst(results);
        const pathEntries = await Promise.all(
          sorted.map(async (node) => {
            const pathTarget = node.url ? node.parentId ?? currentFolderId : node.id;
            return [node.id, await safeCall(() => getFolderPath(pathTarget), '')] as const;
          }),
        );

        if (cancelled) return;

        startTransition(() => {
          setSearchResults(sorted);
          setSearchPaths(Object.fromEntries(pathEntries));
          setSearching(false);
        });
      })
      .catch(() => {
        if (cancelled) return;
        setSearchResults([]);
        setSearchPaths({});
        setSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentFolderId, deferredSearch]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[linear-gradient(180deg,#fbf4e8_0%,#f2e7d6_100%)] text-foreground">
      <header className="relative z-30 shrink-0 overflow-visible border-b border-border/70 bg-background/92 backdrop-blur">
        <div className="px-3 py-2">
          <div className="flex items-center gap-2">
            {searchOpen || deferredSearch ? (
              <div className="flex min-w-0 flex-1 items-center gap-1 rounded-full border border-border bg-white/92 px-2">
                <Search className="size-4 shrink-0 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    resetSelection();
                  }}
                  placeholder="搜索书签"
                  className="h-7 min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-sm leading-none outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchOpen(false);
                  }}
                  className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <div className="min-w-0 flex-1 truncate text-sm font-semibold">{pageTitle}</div>
            )}

            {!searchOpen && !deferredSearch ? (
              <Button
                variant="outline"
                size="icon"
                className="size-8 rounded-full"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="size-4" />
              </Button>
            ) : null}

            <Button
              variant="outline"
              size="icon"
              className="size-8 rounded-full"
              onClick={() => void reload(currentFolderId)}
            >
              <RefreshCw className="size-4" />
            </Button>

            <Button
              ref={toolsButtonRef}
              variant="outline"
              size="icon"
              className="size-8 rounded-full"
              onClick={() => setToolsOpen((open) => !open)}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </div>

          {selectionMode ? (
            <div className="mt-2 flex items-center gap-2 rounded-2xl border bg-white/88 px-3 py-2 shadow-sm">
              <div className="min-w-0 flex-1 text-sm font-semibold">{selectedIds.length} 项已选中</div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-xl"
                disabled={selectedIds.length === 0}
                onClick={() => selectedIds.length > 0 && openMoveDialog(selectedIds)}
              >
                <MoveRight className="size-4" />
                移动
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-8 rounded-xl"
                disabled={selectedIds.length === 0}
                onClick={() => selectedIds.length > 0 && void askDelete(selectedIds)}
              >
                <Trash2 className="size-4" />
                删除
              </Button>
              <Button variant="ghost" size="icon" className="size-8 rounded-xl" onClick={() => resetSelection()}>
                <X className="size-4" />
              </Button>
            </div>
          ) : null}
        </div>

        {toolsOpen ? (
          <div ref={toolsMenuRef} className="absolute right-3 top-[calc(100%-2px)] z-[90] w-40 rounded-2xl border bg-white/96 p-1 shadow-xl">
            {launchContext ? (
              <button
                type="button"
                disabled={toolsDisabledOnHome}
                onClick={() => {
                  setToolsOpen(false);
                  void saveLaunchTab();
                }}
                className="flex h-8 w-full items-center gap-1.5 rounded-xl px-2.5 text-left text-xs font-medium disabled:opacity-50"
              >
                <Bookmark className="size-4" />
                {launchBookmark ? '编辑当前页面' : '保存当前页面'}
              </button>
            ) : null}
            <button
              type="button"
                onClick={() => {
                  setToolsOpen(false);
                  setSelectionMode(true);
                }}
                disabled={toolsDisabledOnHome || visibleNodes.length === 0 || Boolean(deferredSearch)}
                className="flex h-8 w-full items-center gap-1.5 rounded-xl px-2.5 text-left text-xs font-medium disabled:opacity-50"
              >
                <SquareCheckBig className="size-4" />
              选择项目
            </button>
            <button
              type="button"
                onClick={() => {
                  setToolsOpen(false);
                  openFolderComposer('create', currentFolderId);
                }}
                disabled={toolsDisabledOnHome || !canCreateInCurrentFolder}
                className="flex h-8 w-full items-center gap-1.5 rounded-xl px-2.5 text-left text-xs font-medium disabled:opacity-50"
              >
                <FolderPlus className="size-4" />
              新建文件夹
            </button>
            <button
              type="button"
                onClick={() => {
                  setToolsOpen(false);
                  openBookmarkComposer('create', currentFolderId);
                }}
                disabled={toolsDisabledOnHome || !canCreateInCurrentFolder}
                className="flex h-8 w-full items-center gap-1.5 rounded-xl px-2.5 text-left text-xs font-medium disabled:opacity-50"
              >
                <Plus className="size-4" />
              添加书签
            </button>
          </div>
        ) : null}
      </header>

      {!deferredSearch ? (
        <div className="flex h-9 shrink-0 items-center border-b border-border/60 bg-background/82 px-3 backdrop-blur">
          <div className="flex w-full items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => {
                void goHome();
              }}
              className={cn(
                'inline-flex h-6 shrink-0 items-center justify-center rounded-full px-2 text-xs',
                isHomeView ? 'bg-secondary font-semibold text-foreground' : 'bg-muted text-muted-foreground',
              )}
            >
              <House className="size-3.5" />
            </button>
            {breadcrumbs.map((node, index) => (
              <button
                key={node.id}
                type="button"
                onClick={() => {
                  void goToFolder(node.id);
                }}
                className={cn(
                  'inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-xs',
                  index === breadcrumbs.length - 1 ? 'bg-secondary font-semibold' : 'bg-muted text-muted-foreground',
                )}
              >
                {getDisplayTitle(node)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div ref={scrollAreaRef} className="min-h-0 flex-1">
        <ScrollArea className="h-full">
          <div className="space-y-3 px-3 py-3">
            {errorMessage ? (
              <section className="rounded-2xl border border-destructive/35 bg-destructive/8 px-3 py-3 text-sm text-destructive">
                {errorMessage}
              </section>
            ) : null}

            <section className="space-y-2">
              {visibleNodes.length === 0 ? (
                <div className="rounded-2xl border bg-white/86 px-3 py-6 text-center text-sm text-muted-foreground">
                  {deferredSearch ? (searching ? '正在搜索…' : '没有找到匹配的书签。') : loading ? '' : '这个文件夹是空的。'}
                </div>
              ) : (
                visibleNodes.map((node) => (
                  <ItemRow
                    key={node.id}
                    node={node}
                    folderChildCount={folderChildCounts[node.id]}
                    selected={selectedIds.includes(node.id)}
                    selectionMode={selectionMode}
                    searchPath={deferredSearch ? searchPaths[node.id] : undefined}
                    menuOpen={actionTarget?.id === node.id}
                    menuDirection={actionMenuDirection}
                    menuContent={renderItemMenu(node)}
                    onClick={() => {
                      if (selectionMode) {
                        toggleSelect(node.id);
                        return;
                      }
                      void openNode(node);
                    }}
                    onAction={(button) => {
                      const rect = button.getBoundingClientRect();
                      setActionMenuDirection(window.innerHeight - rect.bottom < 220 ? 'up' : 'down');
                      setActionTarget((current) => (current?.id === node.id ? null : node));
                    }}
                  />
                ))
              )}
            </section>
          </div>
        </ScrollArea>
      </div>

      <Dialog open={folderComposer.open} onOpenChange={(open) => setFolderComposer((state) => ({ ...state, open }))}>
        <DialogContent className="rounded-[1.5rem] p-4">
          <DialogHeader>
            <DialogTitle>{folderComposer.mode === 'create' ? '新建文件夹' : '重命名文件夹'}</DialogTitle>
            <DialogDescription>
              {folderComposer.mode === 'create' ? '输入文件夹名称并保存。' : '修改当前文件夹名称并保存。'}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            <Input
              autoFocus
              value={folderComposer.title}
              onChange={(event) => setFolderComposer((state) => ({ ...state, title: event.target.value }))}
              placeholder="文件夹名称"
            />
            <Button className="h-10 w-full rounded-xl" onClick={() => void submitFolder()}>
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={bookmarkComposer.open} onOpenChange={(open) => setBookmarkComposer((state) => ({ ...state, open }))}>
        <DialogContent className="rounded-[1.5rem] p-4">
          <DialogHeader>
            <DialogTitle>{bookmarkComposer.mode === 'create' ? '添加书签' : '编辑书签'}</DialogTitle>
            <DialogDescription>
              {bookmarkComposer.mode === 'create' ? '填写标题和网址后保存。' : '修改书签信息后保存。'}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={() => {
                setBookmarkComposer((state) => ({ ...state, open: false }));
                setMoveState({
                  open: true,
                  mode: 'pick-bookmark-parent',
                  ids: [],
                  query: '',
                  targetFolderId: bookmarkComposer.parentId,
                });
              }}
              className="flex w-full items-center justify-between rounded-xl border bg-muted/35 px-3 py-2 text-left"
            >
              <div className="min-w-0">
                <div className="text-[11px] text-muted-foreground">保存位置</div>
                <div className="truncate text-sm font-medium">{bookmarkComposerPath || '选择文件夹'}</div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
            <Input
              autoFocus
              value={bookmarkComposer.title}
              onChange={(event) => setBookmarkComposer((state) => ({ ...state, title: event.target.value }))}
              placeholder="标题"
            />
            <Input
              value={bookmarkComposer.url}
              onChange={(event) => setBookmarkComposer((state) => ({ ...state, url: event.target.value }))}
              placeholder="example.com"
            />
            {bookmarkComposer.mode === 'edit' && bookmarkComposer.targetId ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBookmarkComposer((state) => ({ ...state, open: false }));
                    void goToFolder(bookmarkComposer.parentId);
                  }}
                  className="flex h-10 items-center justify-center gap-1.5 rounded-xl border bg-muted/35 px-3 text-sm font-medium active:bg-muted"
                >
                  <ChevronRight className="size-4" />
                  显示所在位置
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBookmarkComposer((state) => ({ ...state, open: false }));
                    void askDelete([bookmarkComposer.targetId!]);
                  }}
                  className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-destructive/25 bg-destructive/8 px-3 text-sm font-medium text-destructive active:bg-destructive/12"
                >
                  <Trash2 className="size-4" />
                  删除
                </button>
              </div>
            ) : null}
            <Button className="h-10 w-full rounded-xl" onClick={() => void submitBookmark()}>
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {moveState.open ? (
        <div className="fixed inset-0 z-[90] flex flex-col bg-background/98 backdrop-blur">
          <div className="flex items-center gap-2 border-b border-border/70 px-3 py-2">
            <Button
              variant="outline"
              size="icon"
              className="size-8 rounded-full"
              onClick={() => {
                if (moveState.mode === 'pick-bookmark-parent') {
                  setBookmarkComposer((state) => ({ ...state, open: true }));
                }
                setMoveState((state) => ({ ...state, open: false, mode: 'move', query: '' }));
              }}
            >
              <X className="size-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">移动到文件夹</div>
            </div>
            <Button className="h-8 rounded-full px-3 text-sm" onClick={() => void submitMove()}>
              {moveState.mode === 'pick-bookmark-parent' ? '选择' : '确认'}
            </Button>
          </div>

          <div className="px-3 py-2">
            <div className="flex items-center gap-1 rounded-full border border-border bg-white/92 px-2">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <Input
                value={moveState.query}
                onChange={(event) => setMoveState((state) => ({ ...state, query: event.target.value }))}
                placeholder="搜索目标文件夹"
                className="h-8 min-w-0 rounded-none border-0 bg-transparent px-0 py-0 text-sm shadow-none focus:border-0 focus:ring-0"
              />
            </div>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-1 px-2 pb-4">
              {filteredFolderTree.length > 0 ? (
                renderMoveTree(filteredFolderTree)
              ) : (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">没有找到匹配的文件夹。</div>
              )}
            </div>
          </ScrollArea>
        </div>
      ) : null}

      <Toaster />
    </div>
  );
}

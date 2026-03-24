import { useCallback, useMemo, type Dispatch, type MutableRefObject, type RefObject, type SetStateAction } from 'react';

import {
  collectFolderTree,
  ensureFolderId,
  getDisplayTitle,
  getFolderChildren,
  getFolderPathNodes,
  getInitialFolderId,
  getLaunchContext,
  getNode,
  getTreeRoots,
  setDisplayMode,
  type BookmarkDisplayMode,
  type FolderTreeNode,
  type LaunchContext,
} from '@/lib/bookmark-service';

import { collectFolderChildCounts, HOME_FOLDER_ID, openUrlWithBlankTarget, safeCall, safeCallWithTimeout, TREE_SCROLL_KEY } from '../utils';

type UseNavigationParams = {
  displayMode: BookmarkDisplayMode;
  setDisplayModeState: Dispatch<SetStateAction<BookmarkDisplayMode>>;
  currentFolderId: string;
  setCurrentFolderId: Dispatch<SetStateAction<string>>;
  currentFolderIdRef: MutableRefObject<string>;
  currentFolder: chrome.bookmarks.BookmarkTreeNode | null;
  setCurrentFolder: Dispatch<SetStateAction<chrome.bookmarks.BookmarkTreeNode | null>>;
  setBreadcrumbs: Dispatch<SetStateAction<chrome.bookmarks.BookmarkTreeNode[]>>;
  setRoots: Dispatch<SetStateAction<chrome.bookmarks.BookmarkTreeNode[]>>;
  setCurrentChildren: Dispatch<SetStateAction<chrome.bookmarks.BookmarkTreeNode[]>>;
  setFolderTree: Dispatch<SetStateAction<FolderTreeNode[]>>;
  setFolderChildCounts: Dispatch<SetStateAction<Record<string, number>>>;
  setLaunchContextState: Dispatch<SetStateAction<LaunchContext | null>>;
  deferredSearch: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  setSearchOpen: Dispatch<SetStateAction<boolean>>;
  setToolsOpen: Dispatch<SetStateAction<boolean>>;
  setActionTarget: Dispatch<SetStateAction<chrome.bookmarks.BookmarkTreeNode | null>>;
  setExpandedTreeIds: Dispatch<SetStateAction<string[]>>;
  persistExpandedTreeIds: (ids: string[]) => void;
  reloadRequestRef: MutableRefObject<number>;
  scrollAreaRef: RefObject<HTMLDivElement | null>;
  scrollPositionsRef: MutableRefObject<Record<string, number>>;
  persistScrollPositions: () => void;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setErrorMessage: Dispatch<SetStateAction<string>>;
  resetSelection: () => void;
};

type GoToFolderOptions = {
  clearSearchTiming?: 'before' | 'after' | 'never';
  closeSearch?: boolean;
};

export function useNavigation({
  displayMode,
  setDisplayModeState,
  currentFolderId,
  setCurrentFolderId,
  currentFolderIdRef,
  currentFolder,
  setCurrentFolder,
  setBreadcrumbs,
  setRoots,
  setCurrentChildren,
  setFolderTree,
  setFolderChildCounts,
  setLaunchContextState,
  deferredSearch,
  setSearchQuery,
  setSearchOpen,
  setToolsOpen,
  setActionTarget,
  setExpandedTreeIds,
  persistExpandedTreeIds,
  reloadRequestRef,
  scrollAreaRef,
  scrollPositionsRef,
  persistScrollPositions,
  setLoading,
  setErrorMessage,
  resetSelection,
}: UseNavigationParams) {
  const pruneListScrollPositions = useCallback((folderIds: string[]) => {
    const keep = new Set(folderIds);
    const nextPositions = Object.fromEntries(
      Object.entries(scrollPositionsRef.current).filter(([key]) => key === TREE_SCROLL_KEY || keep.has(key)),
    );
    scrollPositionsRef.current = nextPositions;
    persistScrollPositions();
  }, [persistScrollPositions, scrollPositionsRef]);

  const getScrollViewport = useCallback(
    () => scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement | null,
    [scrollAreaRef],
  );

  const getScrollKey = useCallback(
    (mode = displayMode, folderId = currentFolderIdRef.current) => (mode === 'tree' ? TREE_SCROLL_KEY : folderId),
    [currentFolderIdRef, displayMode],
  );

  const rememberViewportScroll = useCallback(() => {
    const viewport = getScrollViewport();
    if (!viewport) return;
    scrollPositionsRef.current[getScrollKey()] = viewport.scrollTop;
    persistScrollPositions();
  }, [getScrollKey, getScrollViewport, persistScrollPositions, scrollPositionsRef]);

  const reload = useCallback(async (preferredFolderId?: string) => {
    const requestId = ++reloadRequestRef.current;
    const shouldShowLoading = reloadRequestRef.current === 1;
    if (shouldShowLoading) {
      setLoading(true);
    }
    setErrorMessage('');

    try {
      const treeRoots = await safeCallWithTimeout(() => getTreeRoots(), []);
      const rememberedId = await safeCallWithTimeout(() => getInitialFolderId(), '1');
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
        setCurrentChildren(treeRoots);
        setFolderChildCounts(nextFolderChildCounts);
        setLaunchContextState(context);
        pruneListScrollPositions([HOME_FOLDER_ID]);
      } else {
        const rootFallbackId = treeRoots[0]?.id ?? '1';
        const validatedId = await safeCallWithTimeout(() => ensureFolderId(requestedId), rootFallbackId);
        const nextFolderId =
          validatedId === '1' && !treeRoots.some((node) => node.id === '1') ? rootFallbackId : validatedId;

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
        pruneListScrollPositions(folderPathNodes.map((node) => node.id));
      }

      const nextScrollKey = displayMode === 'tree' ? TREE_SCROLL_KEY : requestedId === HOME_FOLDER_ID ? HOME_FOLDER_ID : requestedId;
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
  }, [
    currentFolderIdRef,
    displayMode,
    getScrollViewport,
    reloadRequestRef,
    scrollPositionsRef,
    setBreadcrumbs,
    setCurrentChildren,
    setCurrentFolder,
    setCurrentFolderId,
    setErrorMessage,
    setFolderChildCounts,
    setFolderTree,
    setLaunchContextState,
    setLoading,
    setRoots,
    pruneListScrollPositions,
  ]);

  const goToFolder = useCallback(async (folderId: string, options: GoToFolderOptions = {}) => {
    const clearSearchTiming = options.clearSearchTiming ?? 'before';
    const closeSearch = options.closeSearch ?? clearSearchTiming !== 'never';

    rememberViewportScroll();
    resetSelection();
    if (clearSearchTiming === 'before') {
      setSearchQuery('');
    }
    if (closeSearch) {
      setSearchOpen(false);
    }
    await reload(folderId);
    if (clearSearchTiming === 'after') {
      setSearchQuery('');
    }
  }, [rememberViewportScroll, reload, resetSelection, setSearchOpen, setSearchQuery]);

  const openNode = useCallback(async (node: chrome.bookmarks.BookmarkTreeNode, _active = true) => {
    if (!node.url) {
      await goToFolder(node.id);
      return;
    }
    openUrlWithBlankTarget(node.url);
  }, [goToFolder]);

  const goHome = useCallback(async () => {
    rememberViewportScroll();
    resetSelection();
    setSearchQuery('');
    setSearchOpen(false);
    await reload(HOME_FOLDER_ID);
  }, [rememberViewportScroll, reload, resetSelection, setSearchOpen, setSearchQuery]);

  const toggleTreeExpanded = useCallback((folderId: string) => {
    setExpandedTreeIds((prev) => {
      const next = prev.includes(folderId) ? prev.filter((id) => id !== folderId) : [...prev, folderId];
      persistExpandedTreeIds(next);
      return next;
    });
  }, [persistExpandedTreeIds, setExpandedTreeIds]);

  const switchDisplayMode = useCallback((mode: BookmarkDisplayMode) => {
    if (mode === displayMode) {
      setToolsOpen(false);
      return;
    }
    rememberViewportScroll();
    resetSelection();
    setActionTarget(null);
    setSearchOpen(false);
    setDisplayModeState(mode);
    setToolsOpen(false);
    void safeCall(() => setDisplayMode(mode), undefined);
  }, [displayMode, rememberViewportScroll, resetSelection, setActionTarget, setDisplayModeState, setSearchOpen, setToolsOpen]);

  const isHomeView = currentFolderId === HOME_FOLDER_ID && !deferredSearch;
  const canCreateInCurrentFolder = currentFolderId !== HOME_FOLDER_ID && !deferredSearch && displayMode === 'list';
  const toolsDisabledOnHome = currentFolderId === HOME_FOLDER_ID && displayMode === 'list';
  const pageTitle = useMemo(
    () =>
      deferredSearch
        ? `搜索：${deferredSearch}`
        : displayMode === 'tree'
          ? '树形书签'
          : currentFolderId === HOME_FOLDER_ID
            ? '首页'
            : currentFolder
              ? getDisplayTitle(currentFolder)
              : '书签',
    [currentFolder, currentFolderId, deferredSearch, displayMode],
  );

  return {
    getScrollViewport,
    getScrollKey,
    persistScrollPositions,
    rememberViewportScroll,
    reload,
    goToFolder,
    openNode,
    goHome,
    toggleTreeExpanded,
    switchDisplayMode,
    isHomeView,
    canCreateInCurrentFolder,
    toolsDisabledOnHome,
    pageTitle,
  };
}

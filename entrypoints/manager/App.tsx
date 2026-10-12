import { startTransition, useCallback, useEffect, useMemo, useRef } from 'react';
import { toast } from '@/lib/toast';

import { Toaster } from '@/components/ui/toast';
import {
  DEFAULT_VIEW_SETTINGS,
  captureDeletedNodes,
  deleteNodes,
  getDisplayMode,
  getDisplayTitle,
  getFolderPath,
  getFolderPathNodes,
  getInsertSettings,
  getRecentFolders,
  getTreeExpandedIds,
  getViewSettings,
  isProtectedNode,
  normalizeAllFolders,
  reorderNodeWithinFolder,
  restoreDeletedNodes,
  searchNodes,
  setInsertSettings,
  setViewSettings,
  sortFoldersFirst,
  type BookmarkDisplayMode,
  type InsertSettings,
  type LaunchContext,
  type ViewSettings,
} from '@/lib/bookmark-service';
import { BookmarkEditorDialogs } from './components/BookmarkEditorDialogs';
import { ItemMenuContent } from './components/ItemMenuContent';
import { ManagerContent } from './components/ManagerContent';
import { ManagerToolbar } from './components/ManagerToolbar';
import { MovePanel } from './components/MovePanel';
import { SettingsDialog } from './components/SettingsDialog';
import { useBookmarkEditor } from './hooks/useBookmarkEditor';
import { useManagerPageState } from './hooks/useManagerPageState';
import { useMove } from './hooks/useMove';
import { useNavigation } from './hooks/useNavigation';
import { flattenTreeNodes, HOME_FOLDER_ID, safeCall, safeCallWithTimeout } from './utils';

type ManagerHistoryState = {
  managerBase?: boolean;
  managerListSentinel?: boolean;
  managerListHistory?: boolean;
  folderId?: string;
  trail?: string[];
  managerUiSentinel?: boolean;
  uiTrail?: ManagerBackLayer[];
};

type ManagerBackLayer =
  | 'search'
  | 'selection'
  | 'move'
  | 'settings'
  | 'details'
  | 'bookmark-composer'
  | 'folder-composer'
  | 'bookmark-recent';

export default function App() {
  const state = useManagerPageState();
  const listHistoryTrailRef = useRef<string[] | null>(null);
  const ignoreSyntheticListPopRef = useRef(false);
  const pendingListTrailRef = useRef<string[] | null>(null);
  const pendingListHistoryPushRef = useRef<string | null>(null);
  const uiHistoryTrailRef = useRef<ManagerBackLayer[] | null>(null);
  const searchResultsQueryRef = useRef('');
  const ignoreSyntheticUiPopRef = useRef(false);
  const pendingUiTrailRef = useRef<ManagerBackLayer[] | null>(null);

  const resetSelection = useCallback(() => {
    state.setSelectionMode(false);
    state.setSelectedIds([]);
  }, [state.setSelectedIds, state.setSelectionMode]);

  const toggleSelect = useCallback((id: string) => {
    state.setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }, [state.setSelectedIds]);

  const navigation = useNavigation({
    displayMode: state.displayMode,
    setDisplayModeState: state.setDisplayModeState,
    currentFolderId: state.currentFolderId,
    setCurrentFolderId: state.setCurrentFolderId,
    currentFolderIdRef: state.currentFolderIdRef,
    currentFolder: state.currentFolder,
    setCurrentFolder: state.setCurrentFolder,
    setBreadcrumbs: state.setBreadcrumbs,
    setRoots: state.setRoots,
    setCurrentChildren: state.setCurrentChildren,
    setFolderTree: state.setFolderTree,
    setFolderChildCounts: state.setFolderChildCounts,
    setLaunchContextState: state.setLaunchContextState,
    deferredSearch: state.deferredSearch,
    setSearchQuery: state.setSearchQuery,
    setSearchOpen: state.setSearchOpen,
    setToolsOpen: state.setToolsOpen,
    setActionTarget: state.setActionTarget,
    setExpandedTreeIds: state.setExpandedTreeIds,
    persistExpandedTreeIds: state.persistExpandedTreeIds,
    reloadRequestRef: state.reloadRequestRef,
    scrollAreaRef: state.scrollAreaRef,
    scrollPositionsRef: state.scrollPositionsRef,
    setLoading: state.setLoading,
    setErrorMessage: state.setErrorMessage,
    resetSelection,
  });

  const editor = useBookmarkEditor({
    currentFolderId: state.currentFolderId,
    folderTree: state.folderTree,
    folderChildCounts: state.folderChildCounts,
    insertSettingsState: state.insertSettingsState,
    launchContext: state.launchContext,
    setActionTarget: state.setActionTarget,
    setDetailState: state.setDetailState,
    folderComposer: state.folderComposer,
    setFolderComposer: state.setFolderComposer,
    bookmarkComposer: state.bookmarkComposer,
    setBookmarkComposer: state.setBookmarkComposer,
    setLaunchBookmark: state.setLaunchBookmark,
    setRecentFolders: state.setRecentFolders,
    onNodeSaved: (savedNode) => {
      state.setSearchResults((nodes) => nodes.map((node) => node.id === savedNode.id ? { ...node, ...savedNode } : node));
    },
    onFolderSaved: ({ mode, source, node, parentId }) => {
      if (source !== 'move-panel') return;

      state.setMoveActionTarget(null);
      state.setExpandedMoveFolderIds((prev) => Array.from(new Set([...prev, parentId])));
      if (mode === 'create') {
        state.setMoveState((current) => ({ ...current, targetFolderId: node.id }));
      }
    },
    reload: navigation.reload,
  });

  const move = useMove({
    breadcrumbs: state.breadcrumbs,
    currentFolderId: state.currentFolderId,
    folderTree: state.folderTree,
    expandedMoveFolderIds: state.expandedMoveFolderIds,
    setExpandedMoveFolderIds: state.setExpandedMoveFolderIds,
    setActionTarget: state.setActionTarget,
    moveState: state.moveState,
    setMoveState: state.setMoveState,
    insertSettingsState: state.insertSettingsState,
    setBookmarkComposer: state.setBookmarkComposer,
    setMoveActionTarget: state.setMoveActionTarget,
    resetSelection,
    reload: navigation.reload,
  });

  const closeMovePanel = useCallback(() => {
    if (state.moveState.mode === 'pick-bookmark-parent') {
      state.setBookmarkComposer((current) => ({ ...current, open: true }));
    }
    state.setMoveState((current) => ({ ...current, open: false, mode: 'move', query: '' }));
  }, [state.moveState.mode, state.setBookmarkComposer, state.setMoveState]);

  const backLayerTrail = useMemo<ManagerBackLayer[]>(() => {
    const trail: ManagerBackLayer[] = [];
    if (state.searchOpen) trail.push('search');
    if (state.selectionMode) trail.push('selection');
    if (state.moveState.open) trail.push('move');
    if (state.settingsOpen) trail.push('settings');
    if (state.detailState.open) trail.push('details');
    if (state.bookmarkComposer.open) trail.push('bookmark-composer');
    if (state.folderComposer.open) trail.push('folder-composer');
    if (state.bookmarkComposer.open && state.bookmarkComposer.recentOpen) trail.push('bookmark-recent');
    return trail;
  }, [
    state.bookmarkComposer.open,
    state.bookmarkComposer.recentOpen,
    state.detailState.open,
    state.folderComposer.open,
    state.moveState.open,
    state.searchOpen,
    state.selectionMode,
    state.settingsOpen,
  ]);

  const dismissBackLayers = useCallback((layers: ManagerBackLayer[]) => {
    for (const layer of layers) {
      switch (layer) {
        case 'bookmark-recent':
          state.setBookmarkComposer((current) => ({ ...current, recentOpen: false }));
          break;
        case 'folder-composer':
          state.setFolderComposer((current) => ({ ...current, open: false }));
          break;
        case 'bookmark-composer':
          editor.closeBookmarkComposer();
          break;
        case 'details':
          state.setDetailState((current) => ({ ...current, open: false }));
          break;
        case 'settings':
          state.setSettingsOpen(false);
          break;
        case 'move':
          closeMovePanel();
          break;
        case 'selection':
          resetSelection();
          break;
        case 'search':
          state.setSearchQuery('');
          state.setSearchOpen(false);
          break;
      }
    }
  }, [
    closeMovePanel,
    editor,
    resetSelection,
    state.setBookmarkComposer,
    state.setDetailState,
    state.setFolderComposer,
    state.setSearchOpen,
    state.setSearchQuery,
    state.setSettingsOpen,
  ]);

  const visibleNodes = useMemo(
    () => (state.deferredSearch ? state.searchResults : state.currentChildren),
    [state.currentChildren, state.deferredSearch, state.searchResults],
  );
  const folderPaths = useMemo(() => {
    const paths = new Map<string, string>();
    const visit = (nodes: chrome.bookmarks.BookmarkTreeNode[], parentPath: string) => {
      for (const node of nodes) {
        if (node.url) continue;
        const path = parentPath ? `${parentPath} / ${getDisplayTitle(node)}` : getDisplayTitle(node);
        paths.set(node.id, path);
        visit(node.children ?? [], path);
      }
    };
    visit(state.roots, '');
    return paths;
  }, [state.roots]);
  const selectableNodes = useMemo(
    () =>
      state.displayMode === 'tree' && !state.deferredSearch ? flattenTreeNodes(state.roots) : visibleNodes,
    [state.deferredSearch, state.displayMode, state.roots, visibleNodes],
  );

  const pushListHistoryTrail = useCallback((trail: string[], startIndex = 0) => {
    for (let index = startIndex; index < trail.length; index += 1) {
      const nextTrail = trail.slice(0, index + 1);
      window.history.pushState(
        { managerListSentinel: true, folderId: trail[index], trail: nextTrail } satisfies ManagerHistoryState,
        '',
      );
    }
  }, []);

  const pushUiHistoryTrail = useCallback((trail: ManagerBackLayer[], startIndex = 0) => {
    for (let index = startIndex; index < trail.length; index += 1) {
      const nextTrail = trail.slice(0, index + 1);
      window.history.pushState(
        {
          ...(window.history.state as ManagerHistoryState | null),
          managerUiSentinel: true,
          uiTrail: nextTrail,
        } satisfies ManagerHistoryState,
        '',
      );
    }
  }, []);

  const pushVisitedFolderHistory = useCallback((folderId: string) => {
    window.history.pushState(
      { managerListHistory: true, folderId } satisfies ManagerHistoryState,
      '',
    );
  }, []);

  const navigateToFolder = useCallback((
    folderId: string,
    options?: Parameters<typeof navigation.goToFolder>[1],
  ) => {
    if (
      state.viewSettingsState.listBackBehavior === 'history'
      && state.displayMode === 'list'
      && folderId !== state.currentFolderIdRef.current
    ) {
      if ((uiHistoryTrailRef.current?.length ?? 0) > 0 || ignoreSyntheticUiPopRef.current) {
        pendingListHistoryPushRef.current = folderId;
      } else {
        pushVisitedFolderHistory(folderId);
      }
    }

    return navigation.goToFolder(folderId, options);
  }, [
    navigation,
    pushVisitedFolderHistory,
    state.currentFolderIdRef,
    state.displayMode,
    state.viewSettingsState.listBackBehavior,
  ]);

  const openNodeUrls = useCallback(async (ids: string[]) => {
    const urls = Array.from(new Set((await Promise.all(ids.map(async (id) => {
      const nodes = await chrome.bookmarks.getSubTree(id);
      const collected: string[] = [];
      const visit = (node: chrome.bookmarks.BookmarkTreeNode) => {
        if (node.url) collected.push(node.url);
        node.children?.forEach(visit);
      };
      nodes.forEach(visit);
      return collected;
    }))).flat()));

    if (urls.length === 0) {
      toast('没有可打开的书签');
      return;
    }

    for (const [index, url] of urls.entries()) {
      await chrome.tabs.create({ url, active: index === 0 });
    }
  }, []);

  const askDelete = useCallback(async (ids: string[]) => {
    const deletableIds = ids.filter((id) => !isProtectedNode(id));
    if (deletableIds.length === 0) {
      toast('这些项目不能删除');
      return false;
    }

    state.setActionTarget(null);
    const snapshots = await captureDeletedNodes(deletableIds);
    const deletedLabel =
      snapshots.length === 1 ? getDisplayTitle(snapshots[0].node) : `已删除 ${snapshots.length} 个项目`;
    await deleteNodes(deletableIds);
    state.setSearchResults((nodes) => nodes.filter((node) => !deletableIds.includes(node.id)));
    if (state.launchBookmark && deletableIds.includes(state.launchBookmark.id)) {
      state.setLaunchBookmark(null);
    }

    toast('已删除', {
      description: <span className="block max-w-[14rem] truncate">{deletedLabel}</span>,
      action: {
        label: '撤销',
        onClick: () => {
          void restoreDeletedNodes(snapshots).then(async () => {
            if (state.launchContext?.url) {
              const restored = await chrome.bookmarks.search({ url: state.launchContext.url });
              state.setLaunchBookmark(restored.find((node) => !!node.url) ?? null);
            }
            await navigation.reload(state.currentFolderIdRef.current);
          });
        },
      },
    });

    resetSelection();
    await navigation.reload(state.currentFolderId);
    return true;
  }, [
    navigation,
    resetSelection,
    state.currentFolderId,
    state.currentFolderIdRef,
    state.launchBookmark,
    state.launchContext,
    state.setActionTarget,
    state.setLaunchBookmark,
    state.setSearchResults,
  ]);

  const normalizeAllFoldersAction = useCallback(async () => {
    state.setNormalizing(true);
    try {
      const changed = await normalizeAllFolders();
      toast('规范化完成', {
        description: changed === 0 ? '所有文件夹都已符合“文件夹在上，书签在下”' : `已调整 ${changed} 个文件夹的孩子顺序`,
      });
      await navigation.reload(state.currentFolderIdRef.current);
    } finally {
      state.setNormalizing(false);
    }
  }, [navigation, state.currentFolderIdRef, state.setNormalizing]);

  const applyInsertSettings = useCallback((next: typeof state.insertSettingsState) => {
    state.setInsertSettingsState(next);
    void safeCall(() => setInsertSettings(next), undefined);
  }, [state.setInsertSettingsState]);

  const applyViewSettings = useCallback((next: typeof state.viewSettingsState) => {
    state.setViewSettingsState(next);
    void safeCall(() => setViewSettings(next), undefined);
  }, [state.setViewSettingsState]);

  const revealNodeInTree = useCallback(async (
    node: chrome.bookmarks.BookmarkTreeNode,
    options?: { expandTargetFolder?: boolean; clearSearch?: boolean },
  ) => {
    const expandTargetFolder = options?.expandTargetFolder ?? false;
    const clearSearch = options?.clearSearch ?? true;
    const revealPathTargetId = node.url
      ? node.parentId
      : expandTargetFolder
        ? node.id
        : node.parentId;
    const ancestorPath = await safeCall(
      () => (revealPathTargetId && revealPathTargetId !== '0' ? getFolderPathNodes(revealPathTargetId) : Promise.resolve([])),
      [],
    );
    const ancestorIds = ancestorPath.map((item) => item.id);
    state.setExpandedTreeIds((prev) => {
      const next = Array.from(new Set([...prev, ...ancestorIds]));
      state.persistExpandedTreeIds(next);
      return next;
    });
    if (clearSearch) {
      state.setSearchQuery('');
      state.setSearchOpen(false);
    }
    state.setActionTarget(null);
    state.setHighlightedNodeId(node.id);
  }, [
    state.persistExpandedTreeIds,
    state.setActionTarget,
    state.setExpandedTreeIds,
    state.setHighlightedNodeId,
    state.setSearchOpen,
    state.setSearchQuery,
  ]);

  const collectFolderDescendantIds = useCallback((node: chrome.bookmarks.BookmarkTreeNode): string[] => {
    if (node.url) return [];

    const ids = [node.id];
    for (const child of node.children ?? []) {
      if (!child.url) {
        ids.push(...collectFolderDescendantIds(child));
      }
    }
    return ids;
  }, []);

  const getItemMenuContent = useCallback((node: chrome.bookmarks.BookmarkTreeNode, compact: boolean, closeMenu: (afterClose?: () => void) => void) => (
    <ItemMenuContent
      node={node}
      deferredSearch={Boolean(state.deferredSearch)}
      currentFolderId={state.currentFolderId}
      displayMode={state.displayMode}
      compact={compact}
      hasLaunchContext={Boolean(state.launchContext)}
      hasLaunchBookmark={Boolean(state.launchBookmark)}
      onClose={closeMenu}
      onShowLocation={(targetNode) => {
        if (state.displayMode === 'tree') {
          closeMenu();
          void revealNodeInTree(targetNode, { expandTargetFolder: false });
          return;
        }
        closeMenu();
        if (targetNode.parentId) {
          void navigateToFolder(targetNode.parentId, { clearSearchTiming: 'after' }).then(() => {
            state.setHighlightedNodeId(targetNode.id);
          });
        }
      }}
      onCopyUrl={(url) => {
        void navigator.clipboard.writeText(url).then(() => toast('链接已复制'));
      }}
      onOpenDetails={(targetNode) => {
        void editor.openNodeDetails(targetNode);
      }}
      onEditBookmark={(targetNode, parentId) => editor.openBookmarkComposer('edit', parentId, targetNode)}
      onOpenAll={(id) => {
        void openNodeUrls([id]);
      }}
      onCreateFolder={(parentId) => editor.openFolderComposer('create', parentId)}
      onCreateBookmark={(parentId) => editor.openBookmarkComposer('create', parentId)}
      onSaveLaunchToFolder={(parentId) => {
        void editor.saveLaunchTab(parentId);
      }}
      onExpandFolderRecursively={(targetNode) => {
        const ids = collectFolderDescendantIds(targetNode);
        state.setExpandedTreeIds((prev) => {
          const next = Array.from(new Set([...prev, ...ids]));
          state.persistExpandedTreeIds(next);
          return next;
        });
      }}
      onCollapseFolderRecursively={(targetNode) => {
        const ids = new Set(collectFolderDescendantIds(targetNode));
        state.setExpandedTreeIds((prev) => {
          const next = prev.filter((id) => !ids.has(id));
          state.persistExpandedTreeIds(next);
          return next;
        });
      }}
      onRenameFolder={(targetNode, parentId) => editor.openFolderComposer('edit', parentId, targetNode)}
      onMove={(id) => move.openMoveDialog([id])}
      onMoveToTop={(targetNode) => {
        if (!targetNode.parentId) return;
        void reorderNodeWithinFolder(targetNode.id, targetNode.parentId, 0)
          .catch(() => toast('移动失败，请重试'));
      }}
      onDelete={(id) => {
        void askDelete([id]);
      }}
    />
  ), [
    askDelete,
    editor,
    move,
    navigateToFolder,
    navigation,
    openNodeUrls,
    revealNodeInTree,
    collectFolderDescendantIds,
    state.currentFolderId,
    state.deferredSearch,
    state.displayMode,
    state.launchBookmark,
    state.launchContext,
    state.setHighlightedNodeId,
    state.setSearchOpen,
    state.setSearchQuery,
  ]);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      safeCallWithTimeout<BookmarkDisplayMode>(() => getDisplayMode(), 'list'),
      safeCallWithTimeout<string[]>(() => getTreeExpandedIds(), []),
      safeCallWithTimeout<InsertSettings>(() => getInsertSettings(), {
        folderPosition: 'top',
        bookmarkPosition: 'top',
      }),
      safeCallWithTimeout<ViewSettings>(() => getViewSettings(), DEFAULT_VIEW_SETTINGS),
      getRecentFolders(),
    ]).then(([mode, treeExpandedIds, settings, viewSettings, recentFolders]) => {
      if (cancelled) return;
      state.setDisplayModeState(mode);
      state.setExpandedTreeIds(treeExpandedIds);
      state.setInsertSettingsState(settings);
      state.setViewSettingsState(viewSettings);
      state.setRecentFolders(recentFolders);
      void navigation.reload();
    });

    return () => {
      cancelled = true;
    };
  }, [
    navigation.reload,
    state.scrollPositionsRef,
    state.setDisplayModeState,
    state.setExpandedTreeIds,
    state.setInsertSettingsState,
    state.setRecentFolders,
    state.setViewSettingsState,
  ]);

  useEffect(() => {
    if (state.roots.length === 0 || state.expandedTreeIds.length > 0) return;

    const rootIds = state.roots.some((node) => node.id === '1')
      ? ['1']
      : state.roots
          .filter((node) => !node.url)
          .slice(0, 1)
          .map((node) => node.id);

    if (rootIds.length === 0) return;

    state.setExpandedTreeIds(rootIds);
    state.persistExpandedTreeIds(rootIds);
  }, [state.expandedTreeIds.length, state.persistExpandedTreeIds, state.roots, state.setExpandedTreeIds]);

  useEffect(() => {
    const desiredTrail = backLayerTrail;
    const historyTrail = uiHistoryTrailRef.current;

    if (historyTrail === null) {
      uiHistoryTrailRef.current = desiredTrail;
      if (desiredTrail.length > 0) pushUiHistoryTrail(desiredTrail);
      return;
    }

    if (
      historyTrail.length === desiredTrail.length
      && historyTrail.every((layer, index) => layer === desiredTrail[index])
    ) {
      return;
    }

    let commonLength = 0;
    while (
      commonLength < historyTrail.length
      && commonLength < desiredTrail.length
      && historyTrail[commonLength] === desiredTrail[commonLength]
    ) {
      commonLength += 1;
    }

    if (commonLength === historyTrail.length && desiredTrail.length > historyTrail.length) {
      pushUiHistoryTrail(desiredTrail, historyTrail.length);
      uiHistoryTrailRef.current = desiredTrail;
      return;
    }

    ignoreSyntheticUiPopRef.current = true;
    pendingUiTrailRef.current = desiredTrail;
    uiHistoryTrailRef.current = desiredTrail;
    window.history.go(commonLength - historyTrail.length);
  }, [backLayerTrail, pushUiHistoryTrail]);

  useEffect(() => {
    if (state.viewSettingsState.listBackBehavior !== 'hierarchy') {
      listHistoryTrailRef.current = null;
      pendingListTrailRef.current = null;
    }
    if (state.viewSettingsState.listBackBehavior !== 'history') {
      pendingListHistoryPushRef.current = null;
    }
  }, [state.viewSettingsState.listBackBehavior]);

  useEffect(() => {
    if (
      state.loading
      || state.displayMode !== 'list'
      || state.viewSettingsState.listBackBehavior !== 'history'
      || backLayerTrail.length > 0
      || ignoreSyntheticUiPopRef.current
      || pendingListHistoryPushRef.current
    ) {
      return;
    }

    const historyState = window.history.state as ManagerHistoryState | null;
    if (historyState?.managerListHistory && historyState.folderId === state.currentFolderId) return;

    window.history.replaceState(
      { managerListHistory: true, folderId: state.currentFolderId } satisfies ManagerHistoryState,
      '',
    );
  }, [
    backLayerTrail.length,
    state.currentFolderId,
    state.displayMode,
    state.loading,
    state.viewSettingsState.listBackBehavior,
  ]);

  useEffect(() => {
    const listNavigationActive =
      state.viewSettingsState.listBackBehavior === 'hierarchy' && state.displayMode === 'list' && !state.deferredSearch;
    if (!listNavigationActive) return;
    if (state.loading) return;
    if (backLayerTrail.length > 0 || ignoreSyntheticUiPopRef.current) return;

    const desiredTrail = state.currentFolderId === HOME_FOLDER_ID ? [] : state.breadcrumbs.map((node) => node.id);
    const historyTrail = listHistoryTrailRef.current;

    if (historyTrail === null) {
      window.history.replaceState({ managerBase: true, trail: [] } satisfies ManagerHistoryState, '');
      pushListHistoryTrail(desiredTrail);
      listHistoryTrailRef.current = desiredTrail;
      return;
    }

    if (
      historyTrail.length === desiredTrail.length
      && historyTrail.every((folderId, index) => folderId === desiredTrail[index])
    ) {
      return;
    }

    let commonLength = 0;
    while (
      commonLength < historyTrail.length
      && commonLength < desiredTrail.length
      && historyTrail[commonLength] === desiredTrail[commonLength]
    ) {
      commonLength += 1;
    }

    if (commonLength === historyTrail.length && desiredTrail.length > historyTrail.length) {
      pushListHistoryTrail(desiredTrail, historyTrail.length);
      listHistoryTrailRef.current = desiredTrail;
      return;
    }

    ignoreSyntheticListPopRef.current = true;
    pendingListTrailRef.current = desiredTrail;
    listHistoryTrailRef.current = desiredTrail;
    window.history.go(commonLength - historyTrail.length);
  }, [
    state.breadcrumbs,
    state.currentFolderId,
    state.deferredSearch,
    state.displayMode,
    state.loading,
    state.viewSettingsState.listBackBehavior,
    backLayerTrail.length,
    pushListHistoryTrail,
  ]);

  useEffect(() => {
    const handlePopState = () => {
      if (ignoreSyntheticUiPopRef.current) {
        ignoreSyntheticUiPopRef.current = false;

        const pendingTrail = pendingUiTrailRef.current;
        pendingUiTrailRef.current = null;

        if (pendingTrail) {
          const historyState = window.history.state as ManagerHistoryState | null;
          const settledTrail = historyState?.managerUiSentinel ? historyState.uiTrail ?? [] : [];
          pushUiHistoryTrail(pendingTrail, settledTrail.length);
        }

        const pendingFolderId = pendingListHistoryPushRef.current;
        if (pendingFolderId) {
          pendingListHistoryPushRef.current = null;
          pushVisitedFolderHistory(pendingFolderId);
        } else if (
          state.viewSettingsState.listBackBehavior === 'history'
          && state.displayMode === 'list'
        ) {
          window.history.replaceState(
            { managerListHistory: true, folderId: state.currentFolderId } satisfies ManagerHistoryState,
            '',
          );
        } else if (
          state.viewSettingsState.listBackBehavior === 'hierarchy'
          && state.displayMode === 'list'
          && !state.deferredSearch
          && listHistoryTrailRef.current === null
        ) {
          const desiredTrail = state.currentFolderId === HOME_FOLDER_ID ? [] : state.breadcrumbs.map((node) => node.id);
          window.history.replaceState({ managerBase: true, trail: [] } satisfies ManagerHistoryState, '');
          pushListHistoryTrail(desiredTrail);
          listHistoryTrailRef.current = desiredTrail;
        }
        return;
      }

      if (ignoreSyntheticListPopRef.current) {
        ignoreSyntheticListPopRef.current = false;

        const pendingTrail = pendingListTrailRef.current;
        pendingListTrailRef.current = null;

        if (pendingTrail) {
          const historyState = window.history.state as ManagerHistoryState | null;
          const settledTrail = historyState?.managerListSentinel
            ? historyState.trail ?? (historyState.folderId ? [historyState.folderId] : [])
            : [];
          pushListHistoryTrail(pendingTrail, settledTrail.length);
        }
        return;
      }

      const historyState = window.history.state as ManagerHistoryState | null;
      const targetUiTrail = historyState?.managerUiSentinel ? historyState.uiTrail ?? [] : [];
      const currentUiTrail = uiHistoryTrailRef.current ?? [];
      const targetIsPrefix = targetUiTrail.length <= currentUiTrail.length
        && targetUiTrail.every((layer, index) => currentUiTrail[index] === layer);

      if (targetIsPrefix && targetUiTrail.length < currentUiTrail.length) {
        uiHistoryTrailRef.current = targetUiTrail;
        dismissBackLayers(currentUiTrail.slice(targetUiTrail.length).reverse());
        return;
      }

      if (
        state.displayMode !== 'list'
        || state.deferredSearch
      ) {
        return;
      }

      if (state.viewSettingsState.listBackBehavior === 'history') {
        if (historyState?.managerListHistory && historyState.folderId && historyState.folderId !== state.currentFolderId) {
          void navigation.goToFolder(historyState.folderId);
          return;
        }
        if (historyState?.managerListSentinel || historyState?.managerBase) {
          window.history.back();
        }
        return;
      }

      if (state.viewSettingsState.listBackBehavior === 'close') {
        if (historyState?.managerListHistory || historyState?.managerListSentinel || historyState?.managerBase) {
          window.history.back();
        }
        return;
      }

      if (historyState?.managerListHistory) {
        window.history.back();
        return;
      }

      if (historyState?.managerListSentinel && historyState.folderId && historyState.folderId !== state.currentFolderId) {
        listHistoryTrailRef.current = historyState.trail ?? [historyState.folderId];
        void navigation.goToFolder(historyState.folderId);
        return;
      }

      if (state.currentFolderId !== HOME_FOLDER_ID) {
        listHistoryTrailRef.current = [];
        void navigation.goHome();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [
    navigation,
    state.breadcrumbs,
    state.currentFolderId,
    state.deferredSearch,
    state.displayMode,
    state.viewSettingsState.listBackBehavior,
    dismissBackLayers,
    pushListHistoryTrail,
    pushUiHistoryTrail,
    pushVisitedFolderHistory,
  ]);

  useEffect(() => {
    if (state.loading) return;
    const viewport = navigation.getScrollViewport();
    if (!viewport) return;

    const handleScroll = () => {
      state.scrollPositionsRef.current[navigation.getScrollKey()] = viewport.scrollTop;
    };

    viewport.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      viewport.removeEventListener('scroll', handleScroll);
    };
  }, [
    navigation.getScrollKey,
    navigation.getScrollViewport,
    state.currentFolderId,
    state.displayMode,
    state.loading,
    state.scrollPositionsRef,
  ]);

  useEffect(() => {
    if (state.loading) return;
    const frame = window.requestAnimationFrame(() => {
      navigation.getScrollViewport()?.scrollTo({
        top: state.scrollPositionsRef.current[navigation.getScrollKey()] ?? 0,
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [
    navigation.getScrollKey,
    navigation.getScrollViewport,
    state.currentFolderId,
    state.deferredSearch,
    state.displayMode,
    state.loading,
    state.scrollPositionsRef,
  ]);


  useEffect(() => {
    if (state.searchOpen) {
      state.searchInputRef.current?.focus();
    }
  }, [state.searchOpen, state.searchInputRef]);

  useEffect(() => {
    if (!state.moveState.open || state.folderTree.length === 0) return;
    state.setExpandedMoveFolderIds((prev) => Array.from(new Set([...prev, ...state.folderTree.map((node) => node.id)])));
  }, [state.folderTree, state.moveState.open, state.setExpandedMoveFolderIds]);

  useEffect(() => {
    if (!state.highlightedNodeId) return;

    const timer = window.setTimeout(() => {
      state.setHighlightedNodeId(null);
    }, 1600);

    return () => {
      window.clearTimeout(timer);
    };
  }, [state.highlightedNodeId, state.setHighlightedNodeId]);

  useEffect(() => {
    let cancelled = false;

    if (!state.launchContext?.url) {
      state.setLaunchBookmark(null);
      return;
    }

    void chrome.bookmarks.search({ url: state.launchContext.url }).then((results) => {
      if (cancelled) return;
      state.setLaunchBookmark(results.find((node) => !!node.url) ?? null);
    });

    return () => {
      cancelled = true;
    };
  }, [state.launchContext, state.setLaunchBookmark]);

  useEffect(() => {
    const handleChange = () => {
      void navigation.reload();
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
  }, [navigation.reload]);

  useEffect(() => {
    const handleMessage = (message: unknown) => {
      if (message && typeof message === 'object' && (message as { type?: string }).type === 'launch-context-updated') {
        state.setLaunchContextState((message as { payload: LaunchContext | null }).payload);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [state.setLaunchContextState]);

  useEffect(() => {
    let cancelled = false;

    if (!state.deferredSearch) {
      searchResultsQueryRef.current = '';
      state.setSearchResults([]);
      state.setSearchPaths({});
      state.setSearching(false);
      return;
    }

    // 刷新同一搜索时保留结果，避免列表清空导致浏览器把滚动位置压回顶部。
    if (searchResultsQueryRef.current !== state.deferredSearch) {
      state.setSearching(true);
      state.setSearchResults([]);
      state.setSearchPaths({});
      searchResultsQueryRef.current = state.deferredSearch;
    }
    void searchNodes(state.deferredSearch)
      .then((results) => {
        const sorted = sortFoldersFirst(results);
        const pathEntries = sorted.map((node) => [node.id, folderPaths.get(node.parentId ?? '') ?? '根目录'] as const);

        if (cancelled) return;

        startTransition(() => {
          state.setSearchResults(sorted);
          state.setSearchPaths(Object.fromEntries(pathEntries));
          state.setSearching(false);
        });
      })
      .catch(() => {
        if (cancelled) return;
        state.setSearchResults([]);
        state.setSearchPaths({});
        state.setSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [folderPaths, state.currentFolderId, state.deferredSearch, state.setSearchPaths, state.setSearchResults, state.setSearching]);

  if (state.loading) {
    return <div className="h-[var(--app-height)] bg-background" />;
  }

  return (
    <div className="flex h-[var(--app-height)] flex-col overflow-hidden bg-background text-foreground">
      <ManagerToolbar
        toolsMenuRef={state.toolsMenuRef}
        pageTitle={navigation.pageTitle}
        searchOpen={state.searchOpen}
        deferredSearch={state.deferredSearch}
        searchQuery={state.searchQuery}
        searchInputRef={state.searchInputRef}
        selectionMode={state.selectionMode}
        selectedCount={state.selectedIds.length}
        hasLaunchContext={Boolean(state.launchContext)}
        hasLaunchBookmark={Boolean(state.launchBookmark)}
        launchContext={state.launchContext}
        displayMode={state.displayMode}
        toolsDisabledOnHome={navigation.toolsDisabledOnHome}
        selectableCount={selectableNodes.length}
        canCreateInCurrentFolder={navigation.canCreateInCurrentFolder}
        onSearchChange={(value) => {
          state.setSearchQuery(value);
          resetSelection();
        }}
        onCloseSearch={() => {
          state.setSearchQuery('');
          state.setSearchOpen(false);
        }}
        onOpenSearch={() => state.setSearchOpen(true)}
        onReload={() => void navigation.reload(state.currentFolderId)}
        onOpenSelected={() => void openNodeUrls(state.selectedIds)}
        onMoveSelected={() => state.selectedIds.length > 0 && move.openMoveDialog(state.selectedIds)}
        onDeleteSelected={() => state.selectedIds.length > 0 && void askDelete(state.selectedIds)}
        onCloseSelection={resetSelection}
        onSwitchMode={navigation.switchDisplayMode}
        onOpenSettings={() => {
          state.setSettingsOpen(true);
        }}
        onSaveLaunch={() => {
          void editor.saveLaunchTab(undefined, state.displayMode === 'tree');
        }}
        onSelectMode={() => {
          state.setSelectionMode(true);
        }}
        onCreateFolder={() => {
          editor.openFolderComposer('create', state.currentFolderId);
        }}
        onCreateBookmark={() => {
          editor.openBookmarkComposer('create', state.currentFolderId);
        }}
      />

      <ManagerContent
        scrollAreaRef={state.scrollAreaRef}
        deferredSearch={state.deferredSearch}
        displayMode={state.displayMode}
        isHomeView={navigation.isHomeView}
        breadcrumbs={state.breadcrumbs}
        onGoHome={() => {
          void navigateToFolder(HOME_FOLDER_ID);
        }}
        onGoToFolder={(id) => {
          void navigateToFolder(id);
        }}
        errorMessage={state.errorMessage}
        searching={state.searching}
        loading={state.loading}
        roots={state.roots}
        visibleNodes={visibleNodes}
        folderChildCounts={state.folderChildCounts}
        selectedIds={state.selectedIds}
        selectionMode={state.selectionMode}
        searchPaths={state.searchPaths}
        listCompact={state.viewSettingsState.listCompact}
        treeCompact={state.viewSettingsState.treeCompact}
        viewSettings={state.viewSettingsState}
        expandedTreeIds={state.expandedTreeIds}
        highlightedNodeId={state.highlightedNodeId}
        getItemMenuContent={getItemMenuContent}
        onToggleTreeFolder={navigation.toggleTreeExpanded}
        onOpenNode={(node) => {
          if (state.deferredSearch && !node.url) {
            if (state.displayMode === 'tree') {
              void revealNodeInTree(node, { expandTargetFolder: true });
              return;
            }

            void navigateToFolder(node.id, { clearSearchTiming: 'after' });
            return;
          }

          if (!node.url) {
            void navigateToFolder(node.id);
            return;
          }

          void navigation.openNode(node);
        }}
        onToggleSelect={toggleSelect}
        onReorderCurrentListItem={(nodeId, insertIndex, parentId) => {
          if (state.deferredSearch) return;

          const reorderParentId = parentId ?? (state.displayMode === 'list' ? state.currentFolder?.id : undefined);
          if (!reorderParentId) return;

          void reorderNodeWithinFolder(nodeId, reorderParentId, insertIndex).then(() => navigation.reload(reorderParentId));
        }}
      />

      <BookmarkEditorDialogs
        folderComposer={state.folderComposer}
        onFolderComposerOpenChange={(open) => state.setFolderComposer((current) => ({ ...current, open }))}
        onFolderComposerOpenChangeComplete={editor.onFolderComposerOpenChangeComplete}
        onFolderComposerTitleChange={(title) => state.setFolderComposer((current) => ({ ...current, title }))}
        onFolderComposerPositionChange={(position) => state.setFolderComposer((current) => ({ ...current, position }))}
        onSubmitFolder={() => void editor.submitFolder()}
        bookmarkComposer={state.bookmarkComposer}
        bookmarkComposerFolderName={editor.bookmarkComposerFolderName}
        recentFolders={state.recentFolders}
        onBookmarkComposerOpenChange={(open) => state.setBookmarkComposer((current) => ({ ...current, open }))}
        onBookmarkComposerOpenChangeComplete={editor.onBookmarkComposerOpenChangeComplete}
        onBookmarkComposerPickParent={() => {
          editor.closeBookmarkComposer(() => {
            state.setMoveState({
              open: true,
              mode: 'pick-bookmark-parent',
              ids: [],
              query: '',
              targetFolderId: state.bookmarkComposer.parentId,
            });
          });
        }}
        onBookmarkComposerRecentOpenChange={(open) => {
          state.setBookmarkComposer((current) => ({ ...current, recentOpen: open }));
        }}
        onBookmarkComposerPickRecentFolder={(folderId) => {
          state.setBookmarkComposer((current) => ({ ...current, parentId: folderId, recentOpen: false }));
        }}
        onBookmarkComposerTitleChange={(title) => state.setBookmarkComposer((current) => ({ ...current, title }))}
        onBookmarkComposerUrlChange={(url) => state.setBookmarkComposer((current) => ({ ...current, url }))}
        onBookmarkComposerPositionChange={(position) => state.setBookmarkComposer((current) => ({ ...current, position }))}
        onBookmarkComposerRevealLocation={() => {
          editor.closeBookmarkComposer(() => navigateToFolder(state.bookmarkComposer.parentId));
        }}
        onBookmarkComposerDelete={() => {
          const targetId = state.bookmarkComposer.targetId;
          if (!targetId) return;
          void askDelete([targetId]).then((deleted) => {
            if (deleted) editor.closeBookmarkComposer();
          });
        }}
        onSubmitBookmark={() => void editor.submitBookmark()}
        detailState={state.detailState}
        onDetailOpenChange={(open) => state.setDetailState((current) => ({ ...current, open }))}
      />

      <SettingsDialog
        open={state.settingsOpen}
        onOpenChange={state.setSettingsOpen}
        settings={state.insertSettingsState}
        viewSettings={state.viewSettingsState}
        onChange={applyInsertSettings}
        onViewChange={applyViewSettings}
        normalizing={state.normalizing}
        onNormalize={() => void normalizeAllFoldersAction()}
      />

      <MovePanel
        moveState={state.moveState}
        filteredFolderTree={move.filteredFolderTree}
        moveTreeExpandedIds={move.moveTreeExpandedIds}
        onMoveClose={closeMovePanel}
        onSubmitMove={() => void move.submitMove()}
        onMoveQueryChange={(query) => state.setMoveState((current) => ({ ...current, query }))}
        onMovePositionChange={(position) => state.setMoveState((current) => ({ ...current, position }))}
        onToggleMoveExpanded={move.toggleMoveFolderExpanded}
        onMoveSelectTarget={(folder) => {
          state.setMoveState((current) => ({ ...current, targetFolderId: folder.id }));
          if (folder.children.length > 0) {
            move.toggleMoveFolderExpanded(folder.id);
          }
        }}
        onMoveCreateFolder={(folder) => {
          state.setExpandedMoveFolderIds((prev) => Array.from(new Set([...prev, folder.id])));
          editor.openFolderComposer('create', folder.id, undefined, 'move-panel');
        }}
        onMoveRenameFolder={(folder) => {
          editor.openFolderComposer('edit', folder.id, { id: folder.id, title: folder.title } as chrome.bookmarks.BookmarkTreeNode, 'move-panel');
        }}
        onMoveDeleteFolder={(folder) => {
          void askDelete([folder.id]);
        }}
      />

      <Toaster />
    </div>
  );
}

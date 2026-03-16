import { startTransition, useCallback, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';

import { Toaster } from '@/components/ui/sonner';
import {
  captureDeletedNodes,
  deleteNodes,
  getDisplayMode,
  getDisplayTitle,
  getFolderPath,
  getFolderPathNodes,
  getInsertSettings,
  getRecentFolders,
  getSavedScrollPositions,
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

export default function App() {
  const state = useManagerPageState();
  const ignoreNextListPopRef = useRef(false);

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
    persistScrollPositions: state.persistScrollPositions,
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

  const visibleNodes = useMemo(
    () => (state.deferredSearch ? state.searchResults : state.currentChildren),
    [state.currentChildren, state.deferredSearch, state.searchResults],
  );
  const selectableNodes = useMemo(
    () =>
      state.displayMode === 'tree' && !state.deferredSearch ? flattenTreeNodes(state.roots) : visibleNodes,
    [state.deferredSearch, state.displayMode, state.roots, visibleNodes],
  );

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
      return;
    }

    state.setActionTarget(null);
    const snapshots = await captureDeletedNodes(deletableIds);
    const deletedLabel =
      snapshots.length === 1 ? getDisplayTitle(snapshots[0].node) : `已删除 ${snapshots.length} 个项目`;
    await deleteNodes(deletableIds);
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
  }, [
    navigation,
    resetSelection,
    state.currentFolderId,
    state.currentFolderIdRef,
    state.launchBookmark,
    state.launchContext,
    state.setActionTarget,
    state.setLaunchBookmark,
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

  const revealNodeInTree = useCallback(async (node: chrome.bookmarks.BookmarkTreeNode) => {
    const ancestorPath = await safeCall(
      () => getFolderPathNodes(node.url ? (node.parentId ?? state.currentFolderIdRef.current) : node.id),
      [],
    );
    const ancestorIds = ancestorPath.map((item) => item.id);
    state.setExpandedTreeIds((prev) => {
      const next = Array.from(new Set([...prev, ...ancestorIds]));
      state.persistExpandedTreeIds(next);
      return next;
    });
    state.setSearchQuery('');
    state.setSearchOpen(false);
    state.setActionTarget(null);
    state.setHighlightedNodeId(node.id);
  }, [
    state.currentFolderIdRef,
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

  const getItemMenuContent = useCallback((node: chrome.bookmarks.BookmarkTreeNode, compact: boolean, closeMenu: () => void) => (
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
          void revealNodeInTree(targetNode);
          return;
        }
        closeMenu();
        if (targetNode.parentId) {
          state.setSearchQuery('');
          state.setSearchOpen(false);
          void navigation.goToFolder(targetNode.parentId).then(() => {
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
      onDelete={(id) => {
        void askDelete([id]);
      }}
    />
  ), [
    askDelete,
    editor,
    move,
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
      safeCallWithTimeout<Record<string, number>>(() => getSavedScrollPositions(), {}),
      safeCallWithTimeout<BookmarkDisplayMode>(() => getDisplayMode(), 'list'),
      safeCallWithTimeout<string[]>(() => getTreeExpandedIds(), []),
      safeCallWithTimeout<InsertSettings>(() => getInsertSettings(), {
        folderPosition: 'bottom',
        bookmarkPosition: 'bottom',
      }),
      safeCallWithTimeout<ViewSettings>(() => getViewSettings(), {
        listCompact: false,
        treeCompact: true,
        listBackNavigation: false,
      }),
    ]).then(([positions, mode, treeExpandedIds, settings, viewSettings]) => {
      if (cancelled) return;
      state.scrollPositionsRef.current = positions;
      state.setDisplayModeState(mode);
      state.setExpandedTreeIds(treeExpandedIds);
      state.setInsertSettingsState(settings);
      state.setViewSettingsState(viewSettings);
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
    const listNavigationActive =
      state.viewSettingsState.listBackNavigation && state.displayMode === 'list' && !state.deferredSearch;
    if (!listNavigationActive) return;

    const currentState = window.history.state as
      | { managerBase?: boolean; managerListSentinel?: boolean; folderId?: string }
      | null;

    if (state.currentFolderId === HOME_FOLDER_ID) {
      if (currentState?.managerListSentinel) {
        ignoreNextListPopRef.current = true;
        window.history.back();
        return;
      }

      if (!currentState?.managerBase) {
        window.history.replaceState({ managerBase: true }, '');
      }
      return;
    }

    if (currentState?.managerListSentinel) {
      if (currentState.folderId !== state.currentFolderId) {
        window.history.replaceState(
          { managerListSentinel: true, folderId: state.currentFolderId },
          '',
        );
      }
      return;
    }

    if (!currentState?.managerBase) {
      window.history.replaceState({ managerBase: true }, '');
    }

    window.history.pushState({ managerListSentinel: true, folderId: state.currentFolderId }, '');
  }, [state.currentFolderId, state.deferredSearch, state.displayMode, state.viewSettingsState.listBackNavigation]);

  useEffect(() => {
    const handlePopState = () => {
      if (ignoreNextListPopRef.current) {
        ignoreNextListPopRef.current = false;
        return;
      }

      if (
        !state.viewSettingsState.listBackNavigation
        || state.displayMode !== 'list'
        || state.deferredSearch
        || state.currentFolderId === HOME_FOLDER_ID
      ) {
        return;
      }

      const parentId = state.breadcrumbs.length > 1 ? state.breadcrumbs[state.breadcrumbs.length - 2].id : HOME_FOLDER_ID;

      if (parentId === HOME_FOLDER_ID) {
        void navigation.goHome();
        return;
      }

      void navigation.goToFolder(parentId);
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
    state.viewSettingsState.listBackNavigation,
  ]);

  useEffect(() => {
    const viewport = navigation.getScrollViewport();
    if (!viewport) return;

    const handleScroll = () => {
      state.scrollPositionsRef.current[navigation.getScrollKey()] = viewport.scrollTop;
      navigation.persistScrollPositions();
    };

    viewport.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      viewport.removeEventListener('scroll', handleScroll);
    };
  }, [
    navigation.getScrollKey,
    navigation.getScrollViewport,
    navigation.persistScrollPositions,
    state.currentFolderId,
    state.displayMode,
    state.scrollPositionsRef,
  ]);

  useEffect(() => {
    window.requestAnimationFrame(() => {
      navigation.getScrollViewport()?.scrollTo({
        top: state.scrollPositionsRef.current[navigation.getScrollKey()] ?? 0,
      });
    });
  }, [
    navigation.getScrollKey,
    navigation.getScrollViewport,
    state.currentFolderId,
    state.deferredSearch,
    state.displayMode,
    state.scrollPositionsRef,
  ]);

  useEffect(() => {
    return () => {
      if (state.scrollPersistTimerRef.current) {
        clearTimeout(state.scrollPersistTimerRef.current);
      }
    };
  }, [state.scrollPersistTimerRef]);

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
    if (!state.bookmarkComposer.open) return;

    void getRecentFolders().then((folders) => {
      state.setRecentFolders(folders);
    });
  }, [state.bookmarkComposer.open, state.setRecentFolders]);

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
      state.setSearchResults([]);
      state.setSearchPaths({});
      state.setSearching(false);
      return;
    }

    state.setSearching(true);
    void searchNodes(state.deferredSearch)
      .then(async (results) => {
        const sorted = sortFoldersFirst(results);
        const pathEntries = await Promise.all(
          sorted.map(async (node) => {
            const pathTarget = node.url ? node.parentId ?? state.currentFolderId : node.id;
            return [node.id, await safeCall(() => getFolderPath(pathTarget), '')] as const;
          }),
        );

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
  }, [state.currentFolderId, state.deferredSearch, state.setSearchPaths, state.setSearchResults, state.setSearching]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[linear-gradient(180deg,#fbf4e8_0%,#f2e7d6_100%)] text-foreground">
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
          void navigation.goHome();
        }}
        onGoToFolder={(id) => {
          void navigation.goToFolder(id);
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
        expandedTreeIds={state.expandedTreeIds}
        highlightedNodeId={state.highlightedNodeId}
        getItemMenuContent={getItemMenuContent}
        onToggleTreeFolder={navigation.toggleTreeExpanded}
        onOpenNode={(node) => {
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
        onFolderComposerTitleChange={(title) => state.setFolderComposer((current) => ({ ...current, title }))}
        onSubmitFolder={() => void editor.submitFolder()}
        bookmarkComposer={state.bookmarkComposer}
        bookmarkComposerFolderName={editor.bookmarkComposerFolderName}
        recentFolders={state.recentFolders}
        onBookmarkComposerOpenChange={(open) =>
          state.setBookmarkComposer((current) => ({ ...current, open, recentOpen: open ? current.recentOpen : false }))
        }
        onBookmarkComposerPickParent={() => {
          state.setBookmarkComposer((current) => ({ ...current, open: false, recentOpen: false }));
          state.setMoveState({
            open: true,
            mode: 'pick-bookmark-parent',
            ids: [],
            query: '',
            targetFolderId: state.bookmarkComposer.parentId,
          });
        }}
        onBookmarkComposerToggleRecentFolders={() => {
          state.setBookmarkComposer((current) => ({ ...current, recentOpen: !current.recentOpen }));
        }}
        onBookmarkComposerPickRecentFolder={(folderId) => {
          state.setBookmarkComposer((current) => ({ ...current, parentId: folderId, recentOpen: false }));
        }}
        onBookmarkComposerTitleChange={(title) => state.setBookmarkComposer((current) => ({ ...current, title }))}
        onBookmarkComposerUrlChange={(url) => state.setBookmarkComposer((current) => ({ ...current, url }))}
        onBookmarkComposerRevealLocation={() => {
          state.setBookmarkComposer((current) => ({ ...current, open: false, recentOpen: false }));
          void navigation.goToFolder(state.bookmarkComposer.parentId);
        }}
        onBookmarkComposerDelete={() => {
          state.setBookmarkComposer((current) => ({ ...current, open: false, recentOpen: false }));
          void askDelete([state.bookmarkComposer.targetId!]);
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
        onMoveClose={() => {
          if (state.moveState.mode === 'pick-bookmark-parent') {
            state.setBookmarkComposer((current) => ({ ...current, open: true }));
          }
          state.setMoveState((current) => ({ ...current, open: false, mode: 'move', query: '' }));
        }}
        onSubmitMove={() => void move.submitMove()}
        onMoveQueryChange={(query) => state.setMoveState((current) => ({ ...current, query }))}
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

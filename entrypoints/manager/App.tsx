import { startTransition, useCallback, useEffect, useMemo } from 'react';
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
  getSavedScrollPositions,
  getTreeExpandedIds,
  isProtectedNode,
  normalizeAllFolders,
  restoreDeletedNodes,
  searchNodes,
  setInsertSettings,
  sortFoldersFirst,
  type BookmarkDisplayMode,
  type InsertSettings,
  type LaunchContext,
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
import { flattenTreeNodes, safeCall, safeCallWithTimeout } from './utils';

export default function App() {
  const state = useManagerPageState();

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
    setMoveMenuDirection: state.setMoveMenuDirection,
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
    window.setTimeout(() => {
      const target = state.scrollAreaRef.current?.querySelector(`[data-tree-node-id="${node.id}"]`) as HTMLElement | null;
      target?.scrollIntoView({ block: 'center' });
    }, 80);
  }, [
    state.currentFolderIdRef,
    state.persistExpandedTreeIds,
    state.scrollAreaRef,
    state.setActionTarget,
    state.setExpandedTreeIds,
    state.setSearchOpen,
    state.setSearchQuery,
  ]);

  const toggleActionMenu = useCallback((node: chrome.bookmarks.BookmarkTreeNode, button: HTMLElement) => {
    const rect = button.getBoundingClientRect();
    state.setActionMenuDirection(window.innerHeight - rect.bottom < 220 ? 'up' : 'down');
    state.setActionTarget((current) => (current?.id === node.id ? null : node));
  }, [state.setActionMenuDirection, state.setActionTarget]);

  const getItemMenuContent = useCallback((node: chrome.bookmarks.BookmarkTreeNode) => (
    <ItemMenuContent
      node={node}
      deferredSearch={Boolean(state.deferredSearch)}
      currentFolderId={state.currentFolderId}
      displayMode={state.displayMode}
      onClose={() => state.setActionTarget(null)}
      onShowLocation={(targetNode) => {
        if (state.displayMode === 'tree') {
          void revealNodeInTree(targetNode);
          return;
        }
        state.setActionTarget(null);
        if (targetNode.parentId) {
          void navigation.goToFolder(targetNode.parentId);
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
    state.currentFolderId,
    state.deferredSearch,
    state.displayMode,
    state.setActionTarget,
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
    ]).then(([positions, mode, treeExpandedIds, settings]) => {
      if (cancelled) return;
      state.scrollPositionsRef.current = positions;
      state.setDisplayModeState(mode);
      state.setExpandedTreeIds(treeExpandedIds);
      state.setInsertSettingsState(settings);
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
    if (!state.toolsOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (state.toolsMenuRef.current?.contains(target) || state.toolsButtonRef.current?.contains(target)) {
        return;
      }
      state.setToolsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [state.setToolsOpen, state.toolsButtonRef, state.toolsMenuRef, state.toolsOpen]);

  useEffect(() => {
    if (!state.actionTarget) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-item-menu]')) return;
      state.setActionTarget(null);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [state.actionTarget, state.setActionTarget]);

  useEffect(() => {
    if (!state.moveActionTarget) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-move-item-menu]')) return;
      state.setMoveActionTarget(null);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [state.moveActionTarget, state.setMoveActionTarget]);

  useEffect(() => {
    if (!state.moveState.open || state.folderTree.length === 0) return;
    state.setExpandedMoveFolderIds((prev) => Array.from(new Set([...prev, ...state.folderTree.map((node) => node.id)])));
  }, [state.folderTree, state.moveState.open, state.setExpandedMoveFolderIds]);

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
        toolsButtonRef={state.toolsButtonRef}
        selectionMode={state.selectionMode}
        selectedCount={state.selectedIds.length}
        hasLaunchContext={Boolean(state.launchContext)}
        hasLaunchBookmark={Boolean(state.launchBookmark)}
        toolsOpen={state.toolsOpen}
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
        onToggleTools={() => state.setToolsOpen((open) => !open)}
        onOpenSelected={() => void openNodeUrls(state.selectedIds)}
        onMoveSelected={() => state.selectedIds.length > 0 && move.openMoveDialog(state.selectedIds)}
        onDeleteSelected={() => state.selectedIds.length > 0 && void askDelete(state.selectedIds)}
        onCloseSelection={resetSelection}
        onSwitchMode={navigation.switchDisplayMode}
        onOpenSettings={() => {
          state.setToolsOpen(false);
          state.setSettingsOpen(true);
        }}
        onSaveLaunch={() => {
          state.setToolsOpen(false);
          void editor.saveLaunchTab();
        }}
        onSelectMode={() => {
          state.setToolsOpen(false);
          state.setSelectionMode(true);
        }}
        onCreateFolder={() => {
          state.setToolsOpen(false);
          editor.openFolderComposer('create', state.currentFolderId);
        }}
        onCreateBookmark={() => {
          state.setToolsOpen(false);
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
        actionTargetId={state.actionTarget?.id}
        actionMenuDirection={state.actionMenuDirection}
        expandedTreeIds={state.expandedTreeIds}
        getItemMenuContent={getItemMenuContent}
        onToggleTreeFolder={navigation.toggleTreeExpanded}
        onOpenNode={(node) => {
          void navigation.openNode(node);
        }}
        onToggleSelect={toggleSelect}
        onToggleActionMenu={toggleActionMenu}
      />

      <BookmarkEditorDialogs
        folderComposer={state.folderComposer}
        onFolderComposerOpenChange={(open) => state.setFolderComposer((current) => ({ ...current, open }))}
        onFolderComposerTitleChange={(title) => state.setFolderComposer((current) => ({ ...current, title }))}
        onSubmitFolder={() => void editor.submitFolder()}
        bookmarkComposer={state.bookmarkComposer}
        bookmarkComposerPath={editor.bookmarkComposerPath}
        onBookmarkComposerOpenChange={(open) => state.setBookmarkComposer((current) => ({ ...current, open }))}
        onBookmarkComposerPickParent={() => {
          state.setBookmarkComposer((current) => ({ ...current, open: false }));
          state.setMoveState({
            open: true,
            mode: 'pick-bookmark-parent',
            ids: [],
            query: '',
            targetFolderId: state.bookmarkComposer.parentId,
          });
        }}
        onBookmarkComposerTitleChange={(title) => state.setBookmarkComposer((current) => ({ ...current, title }))}
        onBookmarkComposerUrlChange={(url) => state.setBookmarkComposer((current) => ({ ...current, url }))}
        onBookmarkComposerRevealLocation={() => {
          state.setBookmarkComposer((current) => ({ ...current, open: false }));
          void navigation.goToFolder(state.bookmarkComposer.parentId);
        }}
        onBookmarkComposerDelete={() => {
          state.setBookmarkComposer((current) => ({ ...current, open: false }));
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
        onChange={applyInsertSettings}
        normalizing={state.normalizing}
        onNormalize={() => void normalizeAllFoldersAction()}
      />

      <MovePanel
        moveState={state.moveState}
        filteredFolderTree={move.filteredFolderTree}
        moveTreeExpandedIds={move.moveTreeExpandedIds}
        moveActionTargetId={state.moveActionTarget?.id}
        moveMenuDirection={state.moveMenuDirection}
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
          state.setMoveActionTarget(null);
          state.setMoveState((current) => ({ ...current, targetFolderId: folder.id }));
          if (folder.children.length > 0) {
            move.toggleMoveFolderExpanded(folder.id);
          }
        }}
        onToggleMoveActionMenu={move.toggleMoveActionMenu}
        onMoveCreateFolder={(folder) => {
          state.setMoveActionTarget(null);
          editor.openFolderComposer('create', folder.id);
        }}
        onMoveRenameFolder={(folder) => {
          state.setMoveActionTarget(null);
          editor.openFolderComposer('edit', folder.id, { id: folder.id, title: folder.title } as chrome.bookmarks.BookmarkTreeNode);
        }}
        onMoveDeleteFolder={(folder) => {
          state.setMoveActionTarget(null);
          void askDelete([folder.id]);
        }}
      />

      <Toaster />
    </div>
  );
}

import { useCallback, useDeferredValue, useEffect, useRef, useState } from 'react';

import {
  setSavedScrollPositions,
  setTreeExpandedIds,
  type BookmarkDisplayMode,
  type FolderTreeNode,
  type InsertSettings,
  type LaunchContext,
} from '@/lib/bookmark-service';

import type { BookmarkComposerState, DetailState, FolderComposerState, MoveState } from '../types';
import { HOME_FOLDER_ID, safeCall } from '../utils';

export function useManagerPageState() {
  const reloadRequestRef = useRef(0);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const scrollPositionsRef = useRef<Record<string, number>>({});
  const scrollPersistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toolsMenuRef = useRef<HTMLDivElement | null>(null);
  const toolsButtonRef = useRef<HTMLButtonElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const currentFolderIdRef = useRef(HOME_FOLDER_ID);

  const [actionMenuDirection, setActionMenuDirection] = useState<'up' | 'down'>('down');
  const [moveMenuDirection, setMoveMenuDirection] = useState<'up' | 'down'>('down');
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
  const [searchResults, setSearchResults] = useState<chrome.bookmarks.BookmarkTreeNode[]>([]);
  const [searchPaths, setSearchPaths] = useState<Record<string, string>>({});
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionTarget, setActionTarget] = useState<chrome.bookmarks.BookmarkTreeNode | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [displayMode, setDisplayModeState] = useState<BookmarkDisplayMode>('list');
  const [expandedTreeIds, setExpandedTreeIds] = useState<string[]>([]);
  const [insertSettingsState, setInsertSettingsState] = useState<InsertSettings>({
    folderPosition: 'bottom',
    bookmarkPosition: 'bottom',
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [normalizing, setNormalizing] = useState(false);
  const [detailState, setDetailState] = useState<DetailState>({
    open: false,
    title: '',
    url: '',
    path: '',
    meta: '',
  });
  const [expandedMoveFolderIds, setExpandedMoveFolderIds] = useState<string[]>([]);
  const [moveActionTarget, setMoveActionTarget] = useState<FolderTreeNode | null>(null);
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

  const deferredSearch = useDeferredValue(searchQuery.trim());

  useEffect(() => {
    currentFolderIdRef.current = currentFolderId;
  }, [currentFolderId]);

  const persistScrollPositions = useCallback(() => {
    if (scrollPersistTimerRef.current) {
      clearTimeout(scrollPersistTimerRef.current);
    }

    scrollPersistTimerRef.current = setTimeout(() => {
      void safeCall(() => setSavedScrollPositions({ ...scrollPositionsRef.current }), undefined);
    }, 120);
  }, []);

  const persistExpandedTreeIds = useCallback((ids: string[]) => {
    void safeCall(() => setTreeExpandedIds(ids), undefined);
  }, []);

  return {
    reloadRequestRef,
    scrollAreaRef,
    scrollPositionsRef,
    scrollPersistTimerRef,
    toolsMenuRef,
    toolsButtonRef,
    searchInputRef,
    currentFolderIdRef,
    actionMenuDirection,
    setActionMenuDirection,
    moveMenuDirection,
    setMoveMenuDirection,
    loading,
    setLoading,
    searching,
    setSearching,
    errorMessage,
    setErrorMessage,
    roots,
    setRoots,
    currentFolderId,
    setCurrentFolderId,
    currentFolder,
    setCurrentFolder,
    breadcrumbs,
    setBreadcrumbs,
    currentChildren,
    setCurrentChildren,
    folderTree,
    setFolderTree,
    folderChildCounts,
    setFolderChildCounts,
    launchContext,
    setLaunchContextState,
    launchBookmark,
    setLaunchBookmark,
    searchQuery,
    setSearchQuery,
    searchOpen,
    setSearchOpen,
    searchResults,
    setSearchResults,
    searchPaths,
    setSearchPaths,
    selectionMode,
    setSelectionMode,
    selectedIds,
    setSelectedIds,
    actionTarget,
    setActionTarget,
    toolsOpen,
    setToolsOpen,
    displayMode,
    setDisplayModeState,
    expandedTreeIds,
    setExpandedTreeIds,
    insertSettingsState,
    setInsertSettingsState,
    settingsOpen,
    setSettingsOpen,
    normalizing,
    setNormalizing,
    detailState,
    setDetailState,
    expandedMoveFolderIds,
    setExpandedMoveFolderIds,
    moveActionTarget,
    setMoveActionTarget,
    folderComposer,
    setFolderComposer,
    bookmarkComposer,
    setBookmarkComposer,
    moveState,
    setMoveState,
    deferredSearch,
    persistScrollPositions,
    persistExpandedTreeIds,
  };
}

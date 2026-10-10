import { useCallback, useLayoutEffect, useMemo, useRef, type Dispatch, type SetStateAction } from 'react';
import { toast } from '@/lib/toast';

import {
  createBookmark,
  createFolder,
  getDisplayTitle,
  getFolderPath,
  getInitialFolderId,
  getRecentFolders,
  moveNodes,
  normalizeUrl,
  updateBookmarkNode,
  type RecentFolder,
  type FolderTreeNode,
  type InsertSettings,
  type LaunchContext,
} from '@/lib/bookmark-service';

import type { BookmarkComposerState, DetailState, FolderComposerState } from '../types';
import { findFolderPath, getBookmarkMeta, HOME_FOLDER_ID, safeCall } from '../utils';

type UseBookmarkEditorParams = {
  currentFolderId: string;
  folderTree: FolderTreeNode[];
  folderChildCounts: Record<string, number>;
  insertSettingsState: InsertSettings;
  launchContext: LaunchContext | null;
  setActionTarget: Dispatch<SetStateAction<chrome.bookmarks.BookmarkTreeNode | null>>;
  setDetailState: Dispatch<SetStateAction<DetailState>>;
  folderComposer: FolderComposerState;
  setFolderComposer: Dispatch<SetStateAction<FolderComposerState>>;
  bookmarkComposer: BookmarkComposerState;
  setBookmarkComposer: Dispatch<SetStateAction<BookmarkComposerState>>;
  setLaunchBookmark: Dispatch<SetStateAction<chrome.bookmarks.BookmarkTreeNode | null>>;
  setRecentFolders: Dispatch<SetStateAction<RecentFolder[]>>;
  onNodeSaved: (node: chrome.bookmarks.BookmarkTreeNode) => void;
  onFolderSaved?: (payload: {
    mode: 'create' | 'edit';
    source: 'page' | 'move-panel';
    node: chrome.bookmarks.BookmarkTreeNode;
    parentId: string;
  }) => void;
  reload: (preferredFolderId?: string) => Promise<void>;
};

export function useBookmarkEditor({
  currentFolderId,
  folderTree,
  folderChildCounts,
  insertSettingsState,
  launchContext,
  setActionTarget,
  setDetailState,
  folderComposer,
  setFolderComposer,
  bookmarkComposer,
  setBookmarkComposer,
  setLaunchBookmark,
  setRecentFolders,
  onNodeSaved,
  onFolderSaved,
  reload,
}: UseBookmarkEditorParams) {
  const bookmarkOpenRequestRef = useRef(0);
  const folderAfterCloseRef = useRef<(() => void | Promise<void>) | null>(null);
  const bookmarkAfterCloseRef = useRef<(() => void | Promise<void>) | null>(null);
  const folderClosedRef = useRef(!folderComposer.open);
  const bookmarkClosedRef = useRef(!bookmarkComposer.open);

  useLayoutEffect(() => {
    if (folderComposer.open) folderClosedRef.current = false;
    if (bookmarkComposer.open) bookmarkClosedRef.current = false;
  }, [bookmarkComposer.open, folderComposer.open]);

  const closeFolderComposer = useCallback((afterClose?: () => void | Promise<void>) => {
    folderAfterCloseRef.current = folderClosedRef.current ? null : afterClose ?? null;
    setFolderComposer((state) => ({ ...state, open: false }));
    if (folderClosedRef.current) void afterClose?.();
  }, [setFolderComposer]);

  const closeBookmarkComposer = useCallback((afterClose?: () => void | Promise<void>) => {
    bookmarkAfterCloseRef.current = bookmarkClosedRef.current ? null : afterClose ?? null;
    setBookmarkComposer((state) => ({ ...state, open: false }));
    if (bookmarkClosedRef.current) void afterClose?.();
  }, [setBookmarkComposer]);

  const onFolderComposerOpenChangeComplete = useCallback((open: boolean) => {
    if (open || folderComposer.open) return;
    folderClosedRef.current = true;
    const afterClose = folderAfterCloseRef.current;
    folderAfterCloseRef.current = null;
    setFolderComposer((state) => state.open ? state : ({ ...state, title: '', source: 'page' }));
    void afterClose?.();
  }, [folderComposer.open, setFolderComposer]);

  const onBookmarkComposerOpenChangeComplete = useCallback((open: boolean) => {
    if (open || bookmarkComposer.open) return;
    bookmarkClosedRef.current = true;
    const afterClose = bookmarkAfterCloseRef.current;
    bookmarkAfterCloseRef.current = null;
    setBookmarkComposer((state) => state.open ? state : ({ ...state, recentOpen: false }));
    void afterClose?.();
  }, [bookmarkComposer.open, setBookmarkComposer]);
  const openFolderComposer = useCallback((
    mode: 'create' | 'edit',
    parentId: string,
    node?: chrome.bookmarks.BookmarkTreeNode,
    source: 'page' | 'move-panel' = 'page',
  ) => {
    bookmarkOpenRequestRef.current += 1;
    folderAfterCloseRef.current = null;
    setActionTarget(null);
    setFolderComposer({
      open: true,
      mode,
      parentId,
      targetId: node?.id,
      title: node ? getDisplayTitle(node) : '',
      position: insertSettingsState.folderPosition,
      source,
    });
  }, [insertSettingsState.folderPosition, setActionTarget, setFolderComposer]);

  const openBookmarkComposer = useCallback(async (
    mode: 'create' | 'edit',
    parentId: string,
    node?: chrome.bookmarks.BookmarkTreeNode,
    preset?: { title: string; url: string },
  ) => {
    const requestId = ++bookmarkOpenRequestRef.current;
    setActionTarget(null);
    const folders = await getRecentFolders();
    if (requestId !== bookmarkOpenRequestRef.current) return;
    bookmarkAfterCloseRef.current = null;
    setRecentFolders(folders);
    setBookmarkComposer({
      open: true,
      mode,
      parentId,
      originalParentId: node?.parentId ?? parentId,
      targetId: node?.id,
      title: preset?.title ?? node?.title ?? '',
      url: preset?.url ?? node?.url ?? '',
      position: insertSettingsState.bookmarkPosition,
      recentOpen: false,
    });
  }, [insertSettingsState.bookmarkPosition, setActionTarget, setBookmarkComposer, setRecentFolders]);

  const saveLaunchTab = useCallback(async (preferredFolderId?: string, useRecentLocation = false) => {
    if (!launchContext?.url || !launchContext.title) return;
    const recentFolderId = useRecentLocation ? (await getRecentFolders())[0]?.id : undefined;
    const targetFolderId = preferredFolderId
      ?? recentFolderId
      ?? (useRecentLocation || currentFolderId === HOME_FOLDER_ID ? await getInitialFolderId() : currentFolderId);
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
  }, [currentFolderId, launchContext, openBookmarkComposer, setLaunchBookmark]);

  const openNodeDetails = useCallback(async (node: chrome.bookmarks.BookmarkTreeNode) => {
    const pathTarget = node.url ? node.parentId ?? HOME_FOLDER_ID : node.id;
    const path = pathTarget === HOME_FOLDER_ID ? '首页' : await safeCall(() => getFolderPath(pathTarget), '');

    setDetailState({
      open: true,
      title: getDisplayTitle(node),
      url: node.url ?? '',
      path,
      kind: node.url ? '书签' : '文件夹',
      meta: node.url ? '' : getBookmarkMeta(node, folderChildCounts[node.id]),
    });
  }, [folderChildCounts, setDetailState]);

  const submitFolder = useCallback(async () => {
    const title = folderComposer.title.trim();
    if (!title) {
      toast('请输入文件夹名称');
      return;
    }

    let savedNode: chrome.bookmarks.BookmarkTreeNode | null = null;
    if (folderComposer.mode === 'create') {
      savedNode = await createFolder(folderComposer.parentId, title, folderComposer.position);
    } else if (folderComposer.targetId) {
      savedNode = await updateBookmarkNode(folderComposer.targetId, { title });
    }

    if (savedNode) onNodeSaved(savedNode);
    await reload(currentFolderId);
    closeFolderComposer(() => {
      if (savedNode) {
        onFolderSaved?.({
          mode: folderComposer.mode,
          source: folderComposer.source ?? 'page',
          node: savedNode,
          parentId: folderComposer.parentId,
        });
      }
    });
  }, [closeFolderComposer, currentFolderId, folderComposer, onFolderSaved, onNodeSaved, reload]);

  const submitBookmark = useCallback(async () => {
    const title = bookmarkComposer.title.trim();
    const url = normalizeUrl(bookmarkComposer.url);

    if (!title || !url) {
      toast('标题和链接都需要填写');
      return;
    }

    let savedNode: chrome.bookmarks.BookmarkTreeNode | null = null;
    if (bookmarkComposer.mode === 'create') {
      savedNode = await createBookmark(bookmarkComposer.parentId, title, url, bookmarkComposer.position);
    } else if (bookmarkComposer.targetId) {
      if (bookmarkComposer.parentId !== bookmarkComposer.originalParentId) {
        await moveNodes([bookmarkComposer.targetId], bookmarkComposer.parentId, insertSettingsState);
      }
      savedNode = await updateBookmarkNode(bookmarkComposer.targetId, { title, url });
    }

    if (savedNode) onNodeSaved(savedNode);
    if (launchContext?.url === url && savedNode) {
      setLaunchBookmark({ ...savedNode, parentId: bookmarkComposer.parentId });
    }
    await reload(currentFolderId);
    closeBookmarkComposer();
  }, [bookmarkComposer, closeBookmarkComposer, currentFolderId, insertSettingsState, launchContext, onNodeSaved, reload, setLaunchBookmark]);

  const bookmarkComposerPath = useMemo(
    () => findFolderPath(folderTree, bookmarkComposer.parentId) || (bookmarkComposer.parentId === HOME_FOLDER_ID ? '首页' : ''),
    [bookmarkComposer.parentId, folderTree],
  );
  const bookmarkComposerFolderName = useMemo(() => {
    if (!bookmarkComposerPath) return '';
    const segments = bookmarkComposerPath.split(' / ').filter(Boolean);
    return segments.at(-1) ?? bookmarkComposerPath;
  }, [bookmarkComposerPath]);

  return {
    openFolderComposer,
    openBookmarkComposer,
    saveLaunchTab,
    openNodeDetails,
    submitFolder,
    submitBookmark,
    closeBookmarkComposer,
    onFolderComposerOpenChangeComplete,
    onBookmarkComposerOpenChangeComplete,
    bookmarkComposerPath,
    bookmarkComposerFolderName,
  };
}

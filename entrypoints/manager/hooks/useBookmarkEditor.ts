import { useCallback, useMemo, type Dispatch, type SetStateAction } from 'react';
import { toast } from 'sonner';

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
  onFolderSaved,
  reload,
}: UseBookmarkEditorParams) {
  const openFolderComposer = useCallback((
    mode: 'create' | 'edit',
    parentId: string,
    node?: chrome.bookmarks.BookmarkTreeNode,
    source: 'page' | 'move-panel' = 'page',
  ) => {
    setActionTarget(null);
    setFolderComposer({
      open: true,
      mode,
      parentId,
      targetId: node?.id,
      title: node ? getDisplayTitle(node) : '',
      source,
    });
  }, [setActionTarget, setFolderComposer]);

  const openBookmarkComposer = useCallback((
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
      recentOpen: false,
    });
    void getRecentFolders().then((folders) => {
      setRecentFolders(folders);
    });
  }, [setActionTarget, setBookmarkComposer, setRecentFolders]);

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
      savedNode = await createFolder(folderComposer.parentId, title, insertSettingsState.folderPosition);
      toast('文件夹已创建', { description: title });
    } else if (folderComposer.targetId) {
      savedNode = await updateBookmarkNode(folderComposer.targetId, { title });
      toast('文件夹已更新', { description: title });
    }

    if (savedNode) {
      onFolderSaved?.({
        mode: folderComposer.mode,
        source: folderComposer.source ?? 'page',
        node: savedNode,
        parentId: folderComposer.parentId,
      });
    }

    setFolderComposer((state) => ({ ...state, open: false, title: '', source: 'page' }));
    await reload(currentFolderId);
  }, [currentFolderId, folderComposer, insertSettingsState.folderPosition, onFolderSaved, reload, setFolderComposer]);

  const submitBookmark = useCallback(async () => {
    const title = bookmarkComposer.title.trim();
    const url = normalizeUrl(bookmarkComposer.url);

    if (!title || !url) {
      toast('标题和链接都需要填写');
      return;
    }

    let savedNode: chrome.bookmarks.BookmarkTreeNode | null = null;
    if (bookmarkComposer.mode === 'create') {
      savedNode = await createBookmark(bookmarkComposer.parentId, title, url, insertSettingsState.bookmarkPosition);
      toast('书签已创建', { description: title });
    } else if (bookmarkComposer.targetId) {
      if (bookmarkComposer.parentId !== bookmarkComposer.originalParentId) {
        await moveNodes([bookmarkComposer.targetId], bookmarkComposer.parentId, insertSettingsState);
      }
      savedNode = await updateBookmarkNode(bookmarkComposer.targetId, { title, url });
      toast('书签已更新', { description: title });
    }

    if (launchContext?.url === url && savedNode) {
      setLaunchBookmark({ ...savedNode, parentId: bookmarkComposer.parentId });
    }

    setBookmarkComposer((state) => ({
      ...state,
      open: false,
      recentOpen: false,
    }));
    await reload(currentFolderId);
  }, [bookmarkComposer, currentFolderId, insertSettingsState, launchContext, reload, setBookmarkComposer, setLaunchBookmark]);

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
    bookmarkComposerPath,
    bookmarkComposerFolderName,
  };
}

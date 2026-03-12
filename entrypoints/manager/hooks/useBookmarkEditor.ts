import { useCallback, useMemo, type Dispatch, type SetStateAction } from 'react';
import { toast } from 'sonner';

import {
  createBookmark,
  createFolder,
  getDisplayTitle,
  getFolderPath,
  getInitialFolderId,
  moveNodes,
  normalizeUrl,
  updateBookmarkNode,
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
  reload,
}: UseBookmarkEditorParams) {
  const openFolderComposer = useCallback((mode: 'create' | 'edit', parentId: string, node?: chrome.bookmarks.BookmarkTreeNode) => {
    setActionTarget(null);
    setFolderComposer({
      open: true,
      mode,
      parentId,
      targetId: node?.id,
      title: node ? getDisplayTitle(node) : '',
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
    });
  }, [setActionTarget, setBookmarkComposer]);

  const saveLaunchTab = useCallback(async () => {
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
  }, [currentFolderId, launchContext, openBookmarkComposer, setLaunchBookmark]);

  const openNodeDetails = useCallback(async (node: chrome.bookmarks.BookmarkTreeNode) => {
    const pathTarget = node.url ? node.parentId ?? HOME_FOLDER_ID : node.id;
    const path = pathTarget === HOME_FOLDER_ID ? '首页' : await safeCall(() => getFolderPath(pathTarget), '');

    setDetailState({
      open: true,
      title: getDisplayTitle(node),
      url: node.url ?? '',
      path,
      meta: node.url ? '书签' : getBookmarkMeta(node, folderChildCounts[node.id]),
    });
  }, [folderChildCounts, setDetailState]);

  const submitFolder = useCallback(async () => {
    const title = folderComposer.title.trim();
    if (!title) {
      toast('请输入文件夹名称');
      return;
    }

    if (folderComposer.mode === 'create') {
      await createFolder(folderComposer.parentId, title, insertSettingsState.folderPosition);
      toast('文件夹已创建');
    } else if (folderComposer.targetId) {
      await updateBookmarkNode(folderComposer.targetId, { title });
      toast('文件夹已更新');
    }

    setFolderComposer((state) => ({ ...state, open: false, title: '' }));
    await reload(currentFolderId);
  }, [currentFolderId, folderComposer, insertSettingsState.folderPosition, reload, setFolderComposer]);

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
      toast('书签已创建');
    } else if (bookmarkComposer.targetId) {
      if (bookmarkComposer.parentId !== bookmarkComposer.originalParentId) {
        await moveNodes([bookmarkComposer.targetId], bookmarkComposer.parentId, insertSettingsState);
      }
      savedNode = await updateBookmarkNode(bookmarkComposer.targetId, { title, url });
      toast('书签已更新');
    }

    if (launchContext?.url === url && savedNode) {
      setLaunchBookmark({ ...savedNode, parentId: bookmarkComposer.parentId });
    }

    setBookmarkComposer((state) => ({ ...state, open: false, title: '', url: '', originalParentId: state.parentId }));
    await reload(currentFolderId);
  }, [bookmarkComposer, currentFolderId, insertSettingsState, launchContext, reload, setBookmarkComposer, setLaunchBookmark]);

  const bookmarkComposerPath = useMemo(
    () => findFolderPath(folderTree, bookmarkComposer.parentId) || (bookmarkComposer.parentId === HOME_FOLDER_ID ? '首页' : ''),
    [bookmarkComposer.parentId, folderTree],
  );

  return {
    openFolderComposer,
    openBookmarkComposer,
    saveLaunchTab,
    openNodeDetails,
    submitFolder,
    submitBookmark,
    bookmarkComposerPath,
  };
}

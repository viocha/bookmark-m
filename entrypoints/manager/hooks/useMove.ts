import { useCallback, useMemo, type Dispatch, type SetStateAction } from 'react';
import { toast } from 'sonner';

import { moveNodes, type FolderTreeNode, type InsertSettings } from '@/lib/bookmark-service';

import type { BookmarkComposerState, MoveState } from '../types';
import { filterFolderTree } from '../utils';

type UseMoveParams = {
  breadcrumbs: chrome.bookmarks.BookmarkTreeNode[];
  currentFolderId: string;
  folderTree: FolderTreeNode[];
  expandedMoveFolderIds: string[];
  setExpandedMoveFolderIds: Dispatch<SetStateAction<string[]>>;
  setActionTarget: Dispatch<SetStateAction<chrome.bookmarks.BookmarkTreeNode | null>>;
  moveState: MoveState;
  setMoveState: Dispatch<SetStateAction<MoveState>>;
  insertSettingsState: InsertSettings;
  setBookmarkComposer: Dispatch<SetStateAction<BookmarkComposerState>>;
  setMoveActionTarget: Dispatch<SetStateAction<FolderTreeNode | null>>;
  setMoveMenuDirection: Dispatch<SetStateAction<'up' | 'down'>>;
  setMoveMenuAnchor: Dispatch<SetStateAction<{ top: number; bottom: number; right: number } | null>>;
  resetSelection: () => void;
  reload: (preferredFolderId?: string) => Promise<void>;
};

export function useMove({
  breadcrumbs,
  currentFolderId,
  folderTree,
  expandedMoveFolderIds,
  setExpandedMoveFolderIds,
  setActionTarget,
  moveState,
  setMoveState,
  insertSettingsState,
  setBookmarkComposer,
  setMoveActionTarget,
  setMoveMenuDirection,
  setMoveMenuAnchor,
  resetSelection,
  reload,
}: UseMoveParams) {
  const openMoveDialog = useCallback((ids: string[]) => {
    setActionTarget(null);
    setExpandedMoveFolderIds((prev) => Array.from(new Set([...prev, ...breadcrumbs.map((node) => node.id), ...folderTree.map((node) => node.id)])));
    setMoveState({
      open: true,
      mode: 'move',
      ids,
      query: '',
      targetFolderId: currentFolderId,
    });
  }, [breadcrumbs, currentFolderId, folderTree, setActionTarget, setExpandedMoveFolderIds, setMoveState]);

  const submitMove = useCallback(async () => {
    if (moveState.mode === 'pick-bookmark-parent') {
      setBookmarkComposer((state) => ({ ...state, open: true, parentId: moveState.targetFolderId }));
      setMoveState({ open: false, mode: 'move', ids: [], query: '', targetFolderId: currentFolderId });
      return;
    }

    if (moveState.ids.length === 0) return;
    await moveNodes(moveState.ids, moveState.targetFolderId, insertSettingsState);
    toast('已移动');
    resetSelection();
    setMoveState({ open: false, mode: 'move', ids: [], query: '', targetFolderId: currentFolderId });
    await reload(moveState.targetFolderId);
  }, [currentFolderId, insertSettingsState, moveState, reload, resetSelection, setBookmarkComposer, setMoveState]);

  const filteredFolderTree = useMemo(() => filterFolderTree(folderTree, moveState.query), [folderTree, moveState.query]);

  const moveTreeExpandedIds = useMemo(() => {
    if (!moveState.query.trim()) return expandedMoveFolderIds;

    const collectIds = (nodes: FolderTreeNode[]): string[] =>
      nodes.flatMap((node) => [node.id, ...collectIds(node.children)]);

    return collectIds(filteredFolderTree);
  }, [expandedMoveFolderIds, filteredFolderTree, moveState.query]);

  const toggleMoveFolderExpanded = useCallback((folderId: string) => {
    setExpandedMoveFolderIds((prev) => (prev.includes(folderId) ? prev.filter((id) => id !== folderId) : [...prev, folderId]));
  }, [setExpandedMoveFolderIds]);

  const toggleMoveActionMenu = useCallback((folder: FolderTreeNode, button: HTMLElement) => {
    const rect = button.getBoundingClientRect();
    setMoveMenuDirection(window.innerHeight - rect.bottom < 180 ? 'up' : 'down');
    setMoveActionTarget((current) => {
      if (current?.id === folder.id) {
        setMoveMenuAnchor(null);
        return null;
      }

      setMoveMenuAnchor({
        top: rect.bottom + 4,
        bottom: window.innerHeight - rect.top + 4,
        right: window.innerWidth - rect.right,
      });
      return folder;
    });
  }, [setMoveActionTarget, setMoveMenuAnchor, setMoveMenuDirection]);

  return {
    openMoveDialog,
    submitMove,
    filteredFolderTree,
    moveTreeExpandedIds,
    toggleMoveFolderExpanded,
    toggleMoveActionMenu,
  };
}

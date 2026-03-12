export type FolderComposerState = {
  open: boolean;
  mode: 'create' | 'edit';
  parentId: string;
  targetId?: string;
  title: string;
  source?: 'page' | 'move-panel';
};

export type BookmarkComposerState = {
  open: boolean;
  mode: 'create' | 'edit';
  parentId: string;
  originalParentId?: string;
  targetId?: string;
  title: string;
  url: string;
  recentOpen: boolean;
};

export type MoveState = {
  open: boolean;
  mode: 'move' | 'pick-bookmark-parent';
  ids: string[];
  query: string;
  targetFolderId: string;
};

export type DetailState = {
  open: boolean;
  title: string;
  url: string;
  path: string;
  kind: string;
  meta: string;
};

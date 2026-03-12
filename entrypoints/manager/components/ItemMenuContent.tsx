import { Bookmark, ChevronRight, ChevronsDown, ChevronsUp, Copy, FolderPlus, Info, Link2, MoveRight, Pencil, Play, Trash2 } from 'lucide-react';

import { isProtectedNode } from '@/lib/bookmark-service';

type ItemMenuContentProps = {
  node: chrome.bookmarks.BookmarkTreeNode;
  deferredSearch: boolean;
  currentFolderId: string;
  displayMode: 'list' | 'tree';
  compact: boolean;
  hasLaunchContext: boolean;
  hasLaunchBookmark: boolean;
  onClose: () => void;
  onShowLocation: (node: chrome.bookmarks.BookmarkTreeNode) => void;
  onCopyUrl: (url: string) => void;
  onOpenDetails: (node: chrome.bookmarks.BookmarkTreeNode) => void;
  onEditBookmark: (node: chrome.bookmarks.BookmarkTreeNode, parentId: string) => void;
  onOpenAll: (id: string) => void;
  onCreateFolder: (parentId: string) => void;
  onCreateBookmark: (parentId: string) => void;
  onSaveLaunchToFolder: (parentId: string) => void;
  onExpandFolderRecursively: (node: chrome.bookmarks.BookmarkTreeNode) => void;
  onCollapseFolderRecursively: (node: chrome.bookmarks.BookmarkTreeNode) => void;
  onRenameFolder: (node: chrome.bookmarks.BookmarkTreeNode, parentId: string) => void;
  onMove: (id: string) => void;
  onDelete: (id: string) => void;
};

export function ItemMenuContent({
  node,
  deferredSearch,
  currentFolderId,
  displayMode,
  compact,
  hasLaunchContext,
  hasLaunchBookmark,
  onClose,
  onShowLocation,
  onCopyUrl,
  onOpenDetails,
  onEditBookmark,
  onOpenAll,
  onCreateFolder,
  onCreateBookmark,
  onSaveLaunchToFolder,
  onExpandFolderRecursively,
  onCollapseFolderRecursively,
  onRenameFolder,
  onMove,
  onDelete,
}: ItemMenuContentProps) {
  const protectedNode = isProtectedNode(node.id);
  const compactMenu = compact;
  const menuButtonClass = compactMenu
    ? 'flex h-7 w-full touch-manipulation items-center gap-1 rounded-lg px-2 text-left text-[11px] font-medium'
    : 'flex h-8 w-full touch-manipulation items-center gap-1.5 rounded-xl px-2.5 text-left text-xs font-medium';
  const menuIconClass = compactMenu ? 'size-3.5' : 'size-4';

  if (node.url) {
    return (
      <>
        {deferredSearch && node.parentId ? (
          <button type="button" onClick={() => onShowLocation(node)} className={menuButtonClass}>
            <ChevronRight className={menuIconClass} />
            显示位置
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => {
            onClose();
            onCopyUrl(node.url!);
          }}
          className={menuButtonClass}
        >
          <Copy className={menuIconClass} />
          复制链接
        </button>
        <button
          type="button"
          onClick={() => {
            onClose();
            onEditBookmark(node, node.parentId ?? currentFolderId);
          }}
          className={menuButtonClass}
        >
          <Pencil className={menuIconClass} />
          编辑书签
        </button>
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenDetails(node);
          }}
          className={menuButtonClass}
        >
          <Info className={menuIconClass} />
          查看详情
        </button>
        <button
          type="button"
          onClick={() => {
            onClose();
            onMove(node.id);
          }}
          className={menuButtonClass}
        >
          <MoveRight className={menuIconClass} />
          移动
        </button>
        <button type="button" onClick={() => onDelete(node.id)} className={`${menuButtonClass} text-destructive`}>
          <Trash2 className={menuIconClass} />
          删除
        </button>
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          onClose();
          onOpenAll(node.id);
        }}
        className={menuButtonClass}
      >
        <Play className={menuIconClass} />
        打开全部
      </button>
      {deferredSearch && node.parentId ? (
        <button type="button" onClick={() => onShowLocation(node)} className={menuButtonClass}>
          <ChevronRight className={menuIconClass} />
          显示位置
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => {
          onClose();
          onCreateFolder(node.id);
        }}
        className={menuButtonClass}
        >
          <FolderPlus className={menuIconClass} />
          新建文件夹
        </button>
      <button
        type="button"
        onClick={() => {
          onClose();
          onCreateBookmark(node.id);
        }}
        className={menuButtonClass}
        >
          <Link2 className={menuIconClass} />
          添加书签
        </button>
      {hasLaunchContext ? (
        <button
          type="button"
          onClick={() => {
            onClose();
            onSaveLaunchToFolder(node.id);
          }}
          className={menuButtonClass}
        >
          <Bookmark className={menuIconClass} />
          {hasLaunchBookmark ? '编辑当前页面' : '添加当前页面'}
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => {
          onClose();
          onOpenDetails(node);
        }}
        className={menuButtonClass}
        >
          <Info className={menuIconClass} />
          查看详情
        </button>
      {displayMode === 'tree' ? (
        <button
          type="button"
          onClick={() => {
            onClose();
            onExpandFolderRecursively(node);
          }}
          className={menuButtonClass}
        >
          <ChevronsDown className={menuIconClass} />
          递归展开
        </button>
      ) : null}
      {displayMode === 'tree' ? (
        <button
          type="button"
          onClick={() => {
            onClose();
            onCollapseFolderRecursively(node);
          }}
          className={menuButtonClass}
        >
          <ChevronsUp className={menuIconClass} />
          递归折叠
        </button>
      ) : null}
      {!protectedNode ? (
        <button
          type="button"
          onClick={() => {
            onClose();
            onRenameFolder(node, node.parentId ?? currentFolderId);
          }}
          className={menuButtonClass}
        >
          <Pencil className={menuIconClass} />
          重命名
        </button>
      ) : null}
      {!protectedNode ? (
        <button
          type="button"
          onClick={() => {
            onClose();
            onMove(node.id);
          }}
          className={menuButtonClass}
        >
          <MoveRight className={menuIconClass} />
          移动
        </button>
      ) : null}
      {!protectedNode ? (
        <button type="button" onClick={() => onDelete(node.id)} className={`${menuButtonClass} text-destructive`}>
          <Trash2 className={menuIconClass} />
          删除
        </button>
      ) : null}
    </>
  );
}

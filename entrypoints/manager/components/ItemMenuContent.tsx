import { ChevronRight, Copy, FolderPlus, Info, Link2, MoveRight, Pencil, Play, Trash2 } from 'lucide-react';

import { isProtectedNode } from '@/lib/bookmark-service';

type ItemMenuContentProps = {
  node: chrome.bookmarks.BookmarkTreeNode;
  deferredSearch: boolean;
  currentFolderId: string;
  displayMode: 'list' | 'tree';
  onClose: () => void;
  onShowLocation: (node: chrome.bookmarks.BookmarkTreeNode) => void;
  onCopyUrl: (url: string) => void;
  onOpenDetails: (node: chrome.bookmarks.BookmarkTreeNode) => void;
  onEditBookmark: (node: chrome.bookmarks.BookmarkTreeNode, parentId: string) => void;
  onOpenAll: (id: string) => void;
  onCreateFolder: (parentId: string) => void;
  onCreateBookmark: (parentId: string) => void;
  onRenameFolder: (node: chrome.bookmarks.BookmarkTreeNode, parentId: string) => void;
  onMove: (id: string) => void;
  onDelete: (id: string) => void;
};

export function ItemMenuContent({
  node,
  deferredSearch,
  currentFolderId,
  displayMode,
  onClose,
  onShowLocation,
  onCopyUrl,
  onOpenDetails,
  onEditBookmark,
  onOpenAll,
  onCreateFolder,
  onCreateBookmark,
  onRenameFolder,
  onMove,
  onDelete,
}: ItemMenuContentProps) {
  const protectedNode = isProtectedNode(node.id);
  const menuButtonClass = 'flex h-8 w-full items-center gap-1.5 rounded-xl px-2.5 text-left text-xs font-medium';

  if (node.url) {
    return (
      <>
        {deferredSearch && node.parentId ? (
          <button type="button" onClick={() => onShowLocation(node)} className={menuButtonClass}>
            <ChevronRight className="size-4" />
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
          <Copy className="size-4" />
          复制链接
        </button>
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenDetails(node);
          }}
          className={menuButtonClass}
        >
          <Info className="size-4" />
          查看详情
        </button>
        <button
          type="button"
          onClick={() => {
            onClose();
            onEditBookmark(node, node.parentId ?? currentFolderId);
          }}
          className={menuButtonClass}
        >
          <Pencil className="size-4" />
          编辑书签
        </button>
        <button
          type="button"
          onClick={() => {
            onClose();
            onMove(node.id);
          }}
          className={menuButtonClass}
        >
          <MoveRight className="size-4" />
          移动
        </button>
        <button type="button" onClick={() => onDelete(node.id)} className={`${menuButtonClass} text-destructive`}>
          <Trash2 className="size-4" />
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
        <Play className="size-4" />
        打开全部
      </button>
      {deferredSearch && node.parentId ? (
        <button type="button" onClick={() => onShowLocation(node)} className={menuButtonClass}>
          <ChevronRight className="size-4" />
          显示位置
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
        <Info className="size-4" />
        查看详情
      </button>
      <button
        type="button"
        onClick={() => {
          onClose();
          onCreateFolder(node.id);
        }}
        className={menuButtonClass}
      >
        <FolderPlus className="size-4" />
        新建子文件夹
      </button>
      <button
        type="button"
        onClick={() => {
          onClose();
          onCreateBookmark(node.id);
        }}
        className={menuButtonClass}
      >
        <Link2 className="size-4" />
        添加书签
      </button>
      {!protectedNode ? (
        <button
          type="button"
          onClick={() => {
            onClose();
            onRenameFolder(node, node.parentId ?? currentFolderId);
          }}
          className={menuButtonClass}
        >
          <Pencil className="size-4" />
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
          <MoveRight className="size-4" />
          移动
        </button>
      ) : null}
      {!protectedNode ? (
        <button type="button" onClick={() => onDelete(node.id)} className={`${menuButtonClass} text-destructive`}>
          <Trash2 className="size-4" />
          删除
        </button>
      ) : null}
    </>
  );
}

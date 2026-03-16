import { Bookmark, ChevronRight, ChevronsDown, ChevronsUp, Copy, FolderPlus, Info, Link2, MoveRight, Pencil, Play, Trash2 } from 'lucide-react';

import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
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
    ? 'h-7 rounded-lg px-2 text-[11px] font-medium'
    : 'h-8 rounded-xl px-2.5 text-xs font-medium';
  const menuIconClass = compactMenu ? 'size-3.5' : 'size-4';

  if (node.url) {
    return (
      <>
        {deferredSearch && node.parentId ? (
          <DropdownMenuItem onSelect={() => onShowLocation(node)} className={menuButtonClass}>
            <ChevronRight className={menuIconClass} />
            显示位置
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          onSelect={() => {
            onClose();
            onCopyUrl(node.url!);
          }}
          className={menuButtonClass}
        >
          <Copy className={menuIconClass} />
          复制链接
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            onClose();
            onEditBookmark(node, node.parentId ?? currentFolderId);
          }}
          className={menuButtonClass}
        >
          <Pencil className={menuIconClass} />
          编辑书签
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            onClose();
            onOpenDetails(node);
          }}
          className={menuButtonClass}
        >
          <Info className={menuIconClass} />
          查看详情
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            onClose();
            onMove(node.id);
          }}
          className={menuButtonClass}
        >
          <MoveRight className={menuIconClass} />
          移动
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onDelete(node.id)} variant="destructive" className={menuButtonClass}>
          <Trash2 className={menuIconClass} />
          删除
        </DropdownMenuItem>
      </>
    );
  }

  return (
    <>
      <DropdownMenuItem
        onSelect={() => {
          onClose();
          onOpenAll(node.id);
        }}
        className={menuButtonClass}
      >
        <Play className={menuIconClass} />
        打开全部
      </DropdownMenuItem>
      {deferredSearch && node.parentId ? (
        <DropdownMenuItem onSelect={() => onShowLocation(node)} className={menuButtonClass}>
          <ChevronRight className={menuIconClass} />
          显示位置
        </DropdownMenuItem>
      ) : null}
      <DropdownMenuItem
        onSelect={() => {
          onClose();
          onCreateFolder(node.id);
        }}
        className={menuButtonClass}
      >
        <FolderPlus className={menuIconClass} />
        新建文件夹
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={() => {
          onClose();
          onCreateBookmark(node.id);
        }}
        className={menuButtonClass}
      >
        <Link2 className={menuIconClass} />
        添加书签
      </DropdownMenuItem>
      {hasLaunchContext ? (
        <DropdownMenuItem
          onSelect={() => {
            onClose();
            onSaveLaunchToFolder(node.id);
          }}
          className={menuButtonClass}
        >
          <Bookmark className={menuIconClass} />
          {hasLaunchBookmark ? '编辑当前页面' : '添加当前页面'}
        </DropdownMenuItem>
      ) : null}
      <DropdownMenuItem
        onSelect={() => {
          onClose();
          onOpenDetails(node);
        }}
        className={menuButtonClass}
      >
        <Info className={menuIconClass} />
        查看详情
      </DropdownMenuItem>
      {displayMode === 'tree' ? (
        <DropdownMenuItem
          onSelect={() => {
            onClose();
            onExpandFolderRecursively(node);
          }}
          className={menuButtonClass}
        >
          <ChevronsDown className={menuIconClass} />
          递归展开
        </DropdownMenuItem>
      ) : null}
      {displayMode === 'tree' ? (
        <DropdownMenuItem
          onSelect={() => {
            onClose();
            onCollapseFolderRecursively(node);
          }}
          className={menuButtonClass}
        >
          <ChevronsUp className={menuIconClass} />
          递归折叠
        </DropdownMenuItem>
      ) : null}
      {!protectedNode ? (
        <DropdownMenuItem
          onSelect={() => {
            onClose();
            onRenameFolder(node, node.parentId ?? currentFolderId);
          }}
          className={menuButtonClass}
        >
          <Pencil className={menuIconClass} />
          重命名
        </DropdownMenuItem>
      ) : null}
      {!protectedNode ? (
        <DropdownMenuItem
          onSelect={() => {
            onClose();
            onMove(node.id);
          }}
          className={menuButtonClass}
        >
          <MoveRight className={menuIconClass} />
          移动
        </DropdownMenuItem>
      ) : null}
      {!protectedNode ? (
        <DropdownMenuItem onSelect={() => onDelete(node.id)} variant="destructive" className={menuButtonClass}>
          <Trash2 className={menuIconClass} />
          删除
        </DropdownMenuItem>
      ) : null}
    </>
  );
}

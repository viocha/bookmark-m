import { ArrowUpToLine, Bookmark, ChevronRight, Copy, FilePenLine, FolderPlus, Info, Move, Pencil, Play, SquareMinus, SquarePlus, Star, Trash2 } from 'lucide-react';

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
  onClose: (afterClose?: () => void) => void;
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
  onMoveToTop: (node: chrome.bookmarks.BookmarkTreeNode) => void;
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
  onMoveToTop,
  onDelete,
}: ItemMenuContentProps) {
  const protectedNode = isProtectedNode(node.id);
  const compactMenu = compact;
  const menuButtonClass = compactMenu
    ? 'h-7 rounded-lg px-2 text-[11px] font-medium'
    : 'h-8 rounded-md px-2.5 text-xs font-medium';
  const menuIconClass = compactMenu ? 'size-3.5' : 'size-4';

  if (node.url) {
    return (
      <>
        {deferredSearch && node.parentId ? (
          <DropdownMenuItem onClick={() => onShowLocation(node)} className={menuButtonClass}>
            <ChevronRight className={menuIconClass} />
            显示位置
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          onClick={() => {
            onClose();
            onCopyUrl(node.url!);
          }}
          className={menuButtonClass}
        >
          <Copy className={menuIconClass} />
          复制链接
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            onClose();
            onEditBookmark(node, node.parentId ?? currentFolderId);
          }}
          className={menuButtonClass}
        >
          <Pencil className={menuIconClass} />
          编辑书签
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            onClose();
            onOpenDetails(node);
          }}
          className={menuButtonClass}
        >
          <Info className={menuIconClass} />
          查看详情
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            onClose();
            onMove(node.id);
          }}
          className={menuButtonClass}
        >
          <Move className={menuIconClass} />
          移动
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            onClose(() => onMoveToTop(node));
          }}
          disabled={!node.parentId}
          className={menuButtonClass}
        >
          <ArrowUpToLine className={menuIconClass} />
          移动到顶部
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDelete(node.id)} variant="destructive" className={menuButtonClass}>
          <Trash2 className={menuIconClass} />
          删除
        </DropdownMenuItem>
      </>
    );
  }

  return (
    <>
      <DropdownMenuItem
        onClick={() => {
          onClose();
          onOpenAll(node.id);
        }}
        className={menuButtonClass}
      >
        <Play className={menuIconClass} />
        打开全部
      </DropdownMenuItem>
      {deferredSearch && node.parentId ? (
        <DropdownMenuItem onClick={() => onShowLocation(node)} className={menuButtonClass}>
          <ChevronRight className={menuIconClass} />
          显示位置
        </DropdownMenuItem>
      ) : null}
      {displayMode === 'tree' ? (
        <>
          <DropdownMenuItem
            onClick={() => {
              onClose();
              onCreateFolder(node.id);
            }}
            className={menuButtonClass}
          >
            <FolderPlus className={menuIconClass} />
            新建文件夹
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              onClose();
              onCreateBookmark(node.id);
            }}
            className={menuButtonClass}
          >
            <Bookmark className={menuIconClass} />
            添加书签
          </DropdownMenuItem>
          {hasLaunchContext ? (
            <DropdownMenuItem
              onClick={() => {
                onClose();
                onSaveLaunchToFolder(node.id);
              }}
              className={menuButtonClass}
            >
              {hasLaunchBookmark ? <FilePenLine className={menuIconClass} /> : <Star className={menuIconClass} />}
              {hasLaunchBookmark ? '编辑当前页面' : '添加当前页面'}
            </DropdownMenuItem>
          ) : null}
        </>
      ) : null}
      <DropdownMenuItem
        onClick={() => {
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
          onClick={() => {
            onClose();
            onExpandFolderRecursively(node);
          }}
          className={menuButtonClass}
        >
          <SquarePlus className={menuIconClass} />
          递归展开
        </DropdownMenuItem>
      ) : null}
      {displayMode === 'tree' ? (
        <DropdownMenuItem
          onClick={() => {
            onClose();
            onCollapseFolderRecursively(node);
          }}
          className={menuButtonClass}
        >
          <SquareMinus className={menuIconClass} />
          递归折叠
        </DropdownMenuItem>
      ) : null}
      {!protectedNode ? (
        <DropdownMenuItem
          onClick={() => {
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
          onClick={() => {
            onClose();
            onMove(node.id);
          }}
          className={menuButtonClass}
        >
          <Move className={menuIconClass} />
          移动
        </DropdownMenuItem>
      ) : null}
      {!protectedNode ? (
        <DropdownMenuItem onClick={() => onDelete(node.id)} variant="destructive" className={menuButtonClass}>
          <Trash2 className={menuIconClass} />
          删除
        </DropdownMenuItem>
      ) : null}
    </>
  );
}

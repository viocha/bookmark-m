import type { RecentFolder } from '@/lib/bookmark-service';
import type { BookmarkComposerState, DetailState, FolderComposerState } from '../types';
import { BookmarkComposerDialog } from './BookmarkComposerDialog';
import { DetailsDialog } from './DetailsDialog';
import { FolderComposerDialog } from './FolderComposerDialog';

type BookmarkEditorDialogsProps = {
  folderComposer: FolderComposerState;
  onFolderComposerOpenChange: (open: boolean) => void;
  onFolderComposerTitleChange: (title: string) => void;
  onSubmitFolder: () => void;
  bookmarkComposer: BookmarkComposerState;
  bookmarkComposerFolderName: string;
  recentFolders: RecentFolder[];
  onBookmarkComposerOpenChange: (open: boolean) => void;
  onBookmarkComposerPickParent: () => void;
  onBookmarkComposerToggleRecentFolders: () => void;
  onBookmarkComposerPickRecentFolder: (folderId: string) => void;
  onBookmarkComposerTitleChange: (title: string) => void;
  onBookmarkComposerUrlChange: (url: string) => void;
  onBookmarkComposerRevealLocation: () => void;
  onBookmarkComposerDelete: () => void;
  onSubmitBookmark: () => void;
  detailState: DetailState;
  onDetailOpenChange: (open: boolean) => void;
};

export function BookmarkEditorDialogs({
  folderComposer,
  onFolderComposerOpenChange,
  onFolderComposerTitleChange,
  onSubmitFolder,
  bookmarkComposer,
  bookmarkComposerFolderName,
  recentFolders,
  onBookmarkComposerOpenChange,
  onBookmarkComposerPickParent,
  onBookmarkComposerToggleRecentFolders,
  onBookmarkComposerPickRecentFolder,
  onBookmarkComposerTitleChange,
  onBookmarkComposerUrlChange,
  onBookmarkComposerRevealLocation,
  onBookmarkComposerDelete,
  onSubmitBookmark,
  detailState,
  onDetailOpenChange,
}: BookmarkEditorDialogsProps) {
  return (
    <>
      <FolderComposerDialog
        state={folderComposer}
        onOpenChange={onFolderComposerOpenChange}
        onTitleChange={onFolderComposerTitleChange}
        onSubmit={onSubmitFolder}
      />

      <BookmarkComposerDialog
        state={bookmarkComposer}
        folderLabel={bookmarkComposerFolderName}
        recentFolders={recentFolders}
        onOpenChange={onBookmarkComposerOpenChange}
        onPickParent={onBookmarkComposerPickParent}
        onToggleRecentFolders={onBookmarkComposerToggleRecentFolders}
        onPickRecentFolder={onBookmarkComposerPickRecentFolder}
        onTitleChange={onBookmarkComposerTitleChange}
        onUrlChange={onBookmarkComposerUrlChange}
        onRevealLocation={onBookmarkComposerRevealLocation}
        onDelete={onBookmarkComposerDelete}
        onSubmit={onSubmitBookmark}
      />

      <DetailsDialog state={detailState} onOpenChange={onDetailOpenChange} />
    </>
  );
}

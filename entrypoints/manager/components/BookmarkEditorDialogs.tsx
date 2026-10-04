import type { InsertPosition, RecentFolder } from '@/lib/bookmark-service';
import type { BookmarkComposerState, DetailState, FolderComposerState } from '../types';
import { BookmarkComposerDialog } from './BookmarkComposerDialog';
import { DetailsDialog } from './DetailsDialog';
import { FolderComposerDialog } from './FolderComposerDialog';

type BookmarkEditorDialogsProps = {
  folderComposer: FolderComposerState;
  onFolderComposerOpenChange: (open: boolean) => void;
  onFolderComposerOpenChangeComplete: (open: boolean) => void;
  onFolderComposerTitleChange: (title: string) => void;
  onFolderComposerPositionChange: (position: InsertPosition) => void;
  onSubmitFolder: () => void;
  bookmarkComposer: BookmarkComposerState;
  bookmarkComposerFolderName: string;
  recentFolders: RecentFolder[];
  onBookmarkComposerOpenChange: (open: boolean) => void;
  onBookmarkComposerOpenChangeComplete: (open: boolean) => void;
  onBookmarkComposerPickParent: () => void;
  onBookmarkComposerRecentOpenChange: (open: boolean) => void;
  onBookmarkComposerPickRecentFolder: (folderId: string) => void;
  onBookmarkComposerTitleChange: (title: string) => void;
  onBookmarkComposerUrlChange: (url: string) => void;
  onBookmarkComposerPositionChange: (position: InsertPosition) => void;
  onBookmarkComposerRevealLocation: () => void;
  onBookmarkComposerDelete: () => void;
  onSubmitBookmark: () => void;
  detailState: DetailState;
  onDetailOpenChange: (open: boolean) => void;
};

export function BookmarkEditorDialogs({
  folderComposer,
  onFolderComposerOpenChange,
  onFolderComposerOpenChangeComplete,
  onFolderComposerTitleChange,
  onFolderComposerPositionChange,
  onSubmitFolder,
  bookmarkComposer,
  bookmarkComposerFolderName,
  recentFolders,
  onBookmarkComposerOpenChange,
  onBookmarkComposerOpenChangeComplete,
  onBookmarkComposerPickParent,
  onBookmarkComposerRecentOpenChange,
  onBookmarkComposerPickRecentFolder,
  onBookmarkComposerTitleChange,
  onBookmarkComposerUrlChange,
  onBookmarkComposerPositionChange,
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
        onOpenChangeComplete={onFolderComposerOpenChangeComplete}
        onTitleChange={onFolderComposerTitleChange}
        onPositionChange={onFolderComposerPositionChange}
        onSubmit={onSubmitFolder}
      />

      <BookmarkComposerDialog
        state={bookmarkComposer}
        folderLabel={bookmarkComposerFolderName}
        recentFolders={recentFolders}
        onOpenChange={onBookmarkComposerOpenChange}
        onOpenChangeComplete={onBookmarkComposerOpenChangeComplete}
        onPickParent={onBookmarkComposerPickParent}
        onRecentOpenChange={onBookmarkComposerRecentOpenChange}
        onPickRecentFolder={onBookmarkComposerPickRecentFolder}
        onTitleChange={onBookmarkComposerTitleChange}
        onUrlChange={onBookmarkComposerUrlChange}
        onPositionChange={onBookmarkComposerPositionChange}
        onRevealLocation={onBookmarkComposerRevealLocation}
        onDelete={onBookmarkComposerDelete}
        onSubmit={onSubmitBookmark}
      />

      <DetailsDialog state={detailState} onOpenChange={onDetailOpenChange} />
    </>
  );
}

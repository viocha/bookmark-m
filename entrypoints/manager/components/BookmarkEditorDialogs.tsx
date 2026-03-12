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
  bookmarkComposerPath: string;
  onBookmarkComposerOpenChange: (open: boolean) => void;
  onBookmarkComposerPickParent: () => void;
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
  bookmarkComposerPath,
  onBookmarkComposerOpenChange,
  onBookmarkComposerPickParent,
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
        pathLabel={bookmarkComposerPath}
        onOpenChange={onBookmarkComposerOpenChange}
        onPickParent={onBookmarkComposerPickParent}
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

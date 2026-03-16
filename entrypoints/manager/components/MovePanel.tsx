import type { FolderTreeNode } from '@/lib/bookmark-service';

import type { MoveState } from '../types';
import { MoveFolderTree } from './MoveFolderTree';
import { MovePanelLayout } from './MovePanelLayout';

type MovePanelProps = {
  moveState: MoveState;
  filteredFolderTree: FolderTreeNode[];
  moveTreeExpandedIds: string[];
  onMoveClose: () => void;
  onSubmitMove: () => void;
  onMoveQueryChange: (query: string) => void;
  onToggleMoveExpanded: (folderId: string) => void;
  onMoveSelectTarget: (folder: FolderTreeNode) => void;
  onMoveCreateFolder: (folder: FolderTreeNode) => void;
  onMoveRenameFolder: (folder: FolderTreeNode) => void;
  onMoveDeleteFolder: (folder: FolderTreeNode) => void;
};

export function MovePanel({
  moveState,
  filteredFolderTree,
  moveTreeExpandedIds,
  onMoveClose,
  onSubmitMove,
  onMoveQueryChange,
  onToggleMoveExpanded,
  onMoveSelectTarget,
  onMoveCreateFolder,
  onMoveRenameFolder,
  onMoveDeleteFolder,
}: MovePanelProps) {
  return (
    <MovePanelLayout state={moveState} onClose={onMoveClose} onSubmit={onSubmitMove} onQueryChange={onMoveQueryChange}>
      {filteredFolderTree.length > 0 ? (
        <MoveFolderTree
          nodes={filteredFolderTree}
          expandedIds={moveTreeExpandedIds}
          targetFolderId={moveState.targetFolderId}
          movingIds={moveState.ids}
          onToggleExpanded={onToggleMoveExpanded}
          onSelectTarget={onMoveSelectTarget}
          onCreateFolder={onMoveCreateFolder}
          onRenameFolder={onMoveRenameFolder}
          onDeleteFolder={onMoveDeleteFolder}
        />
      ) : (
        <div className="px-3 py-6 text-center text-sm text-muted-foreground">没有找到匹配的文件夹。</div>
      )}
    </MovePanelLayout>
  );
}

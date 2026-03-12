import type { FolderTreeNode } from '@/lib/bookmark-service';

import type { MoveState } from '../types';
import { MoveFolderTree } from './MoveFolderTree';
import { MovePanelLayout } from './MovePanelLayout';

type MovePanelProps = {
  moveState: MoveState;
  filteredFolderTree: FolderTreeNode[];
  moveTreeExpandedIds: string[];
  moveActionTargetId?: string;
  moveMenuDirection: 'up' | 'down';
  onMoveClose: () => void;
  onSubmitMove: () => void;
  onMoveQueryChange: (query: string) => void;
  onToggleMoveExpanded: (folderId: string) => void;
  onMoveSelectTarget: (folder: FolderTreeNode) => void;
  onToggleMoveActionMenu: (folder: FolderTreeNode, button: HTMLElement) => void;
  onMoveCreateFolder: (folder: FolderTreeNode) => void;
  onMoveRenameFolder: (folder: FolderTreeNode) => void;
  onMoveDeleteFolder: (folder: FolderTreeNode) => void;
};

export function MovePanel({
  moveState,
  filteredFolderTree,
  moveTreeExpandedIds,
  moveActionTargetId,
  moveMenuDirection,
  onMoveClose,
  onSubmitMove,
  onMoveQueryChange,
  onToggleMoveExpanded,
  onMoveSelectTarget,
  onToggleMoveActionMenu,
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
          actionTargetId={moveActionTargetId}
          menuDirection={moveMenuDirection}
          onToggleExpanded={onToggleMoveExpanded}
          onSelectTarget={onMoveSelectTarget}
          onToggleActionMenu={onToggleMoveActionMenu}
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

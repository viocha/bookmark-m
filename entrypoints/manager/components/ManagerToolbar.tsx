import { HeaderToolsMenu } from './HeaderToolsMenu';
import { ManagerHeader } from './ManagerHeader';
import { SelectionToolbar } from './SelectionToolbar';
import type { BookmarkDisplayMode, LaunchContext } from '@/lib/bookmark-service';

type ManagerToolbarProps = {
  toolsMenuRef: React.RefObject<HTMLDivElement | null>;
  pageTitle: string;
  searchOpen: boolean;
  deferredSearch: string;
  searchQuery: string;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  toolsButtonRef: React.RefObject<HTMLButtonElement | null>;
  selectionMode: boolean;
  selectedCount: number;
  hasLaunchContext: boolean;
  hasLaunchBookmark: boolean;
  launchContext: LaunchContext | null;
  toolsOpen: boolean;
  displayMode: BookmarkDisplayMode;
  toolsDisabledOnHome: boolean;
  selectableCount: number;
  canCreateInCurrentFolder: boolean;
  toolsMenuAnchor: { top: number; right: number } | null;
  onSearchChange: (value: string) => void;
  onCloseSearch: () => void;
  onOpenSearch: () => void;
  onReload: () => void;
  onToggleTools: () => void;
  onOpenSelected: () => void;
  onMoveSelected: () => void;
  onDeleteSelected: () => void;
  onCloseSelection: () => void;
  onCloseTools: () => void;
  onSwitchMode: (mode: BookmarkDisplayMode) => void;
  onOpenSettings: () => void;
  onSaveLaunch: () => void;
  onSelectMode: () => void;
  onCreateFolder: () => void;
  onCreateBookmark: () => void;
};

export function ManagerToolbar({
  toolsMenuRef,
  pageTitle,
  searchOpen,
  deferredSearch,
  searchQuery,
  searchInputRef,
  toolsButtonRef,
  selectionMode,
  selectedCount,
  hasLaunchContext,
  hasLaunchBookmark,
  launchContext,
  toolsOpen,
  displayMode,
  toolsDisabledOnHome,
  selectableCount,
  canCreateInCurrentFolder,
  toolsMenuAnchor,
  onSearchChange,
  onCloseSearch,
  onOpenSearch,
  onReload,
  onToggleTools,
  onOpenSelected,
  onMoveSelected,
  onDeleteSelected,
  onCloseSelection,
  onCloseTools,
  onSwitchMode,
  onOpenSettings,
  onSaveLaunch,
  onSelectMode,
  onCreateFolder,
  onCreateBookmark,
}: ManagerToolbarProps) {
  return (
    <div ref={toolsMenuRef}>
      <ManagerHeader
        pageTitle={pageTitle}
        searchOpen={searchOpen}
        deferredSearch={deferredSearch}
        searchQuery={searchQuery}
        searchInputRef={searchInputRef}
        toolsButtonRef={toolsButtonRef}
        toolsOpen={toolsOpen}
        onSearchChange={onSearchChange}
        onCloseSearch={onCloseSearch}
        onOpenSearch={onOpenSearch}
        onReload={onReload}
        onToggleTools={onToggleTools}
        selectionToolbar={
          selectionMode ? (
            <SelectionToolbar
              count={selectedCount}
              onOpenAll={onOpenSelected}
              onMove={onMoveSelected}
              onDelete={onDeleteSelected}
              onClose={onCloseSelection}
            />
          ) : undefined
        }
        toolsMenu={
          <HeaderToolsMenu
            open={toolsOpen}
            displayMode={displayMode}
            hasLaunchContext={hasLaunchContext}
            hasLaunchBookmark={hasLaunchBookmark}
            launchContext={launchContext}
            toolsDisabledOnHome={toolsDisabledOnHome}
            selectableCount={selectableCount}
            searching={Boolean(deferredSearch)}
            canCreateInCurrentFolder={canCreateInCurrentFolder}
            menuAnchor={toolsMenuAnchor}
            onClose={onCloseTools}
            onSwitchMode={onSwitchMode}
            onOpenSettings={onOpenSettings}
            onSaveLaunch={onSaveLaunch}
            onSelectMode={onSelectMode}
            onCreateFolder={onCreateFolder}
            onCreateBookmark={onCreateBookmark}
          />
        }
      />
    </div>
  );
}

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
  selectionMode: boolean;
  selectedCount: number;
  hasLaunchContext: boolean;
  hasLaunchBookmark: boolean;
  launchContext: LaunchContext | null;
  displayMode: BookmarkDisplayMode;
  toolsDisabledOnHome: boolean;
  selectableCount: number;
  canCreateInCurrentFolder: boolean;
  onSearchChange: (value: string) => void;
  onCloseSearch: () => void;
  onOpenSearch: () => void;
  onReload: () => void;
  onOpenSelected: () => void;
  onMoveSelected: () => void;
  onDeleteSelected: () => void;
  onCloseSelection: () => void;
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
  selectionMode,
  selectedCount,
  hasLaunchContext,
  hasLaunchBookmark,
  launchContext,
  displayMode,
  toolsDisabledOnHome,
  selectableCount,
  canCreateInCurrentFolder,
  onSearchChange,
  onCloseSearch,
  onOpenSearch,
  onReload,
  onOpenSelected,
  onMoveSelected,
  onDeleteSelected,
  onCloseSelection,
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
        onSearchChange={onSearchChange}
        onCloseSearch={onCloseSearch}
        onOpenSearch={onOpenSearch}
        onReload={onReload}
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
            displayMode={displayMode}
            hasLaunchContext={hasLaunchContext}
            hasLaunchBookmark={hasLaunchBookmark}
            launchContext={launchContext}
            toolsDisabledOnHome={toolsDisabledOnHome}
            selectableCount={selectableCount}
            searching={Boolean(deferredSearch)}
            canCreateInCurrentFolder={canCreateInCurrentFolder}
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

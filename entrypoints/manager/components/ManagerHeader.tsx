import { MoreHorizontal, RefreshCw, Search, X } from 'lucide-react';
import type { RefObject } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ManagerHeaderProps = {
  pageTitle: string;
  searchOpen: boolean;
  deferredSearch: string;
  searchQuery: string;
  searchInputRef: RefObject<HTMLInputElement | null>;
  toolsButtonRef: RefObject<HTMLButtonElement | null>;
  toolsOpen: boolean;
  onSearchChange: (value: string) => void;
  onCloseSearch: () => void;
  onOpenSearch: () => void;
  onReload: () => void;
  onToggleTools: () => void;
  selectionToolbar?: React.ReactNode;
  toolsMenu?: React.ReactNode;
};

export function ManagerHeader({
  pageTitle,
  searchOpen,
  deferredSearch,
  searchQuery,
  searchInputRef,
  toolsButtonRef,
  toolsOpen,
  onSearchChange,
  onCloseSearch,
  onOpenSearch,
  onReload,
  onToggleTools,
  selectionToolbar,
  toolsMenu,
}: ManagerHeaderProps) {
  return (
    <header className="relative z-30 shrink-0 overflow-visible border-b border-border/70 bg-background/92 backdrop-blur">
      <div className="px-3 py-2">
        <div className="flex items-center gap-2">
          {searchOpen || deferredSearch ? (
            <div className="flex min-w-0 flex-1 items-center gap-1 rounded-full border border-border bg-white/92 px-2">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="搜索书签"
                className="h-7 min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-sm leading-none outline-none"
              />
              <button
                type="button"
                onClick={onCloseSearch}
                className="inline-flex size-5 shrink-0 touch-manipulation items-center justify-center rounded-full bg-secondary text-secondary-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <div className="min-w-0 flex-1 truncate text-sm font-semibold">{pageTitle}</div>
          )}

          {!searchOpen && !deferredSearch ? (
            <Button variant="outline" size="icon" className="size-8 rounded-full" onClick={onOpenSearch}>
              <Search className="size-4" />
            </Button>
          ) : null}

          <Button variant="outline" size="icon" className="size-8 rounded-full" onClick={onReload}>
            <RefreshCw className="size-4" />
          </Button>

          <Button
            ref={toolsButtonRef}
            variant="outline"
            size="icon"
            className={cn('size-8 rounded-full', toolsOpen && 'bg-muted/60 text-foreground')}
            onClick={onToggleTools}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </div>

        {selectionToolbar}
      </div>

      {toolsMenu}
    </header>
  );
}

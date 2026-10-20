import { RefreshCw, Search, X } from 'lucide-react';
import { useRef, useState, type RefObject } from 'react';

import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { cn } from '@/lib/utils';

type ManagerHeaderProps = {
  pageTitle: string;
  searchOpen: boolean;
  deferredSearch: string;
  searchQuery: string;
  searchInputRef: RefObject<HTMLInputElement | null>;
  onSearchChange: (value: string) => void;
  onCloseSearch: () => void;
  onOpenSearch: () => void;
  onReload: () => Promise<void>;
  selectionToolbar?: React.ReactNode;
  toolsMenu?: React.ReactNode;
};

export function ManagerHeader({
  pageTitle,
  searchOpen,
  deferredSearch,
  searchQuery,
  searchInputRef,
  onSearchChange,
  onCloseSearch,
  onOpenSearch,
  onReload,
  selectionToolbar,
  toolsMenu,
}: ManagerHeaderProps) {
  const [refreshing, setRefreshing] = useState(false);
  const refreshPendingRef = useRef(false);
  const refresh = async () => {
    if (refreshPendingRef.current) return;
    refreshPendingRef.current = true;
    setRefreshing(true);
    try {
      await onReload();
    } finally {
      refreshPendingRef.current = false;
      setRefreshing(false);
    }
  };

  return (
    <header className="relative z-30 shrink-0 overflow-visible border-b border-border/70 bg-background/92 backdrop-blur">
      <div className="px-3 py-2">
        <div className="flex items-center gap-2">
          {searchOpen || deferredSearch ? (
            <InputGroup className="min-w-0 flex-1 rounded-full">
              <InputGroupAddon><Search /></InputGroupAddon>
              <InputGroupInput
                ref={searchInputRef}
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="搜索书签"
                aria-label="搜索书签"
              />
              <InputGroupAddon align="inline-end" className="pr-1.5 has-[>button]:mr-0">
              <InputGroupButton
                type="button"
                variant="secondary"
                size="icon-xs"
                aria-label="关闭搜索"
                onClick={onCloseSearch}
                className="size-5 touch-manipulation rounded-full"
              >
                <X />
              </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          ) : (
            <div className="min-w-0 flex-1 truncate text-sm font-semibold">{pageTitle}</div>
          )}

          {!searchOpen && !deferredSearch ? (
            <Button variant="outline" size="icon" className="size-8 rounded-full" onClick={onOpenSearch}>
              <Search className="size-4" />
            </Button>
          ) : null}

          <Button variant="outline" size="icon" className="size-8 rounded-full" onClick={refresh} disabled={refreshing} aria-label="刷新" aria-busy={refreshing}>
            <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} />
          </Button>

          {toolsMenu}
        </div>

        {selectionToolbar}
      </div>
    </header>
  );
}

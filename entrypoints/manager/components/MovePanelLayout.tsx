import { Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

import type { MoveState } from '../types';

type MovePanelLayoutProps = {
  state: MoveState;
  onClose: () => void;
  onSubmit: () => void;
  onQueryChange: (query: string) => void;
  children: React.ReactNode;
};

export function MovePanelLayout({ state, onClose, onSubmit, onQueryChange, children }: MovePanelLayoutProps) {
  if (!state.open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-background/98 backdrop-blur">
      <div className="flex items-center gap-2 border-b border-border/70 px-3 py-2">
        <Button variant="outline" size="icon" className="size-8 rounded-full" onClick={onClose}>
          <X className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">移动到文件夹</div>
        </div>
        <Button className="h-8 rounded-full px-3 text-sm" onClick={onSubmit}>
          {state.mode === 'pick-bookmark-parent' ? '选择' : '确认'}
        </Button>
      </div>

      <div className="px-3 py-2">
        <div className="flex items-center gap-1 rounded-full border border-border bg-white/92 px-2">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            value={state.query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="搜索目标文件夹"
            className="h-8 min-w-0 rounded-none border-0 bg-transparent px-0 py-0 text-sm shadow-none focus:border-0 focus:ring-0"
          />
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-1 px-2 pb-4">{children}</div>
      </ScrollArea>
    </div>
  );
}

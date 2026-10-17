import { Search, X } from 'lucide-react';
import type { Ref } from 'react';

import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Field, FieldLabel } from '@/components/ui/field';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import type { MoveState } from '../types';

type MovePanelLayoutProps = {
  containerRef: Ref<HTMLDivElement>;
  state: MoveState;
  onClose: () => void;
  onSubmit: () => void;
  onQueryChange: (query: string) => void;
  onPositionChange: (position: MoveState['position']) => void;
  children: React.ReactNode;
};

export function MovePanelLayout({ containerRef, state, onClose, onSubmit, onQueryChange, onPositionChange, children }: MovePanelLayoutProps) {
  if (!state.open) return null;

  return (
    <div ref={containerRef} data-move-panel className="fixed inset-0 z-50 flex flex-col bg-background/98 backdrop-blur">
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
        <InputGroup className="rounded-full">
          <InputGroupAddon><Search /></InputGroupAddon>
          <InputGroupInput
            value={state.query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="搜索目标文件夹"
            aria-label="搜索目标文件夹"
          />
        </InputGroup>
      </div>

      {state.mode === 'move' ? (
        <Field className="px-3 pb-2">
          <FieldLabel>移动到</FieldLabel>
          <ToggleGroup
            aria-label="本次移动位置"
            variant="outline"
            value={[state.position ?? 'top']}
            onValueChange={(values) => {
              const value = values[0];
              if (value === 'top' || value === 'bottom') onPositionChange(value);
            }}
            className="grid w-full grid-cols-2"
          >
            <ToggleGroupItem value="top">顶部</ToggleGroupItem>
            <ToggleGroupItem value="bottom">底部</ToggleGroupItem>
          </ToggleGroup>
        </Field>
      ) : null}

      <ScrollArea className="flex min-h-0 flex-1 flex-col [&>[data-slot='scroll-area-viewport']]:min-h-0">
        <div className="flex flex-col gap-1 px-2 pb-4">{children}</div>
      </ScrollArea>
    </div>
  );
}

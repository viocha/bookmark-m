import { ChevronRight, History, Trash2 } from 'lucide-react';
import { useCallback, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Field, FieldGroup } from '@/components/ui/field';
import { InputGroup, InputGroupTextarea } from '@/components/ui/input-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { InsertPosition, RecentFolder } from '@/lib/bookmark-service';

import type { BookmarkComposerState } from '../types';
import { InsertPositionPicker } from './InsertPositionPicker';

type BookmarkComposerDialogProps = {
  state: BookmarkComposerState;
  folderLabel: string;
  recentFolders: RecentFolder[];
  onOpenChange: (open: boolean) => void;
  onOpenChangeComplete: (open: boolean) => void;
  onPickParent: () => void;
  onRecentOpenChange: (open: boolean) => void;
  onPickRecentFolder: (folderId: string) => void;
  onTitleChange: (title: string) => void;
  onUrlChange: (url: string) => void;
  onPositionChange: (position: InsertPosition) => void;
  onRevealLocation: () => void;
  onDelete: () => void;
  onSubmit: () => void;
};

export function BookmarkComposerDialog({
  state,
  folderLabel,
  recentFolders,
  onOpenChange,
  onOpenChangeComplete,
  onPickParent,
  onRecentOpenChange,
  onPickRecentFolder,
  onTitleChange,
  onUrlChange,
  onPositionChange,
  onRevealLocation,
  onDelete,
  onSubmit,
}: BookmarkComposerDialogProps) {
  const titleRef = useRef<HTMLTextAreaElement | null>(null);
  const initializeTextarea = useCallback((textarea: HTMLTextAreaElement | null) => {
    if (!textarea || !state.open) return;
    textarea.setSelectionRange(0, 0);
    textarea.scrollTop = 0;
    textarea.scrollLeft = 0;
    const viewport = textarea.closest('[data-slot="scroll-area-viewport"]');
    if (viewport) {
      viewport.scrollTop = 0;
      viewport.scrollLeft = 0;
    }
  }, [state.open]);
  const initializeTitle = useCallback((textarea: HTMLTextAreaElement | null) => {
    titleRef.current = textarea;
    initializeTextarea(textarea);
  }, [initializeTextarea]);
  const focusTitle = useCallback(() => {
    titleRef.current?.focus({ preventScroll: true });
    initializeTextarea(titleRef.current);
    return false;
  }, [initializeTextarea]);

  return (
    <Dialog open={state.open} onOpenChange={onOpenChange} onOpenChangeComplete={onOpenChangeComplete}>
      <DialogContent
        initialFocus={state.mode === 'edit' ? focusTitle : undefined}
        aria-describedby={undefined}
        className="flex max-h-[calc(var(--app-height)-2rem)] flex-col p-4"
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>{state.mode === 'create' ? '添加书签' : '编辑书签'}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex min-h-0 flex-1 flex-col [&>[data-slot=scroll-area-viewport]]:min-h-0">
          <div className="flex flex-col gap-3 p-1">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onPickParent}
                className="h-auto w-full justify-between rounded-md px-3 py-2 text-left"
              >
                <div className="min-w-0">
                  <div className="text-[11px] text-muted-foreground">保存位置</div>
                  <div className="truncate text-sm font-medium">{folderLabel || '选择文件夹'}</div>
                </div>
                <ChevronRight data-icon="inline-end" />
              </Button>
              <DropdownMenu open={state.recentOpen} onOpenChange={onRecentOpenChange}>
                <DropdownMenuTrigger render={<Button variant="outline" />} className="h-auto justify-between rounded-md px-3 py-2 text-left">
                    <div>
                      <div className="text-[11px] text-muted-foreground">最近位置</div>
                      <div className="text-sm font-medium">{recentFolders.length > 0 ? `${recentFolders.length} 个` : '暂无'}</div>
                    </div>
                    <History data-icon="inline-end" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  data-recent-folder-menu
                  align="end"
                  side="bottom"
                  className="z-[280] max-h-52 min-w-40 p-1"
                >
                  {recentFolders.length > 0 ? (
                    <DropdownMenuGroup>
                      {recentFolders.map((folder) => (
                        <DropdownMenuItem
                          key={folder.id}
                          onClick={() => onPickRecentFolder(folder.id)}
                          className="flex-col items-start gap-0.5 px-2 py-1.5"
                        >
                          <span className="w-full truncate text-[13px] font-medium">{folder.title}</span>
                          <span className="w-full truncate text-[11px] text-muted-foreground">{folder.path}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  ) : (
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="text-muted-foreground">暂无最近位置</DropdownMenuLabel>
                    </DropdownMenuGroup>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <FieldGroup className="gap-3">
              <Field>
                <InputGroup className="h-auto text-base md:text-sm">
                  <ScrollArea className="h-[calc(2lh+1rem)] w-full rounded-[inherit] [&_[data-slot=scroll-area-viewport]]:overscroll-contain">
                    <InputGroupTextarea
                      ref={initializeTitle}
                      rows={2}
                      className="min-h-[calc(2lh+1rem)] overflow-hidden"
                      aria-label="标题"
                      autoFocus={state.mode === 'create'}
                      value={state.title}
                      onFocus={(event) => {
                        if (state.mode !== 'create') return;

                        const input = event.currentTarget;
                        input.setSelectionRange(0, input.value.length, 'backward');
                        input.scrollTop = 0;
                        input.scrollLeft = 0;
                        const viewport = input.closest('[data-slot="scroll-area-viewport"]');
                        if (viewport) viewport.scrollTop = 0;
                      }}
                      onChange={(event) => onTitleChange(event.target.value)}
                      placeholder="标题"
                    />
                  </ScrollArea>
                </InputGroup>
              </Field>
              <Field>
                <InputGroup className="h-auto text-base md:text-sm">
                  <ScrollArea className="h-[calc(3lh+1rem)] w-full rounded-[inherit] [&_[data-slot=scroll-area-viewport]]:overscroll-contain">
                    <InputGroupTextarea
                      ref={initializeTextarea}
                      rows={3}
                      className="min-h-[calc(3lh+1rem)] overflow-hidden break-all"
                      aria-label="URL"
                      value={state.url}
                      onChange={(event) => onUrlChange(event.target.value)}
                      placeholder="example.com"
                      inputMode="url"
                      autoCapitalize="none"
                      spellCheck={false}
                    />
                  </ScrollArea>
                </InputGroup>
              </Field>
            </FieldGroup>
            {state.mode === 'create' ? <InsertPositionPicker value={state.position} onChange={onPositionChange} /> : null}
            {state.mode === 'edit' && state.targetId ? (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onRevealLocation}
                  className="h-10 rounded-md"
                >
                  <ChevronRight data-icon="inline-start" />
                  显示所在位置
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onDelete}
                  className="h-10 rounded-md"
                >
                  <Trash2 data-icon="inline-start" />
                  删除
                </Button>
              </div>
            ) : null}
          </div>
        </ScrollArea>
        <Button className="h-10 w-full shrink-0 rounded-md" onClick={onSubmit}>
          保存
        </Button>
      </DialogContent>
    </Dialog>
  );
}

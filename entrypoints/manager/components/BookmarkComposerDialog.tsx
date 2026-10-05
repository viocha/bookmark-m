import { ChevronRight, History, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
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
  return (
    <Dialog open={state.open} onOpenChange={onOpenChange} onOpenChangeComplete={onOpenChangeComplete}>
      <DialogContent
        aria-describedby={undefined}
        className="flex flex-col p-4"
      >
        <DialogHeader>
          <DialogTitle>{state.mode === 'create' ? '添加书签' : '编辑书签'}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-3 p-1">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onPickParent}
                className="flex w-full items-center justify-between rounded-md border bg-muted/50 px-3 py-2 text-left"
              >
                <div className="min-w-0">
                  <div className="text-[11px] text-muted-foreground">保存位置</div>
                  <div className="truncate text-sm font-medium">{folderLabel || '选择文件夹'}</div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </button>
              <DropdownMenu modal={false} open={state.recentOpen} onOpenChange={onRecentOpenChange}>
                <DropdownMenuTrigger render={<button type="button" />} className="flex cursor-pointer items-center justify-between rounded-md border bg-background px-3 py-2 text-left">
                    <div>
                      <div className="text-[11px] text-muted-foreground">最近位置</div>
                      <div className="text-sm font-medium">{recentFolders.length > 0 ? `${recentFolders.length} 个` : '暂无'}</div>
                    </div>
                    <History className="size-4 text-muted-foreground" />
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
                    <DropdownMenuLabel className="text-muted-foreground">暂无最近位置</DropdownMenuLabel>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Input
              autoFocus={state.mode === 'create'}
              value={state.title}
              onFocus={(event) => {
                if (state.mode !== 'create') return;

                const input = event.currentTarget;
                input.setSelectionRange(0, input.value.length, 'backward');
                input.scrollLeft = 0;
              }}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="标题"
            />
            <Input value={state.url} onChange={(event) => onUrlChange(event.target.value)} placeholder="example.com" />
            {state.mode === 'create' ? <InsertPositionPicker value={state.position} onChange={onPositionChange} /> : null}
            {state.mode === 'edit' && state.targetId ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onRevealLocation}
                  className="flex h-10 items-center justify-center gap-1.5 rounded-md border bg-muted/50 px-3 text-sm font-medium active:bg-muted"
                >
                  <ChevronRight className="size-4" />
                  显示所在位置
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  className="flex h-10 items-center justify-center gap-1.5 rounded-md border border-destructive/25 bg-destructive/8 px-3 text-sm font-medium text-destructive active:bg-destructive/12"
                >
                  <Trash2 className="size-4" />
                  删除
                </button>
              </div>
            ) : null}
          </div>
        </ScrollArea>
        <Button className="h-10 w-full rounded-md" onClick={onSubmit}>
          保存
        </Button>
      </DialogContent>
    </Dialog>
  );
}

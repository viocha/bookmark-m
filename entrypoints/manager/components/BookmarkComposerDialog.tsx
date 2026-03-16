import { ChevronRight, History, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAnimatedOpenState } from '@/hooks/useAnimatedOpenState';
import type { RecentFolder } from '@/lib/bookmark-service';

import type { BookmarkComposerState } from '../types';

function selectInputText(input: HTMLInputElement) {
  input.setSelectionRange(0, input.value.length);
  window.requestAnimationFrame(() => {
    input.scrollLeft = 0;
  });
}

type BookmarkComposerDialogProps = {
  state: BookmarkComposerState;
  folderLabel: string;
  recentFolders: RecentFolder[];
  onOpenChange: (open: boolean) => void;
  onPickParent: () => void;
  onToggleRecentFolders: () => void;
  onPickRecentFolder: (folderId: string) => void;
  onTitleChange: (title: string) => void;
  onUrlChange: (url: string) => void;
  onRevealLocation: () => void;
  onDelete: () => void;
  onSubmit: () => void;
};

export function BookmarkComposerDialog({
  state,
  folderLabel,
  recentFolders,
  onOpenChange,
  onPickParent,
  onToggleRecentFolders,
  onPickRecentFolder,
  onTitleChange,
  onUrlChange,
  onRevealLocation,
  onDelete,
  onSubmit,
}: BookmarkComposerDialogProps) {
  const { present: recentPresent, state: recentState } = useAnimatedOpenState(state.recentOpen);

  return (
    <Dialog open={state.open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[1.5rem] p-4">
        <DialogHeader>
          <DialogTitle>{state.mode === 'create' ? '添加书签' : '编辑书签'}</DialogTitle>
          <DialogDescription>
            {state.mode === 'create' ? '填写标题和网址后保存。' : '修改书签信息后保存。'}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onPickParent}
              className="flex w-full items-center justify-between rounded-xl border bg-muted/35 px-3 py-2 text-left"
            >
              <div className="min-w-0">
                <div className="text-[11px] text-muted-foreground">保存位置</div>
                <div className="truncate text-sm font-medium">{folderLabel || '选择文件夹'}</div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
            <button
              type="button"
              onClick={onToggleRecentFolders}
              className="flex items-center justify-between rounded-xl border bg-muted/35 px-3 py-2 text-left"
            >
              <div>
                <div className="text-[11px] text-muted-foreground">最近位置</div>
                <div className="text-sm font-medium">{recentFolders.length > 0 ? `${recentFolders.length} 个` : '暂无'}</div>
              </div>
              <History className="size-4 text-muted-foreground" />
            </button>
          </div>
          {recentPresent ? (
            <div
              data-state={recentState}
              className="overflow-hidden rounded-xl border bg-muted/10 duration-150 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-top-2 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-2"
            >
              {recentFolders.length > 0 ? (
                <div className="max-h-52 overflow-y-auto">
                  <div className="divide-y">
                    {recentFolders.map((folder) => (
                      <button
                        key={folder.id}
                        type="button"
                        onClick={() => onPickRecentFolder(folder.id)}
                        className="flex w-full touch-manipulation flex-col items-start px-3 py-1.5 text-left active:bg-muted"
                      >
                        <span className="block w-full truncate text-[13px] font-medium">{folder.title}</span>
                        <span className="block w-full truncate text-[11px] text-muted-foreground">{folder.path}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="px-3 py-4 text-sm text-muted-foreground">还没有最近位置。</div>
              )}
            </div>
          ) : null}
          <Input
            autoFocus
            value={state.title}
            onFocus={(event) => selectInputText(event.currentTarget)}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="标题"
          />
          <Input value={state.url} onChange={(event) => onUrlChange(event.target.value)} placeholder="example.com" />
          {state.mode === 'edit' && state.targetId ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onRevealLocation}
                className="flex h-10 items-center justify-center gap-1.5 rounded-xl border bg-muted/35 px-3 text-sm font-medium active:bg-muted"
              >
                <ChevronRight className="size-4" />
                显示所在位置
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-destructive/25 bg-destructive/8 px-3 text-sm font-medium text-destructive active:bg-destructive/12"
              >
                <Trash2 className="size-4" />
                删除
              </button>
            </div>
          ) : null}
          <Button className="h-10 w-full rounded-xl" onClick={onSubmit}>
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { ChevronRight, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

import type { BookmarkComposerState } from '../types';

type BookmarkComposerDialogProps = {
  state: BookmarkComposerState;
  pathLabel: string;
  onOpenChange: (open: boolean) => void;
  onPickParent: () => void;
  onTitleChange: (title: string) => void;
  onUrlChange: (url: string) => void;
  onRevealLocation: () => void;
  onDelete: () => void;
  onSubmit: () => void;
};

export function BookmarkComposerDialog({
  state,
  pathLabel,
  onOpenChange,
  onPickParent,
  onTitleChange,
  onUrlChange,
  onRevealLocation,
  onDelete,
  onSubmit,
}: BookmarkComposerDialogProps) {
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
          <button
            type="button"
            onClick={onPickParent}
            className="flex w-full items-center justify-between rounded-xl border bg-muted/35 px-3 py-2 text-left"
          >
            <div className="min-w-0">
              <div className="text-[11px] text-muted-foreground">保存位置</div>
              <div className="truncate text-sm font-medium">{pathLabel || '选择文件夹'}</div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
          <Input autoFocus value={state.title} onChange={(event) => onTitleChange(event.target.value)} placeholder="标题" />
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

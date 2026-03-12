import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

import type { FolderComposerState } from '../types';

type FolderComposerDialogProps = {
  state: FolderComposerState;
  onOpenChange: (open: boolean) => void;
  onTitleChange: (title: string) => void;
  onSubmit: () => void;
};

export function FolderComposerDialog({
  state,
  onOpenChange,
  onTitleChange,
  onSubmit,
}: FolderComposerDialogProps) {
  return (
    <Dialog open={state.open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[1.5rem] p-4">
        <DialogHeader>
          <DialogTitle>{state.mode === 'create' ? '新建文件夹' : '重命名文件夹'}</DialogTitle>
          <DialogDescription>
            {state.mode === 'create' ? '输入文件夹名称并保存。' : '修改当前文件夹名称并保存。'}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-3">
          <Input autoFocus value={state.title} onChange={(event) => onTitleChange(event.target.value)} placeholder="文件夹名称" />
          <Button className="h-10 w-full rounded-xl" onClick={onSubmit}>
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

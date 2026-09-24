import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { InsertPosition } from '@/lib/bookmark-service';

import type { FolderComposerState } from '../types';
import { InsertPositionPicker } from './InsertPositionPicker';

type FolderComposerDialogProps = {
  state: FolderComposerState;
  onOpenChange: (open: boolean) => void;
  onTitleChange: (title: string) => void;
  onPositionChange: (position: InsertPosition) => void;
  onSubmit: () => void;
};

export function FolderComposerDialog({
  state,
  onOpenChange,
  onTitleChange,
  onPositionChange,
  onSubmit,
}: FolderComposerDialogProps) {
  return (
    <Dialog open={state.open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="rounded-md p-4">
        <DialogHeader>
          <DialogTitle>{state.mode === 'create' ? '新建文件夹' : '重命名文件夹'}</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-3">
          <Input
            autoFocus
            value={state.title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="文件夹名称"
          />
          {state.mode === 'create' ? <InsertPositionPicker value={state.position} onChange={onPositionChange} /> : null}
          <Button className="h-10 w-full rounded-md" onClick={onSubmit}>
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

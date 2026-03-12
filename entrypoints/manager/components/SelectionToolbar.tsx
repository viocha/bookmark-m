import { MoveRight, Play, Trash2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

type SelectionToolbarProps = {
  count: number;
  onOpenAll: () => void;
  onMove: () => void;
  onDelete: () => void;
  onClose: () => void;
};

export function SelectionToolbar({ count, onOpenAll, onMove, onDelete, onClose }: SelectionToolbarProps) {
  return (
    <div className="mt-2 flex items-center gap-2 rounded-2xl border bg-white/88 px-3 py-2 shadow-sm">
      <div className="min-w-0 flex-1 text-sm font-semibold">{count} 项已选中</div>
      <Button variant="outline" size="sm" className="h-8 rounded-xl" disabled={count === 0} onClick={onOpenAll}>
        <Play className="size-4" />
        打开全部
      </Button>
      <Button variant="outline" size="sm" className="h-8 rounded-xl" disabled={count === 0} onClick={onMove}>
        <MoveRight className="size-4" />
        移动
      </Button>
      <Button variant="destructive" size="sm" className="h-8 rounded-xl" disabled={count === 0} onClick={onDelete}>
        <Trash2 className="size-4" />
        删除
      </Button>
      <Button variant="ghost" size="icon" className="size-8 rounded-xl" onClick={onClose}>
        <X className="size-4" />
      </Button>
    </div>
  );
}

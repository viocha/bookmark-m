import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import type { DetailState } from '../types';

type DetailsDialogProps = {
  state: DetailState;
  onOpenChange: (open: boolean) => void;
};

export function DetailsDialog({ state, onOpenChange }: DetailsDialogProps) {
  return (
    <Dialog open={state.open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[1.5rem] p-4">
        <DialogHeader>
          <DialogTitle>查看详情</DialogTitle>
          <DialogDescription>完整信息</DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-3 text-xs leading-5 text-muted-foreground">
          <div className="space-y-1">
            <div className="text-[11px] uppercase tracking-wide">名称</div>
            <div className="whitespace-pre-wrap break-all text-foreground">{state.title || '未命名'}</div>
          </div>
          {state.url ? (
            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-wide">URL</div>
              <div className="whitespace-pre-wrap break-all text-foreground">{state.url}</div>
            </div>
          ) : null}
          <div className="space-y-1">
            <div className="text-[11px] uppercase tracking-wide">位置</div>
            <div className="whitespace-pre-wrap break-all text-foreground">{state.path || '首页'}</div>
          </div>
          <div className="space-y-1">
            <div className="text-[11px] uppercase tracking-wide">类型</div>
            <div className="whitespace-pre-wrap break-all text-foreground">{state.meta}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

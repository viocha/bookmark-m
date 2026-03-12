import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { InsertSettings, ViewSettings } from '@/lib/bookmark-service';

type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: InsertSettings;
  viewSettings: ViewSettings;
  onChange: (settings: InsertSettings) => void;
  onViewChange: (settings: ViewSettings) => void;
  normalizing: boolean;
  onNormalize: () => void;
};

export function SettingsDialog({
  open,
  onOpenChange,
  settings,
  viewSettings,
  onChange,
  onViewChange,
  normalizing,
  onNormalize,
}: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="rounded-[1.5rem] p-4">
        <DialogHeader>
          <DialogTitle>全局设置</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">列表模式返回键</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: false, label: '关闭' },
                { value: true, label: '逐层返回' },
              ].map((option) => (
                <button
                  key={`list-back-navigation-${String(option.value)}`}
                  type="button"
                  onClick={() => onViewChange({ ...viewSettings, listBackNavigation: option.value })}
                  className={cn(
                    'flex h-9 items-center justify-center rounded-xl border text-sm active:bg-muted',
                    viewSettings.listBackNavigation === option.value && 'border-primary bg-primary/8 text-primary',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">列表模式密度</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: false, label: '正常' },
                { value: true, label: '紧凑' },
              ].map((option) => (
                <button
                  key={`list-compact-${String(option.value)}`}
                  type="button"
                  onClick={() => onViewChange({ ...viewSettings, listCompact: option.value })}
                  className={cn(
                    'flex h-9 items-center justify-center rounded-xl border text-sm active:bg-muted',
                    viewSettings.listCompact === option.value && 'border-primary bg-primary/8 text-primary',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">树形模式密度</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: false, label: '正常' },
                { value: true, label: '紧凑' },
              ].map((option) => (
                <button
                  key={`tree-compact-${String(option.value)}`}
                  type="button"
                  onClick={() => onViewChange({ ...viewSettings, treeCompact: option.value })}
                  className={cn(
                    'flex h-9 items-center justify-center rounded-xl border text-sm active:bg-muted',
                    viewSettings.treeCompact === option.value && 'border-primary bg-primary/8 text-primary',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">文件夹插入位置</div>
            <div className="grid grid-cols-2 gap-2">
              {(['top', 'bottom'] as const).map((position) => (
                <button
                  key={`folder-${position}`}
                  type="button"
                  onClick={() => onChange({ ...settings, folderPosition: position })}
                  className={cn(
                    'flex h-9 items-center justify-center rounded-xl border text-sm active:bg-muted',
                    settings.folderPosition === position && 'border-primary bg-primary/8 text-primary',
                  )}
                >
                  {position === 'top' ? '同类顶部' : '同类底部'}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">书签插入位置</div>
            <div className="grid grid-cols-2 gap-2">
              {(['top', 'bottom'] as const).map((position) => (
                <button
                  key={`bookmark-${position}`}
                  type="button"
                  onClick={() => onChange({ ...settings, bookmarkPosition: position })}
                  className={cn(
                    'flex h-9 items-center justify-center rounded-xl border text-sm active:bg-muted',
                    settings.bookmarkPosition === position && 'border-primary bg-primary/8 text-primary',
                  )}
                >
                  {position === 'top' ? '同类顶部' : '同类底部'}
                </button>
              ))}
            </div>
          </div>
          <Button className="h-10 w-full rounded-xl" disabled={normalizing} onClick={onNormalize}>
            {normalizing ? '规范化中...' : '规范化全部文件夹'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

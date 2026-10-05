import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
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

type ChoiceProps = {
  label: string;
  value: string;
  choices: { value: string; label: string }[];
  onChange: (value: string) => void;
};

function SettingChoice({ label, value, choices, onChange }: ChoiceProps) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>
      <ToggleGroup
        value={[value]}
        onValueChange={(values) => {
          if (values[0]) onChange(values[0]);
        }}
        variant="outline"
        spacing={2}
        className="grid w-full grid-flow-col auto-cols-fr"
        aria-label={label}
      >
        {choices.map((choice) => (
          <ToggleGroupItem key={choice.value} value={choice.value} className="w-full cursor-pointer">
            {choice.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

const backBehaviorChoices = [
  { value: 'hierarchy', label: '逐层返回' },
  { value: 'history', label: '浏览历史' },
  { value: 'close', label: '关闭页面' },
];
const densityChoices = [
  { value: 'false', label: '正常' },
  { value: 'true', label: '紧凑' },
];
const positionChoices = [
  { value: 'top', label: '同类顶部' },
  { value: 'bottom', label: '同类底部' },
];

export function SettingsDialog({
  open, onOpenChange, settings, viewSettings, onChange, onViewChange, normalizing, onNormalize,
}: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="flex max-h-[calc(var(--app-height)-2rem)] min-h-0 flex-col">
        <DialogHeader><DialogTitle>全局设置</DialogTitle></DialogHeader>
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-4 p-1">
            <SettingChoice label="列表模式返回键" value={viewSettings.listBackBehavior} choices={backBehaviorChoices}
              onChange={(value) => onViewChange({ ...viewSettings, listBackBehavior: value as ViewSettings['listBackBehavior'] })} />
            <SettingChoice label="列表模式密度" value={String(viewSettings.listCompact)} choices={densityChoices}
              onChange={(value) => onViewChange({ ...viewSettings, listCompact: value === 'true' })} />
            <SettingChoice label="树形模式密度" value={String(viewSettings.treeCompact)} choices={densityChoices}
              onChange={(value) => onViewChange({ ...viewSettings, treeCompact: value === 'true' })} />
            <SettingChoice label="文件夹插入位置" value={settings.folderPosition} choices={positionChoices}
              onChange={(value) => onChange({ ...settings, folderPosition: value as InsertSettings['folderPosition'] })} />
            <SettingChoice label="书签插入位置" value={settings.bookmarkPosition} choices={positionChoices}
              onChange={(value) => onChange({ ...settings, bookmarkPosition: value as InsertSettings['bookmarkPosition'] })} />
          </div>
        </ScrollArea>
        <Button className="w-full" disabled={normalizing} onClick={onNormalize}>
          {normalizing ? '规范化中...' : '规范化全部文件夹'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

import { useId } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldTitle } from '@/components/ui/field';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  description?: string;
  value: string;
  choices: { value: string; label: string }[];
  onChange: (value: string) => void;
};

function SettingChoice({ label, description, value, choices, onChange }: ChoiceProps) {
  const descriptionId = useId();
  return (
    <Field className="gap-2">
      <FieldTitle>{label}</FieldTitle>
      <ToggleGroup value={[value]} onValueChange={(values) => { if (values[0]) onChange(values[0]); }}
        variant="outline" spacing={2} className="grid w-full grid-flow-col auto-cols-fr" aria-label={label}
        aria-describedby={description ? descriptionId : undefined}>
        {choices.map((choice) => <ToggleGroupItem key={choice.value} value={choice.value} className="w-full">{choice.label}</ToggleGroupItem>)}
      </ToggleGroup>
      {description ? <FieldDescription id={descriptionId}>{description}</FieldDescription> : null}
    </Field>
  );
}

const backBehaviorChoices = [
  { value: 'hierarchy', label: '逐层返回' },
  { value: 'history', label: '浏览历史' },
  { value: 'close', label: '关闭页面' },
];
const densityChoices = [{ value: 'false', label: '正常' }, { value: 'true', label: '紧凑' }];
const lineChoices = [{ value: '1', label: '1 行' }, { value: '2', label: '2 行' }, { value: '3', label: '3 行' }];
const positionChoices = [{ value: 'top', label: '同类顶部' }, { value: 'bottom', label: '同类底部' }];

type DisplaySettingsProps = {
  mode: 'list' | 'tree';
  viewSettings: ViewSettings;
  onChange: (settings: ViewSettings) => void;
};

function DisplaySettings({ mode, viewSettings, onChange }: DisplaySettingsProps) {
  const compactKey = mode === 'list' ? 'listCompact' : 'treeCompact';
  const normalLinesKey = mode === 'list' ? 'listTitleLines' : 'treeTitleLines';
  const compactLinesKey = mode === 'list' ? 'listCompactTitleLines' : 'treeCompactTitleLines';
  const showUrlKey = mode === 'list' ? 'listCompactShowUrl' : 'treeCompactShowUrl';
  const urlSwitchId = `settings-${mode}-compact-url`;
  const displayTitleId = useId();
  return (
    <FieldGroup className="gap-4">
      <SettingChoice label="显示密度" value={String(viewSettings[compactKey])} choices={densityChoices}
        onChange={(value) => onChange({ ...viewSettings, [compactKey]: value === 'true' })} />
      <Card role="group" aria-labelledby={displayTitleId}>
        <CardHeader>
          <CardTitle id={displayTitleId}>书签显示</CardTitle>
        </CardHeader>
        <CardContent>
        <FieldGroup className="gap-4">
          <SettingChoice label="普通模式标题行数" value={String(viewSettings[normalLinesKey])} choices={lineChoices}
            description={mode === 'list' ? '搜索结果也使用此行数。' : undefined}
            onChange={(value) => onChange({ ...viewSettings, [normalLinesKey]: Number(value) })} />
          <SettingChoice label="紧凑模式标题行数" value={String(viewSettings[compactLinesKey])} choices={lineChoices}
            onChange={(value) => onChange({ ...viewSettings, [compactLinesKey]: Number(value) })} />
          <Field orientation="horizontal">
            <FieldLabel htmlFor={urlSwitchId}>紧凑模式显示 URL</FieldLabel>
            <Switch id={urlSwitchId} checked={viewSettings[showUrlKey]}
              onCheckedChange={(checked) => onChange({ ...viewSettings, [showUrlKey]: checked })} />
          </Field>
        </FieldGroup>
        </CardContent>
      </Card>
      {mode === 'list' ? <SettingChoice label="返回键行为" value={viewSettings.listBackBehavior} choices={backBehaviorChoices}
        onChange={(value) => onChange({ ...viewSettings, listBackBehavior: value as ViewSettings['listBackBehavior'] })} /> : null}
    </FieldGroup>
  );
}

export function SettingsDialog({
  open, onOpenChange, settings, viewSettings, onChange, onViewChange, normalizing, onNormalize,
}: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="flex h-[min(34rem,calc(var(--app-height)-2rem))] min-h-0 flex-col">
        <DialogHeader><DialogTitle>设置</DialogTitle></DialogHeader>
        <Tabs defaultValue="list" className="min-h-0 flex-1">
          <TabsList className="w-full shrink-0" aria-label="设置分类">
            <TabsTrigger value="list">列表</TabsTrigger>
            <TabsTrigger value="tree">树形</TabsTrigger>
            <TabsTrigger value="organize">整理</TabsTrigger>
          </TabsList>
          <ScrollArea className="flex min-h-0 flex-1 flex-col [&>[data-slot=scroll-area-viewport]]:min-h-0">
            <TabsContent value="list" className="p-1">
              <DisplaySettings mode="list" viewSettings={viewSettings} onChange={onViewChange} />
            </TabsContent>
            <TabsContent value="tree" className="p-1">
              <DisplaySettings mode="tree" viewSettings={viewSettings} onChange={onViewChange} />
            </TabsContent>
            <TabsContent value="organize" className="p-1">
              <FieldGroup className="gap-4">
                <SettingChoice label="文件夹插入位置" value={settings.folderPosition} choices={positionChoices}
                  onChange={(value) => onChange({ ...settings, folderPosition: value as InsertSettings['folderPosition'] })} />
                <SettingChoice label="书签插入位置" value={settings.bookmarkPosition} choices={positionChoices}
                  onChange={(value) => onChange({ ...settings, bookmarkPosition: value as InsertSettings['bookmarkPosition'] })} />
                <Button className="w-full" disabled={normalizing} onClick={onNormalize}>
                  {normalizing ? '规范化中...' : '规范化全部文件夹'}
                </Button>
              </FieldGroup>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import type { InsertPosition } from '@/lib/bookmark-service';

type InsertPositionPickerProps = {
  value: InsertPosition;
  onChange: (position: InsertPosition) => void;
};

export function InsertPositionPicker({ value, onChange }: InsertPositionPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-medium">添加到</div>
      <ToggleGroup
        value={[value]}
        onValueChange={(positions) => {
          const position = positions[0];
          if (position === 'top' || position === 'bottom') onChange(position);
        }}
        aria-label="添加位置"
        variant="outline"
        spacing={2}
        className="grid w-full grid-cols-2"
      >
        <ToggleGroupItem
          value="top"
          className="w-full cursor-pointer"
        >
          同类顶部
        </ToggleGroupItem>
        <ToggleGroupItem
          value="bottom"
          className="w-full cursor-pointer"
        >
          同类底部
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}

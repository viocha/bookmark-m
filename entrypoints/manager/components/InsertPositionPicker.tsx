import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Field, FieldTitle } from '@/components/ui/field';

import type { InsertPosition } from '@/lib/bookmark-service';

type InsertPositionPickerProps = {
  value: InsertPosition;
  onChange: (position: InsertPosition) => void;
  label?: string;
};

export function InsertPositionPicker({ value, onChange, label = '添加到' }: InsertPositionPickerProps) {
  return (
    <Field>
      <FieldTitle>{label}</FieldTitle>
      <ToggleGroup
        value={[value]}
        onValueChange={(positions) => {
          const position = positions[0];
          if (position === 'top' || position === 'bottom') onChange(position);
        }}
        aria-label={label === '移动到' ? '移动位置' : '添加位置'}
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
    </Field>
  );
}

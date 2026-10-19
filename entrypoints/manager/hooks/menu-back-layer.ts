import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export const MenuBackLayerContext = createContext<((id: symbol, close: (() => void) | null) => void) | null>(null);

export function useBackMenuState<T>(closedValue: T) {
  const [value, setValue] = useState(closedValue);
  const id = useRef(Symbol('menu')).current;
  const updateBackLayer = useContext(MenuBackLayerContext);
  const close = useCallback(() => {
    setValue(closedValue);
    updateBackLayer?.(id, null);
  }, [closedValue, id, updateBackLayer]);
  const setMenuValue = useCallback((next: T) => {
    // 同步更新菜单和返回层，避免进入对话框时产生中间历史记录。
    setValue(next);
    updateBackLayer?.(id, next === closedValue ? null : close);
  }, [close, closedValue, id, updateBackLayer]);

  useEffect(() => () => updateBackLayer?.(id, null), [id, updateBackLayer]);
  return [value, setMenuValue] as const;
}

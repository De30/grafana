import { KeyboardEvent, useCallback, useState } from 'react';

export type UseInputNavigationAPI = [
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void,
  selectedIndex: number | null,
  resetSelection: () => void
];

export interface Props {
  onSelect: (index: number) => void;
}

export function useInputNavigation({ onSelect }: Props): UseInputNavigationAPI {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      switch (event.key) {
        case 'Enter':
          if (selectedIndex !== null) {
            onSelect(selectedIndex);
          }
          break;
        case 'ArrowDown':
          setSelectedIndex(selectedIndex ?? 0 + 1);
          break;
        case 'ArrowUp':
          setSelectedIndex(Math.max(selectedIndex ?? 0 - 1, 0));
          break;
      }
    },
    [selectedIndex, setSelectedIndex, onSelect]
  );

  const resetSelection = useCallback(() => {
    setSelectedIndex(null);
  }, [setSelectedIndex]);

  return [onKeyDown, selectedIndex, resetSelection];
}

import { useEffect } from 'react';

export interface ShortcutConfig {
  key: string;
  shiftKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger hotkeys if user is typing inside an input/textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        if (e.key !== 'Escape') return;
      }

      shortcuts.forEach((sc) => {
        if (
          e.key.toLowerCase() === sc.key.toLowerCase() &&
          Boolean(sc.shiftKey) === e.shiftKey &&
          Boolean(sc.ctrlKey) === e.ctrlKey &&
          Boolean(sc.metaKey) === e.metaKey
        ) {
          e.preventDefault();
          sc.action();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

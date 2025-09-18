export type UndoRedoApi<T> = {
  undo: (current: T) => T | null;
  redo: (current: T) => T | null;
};

export function createUndoRedoHotkeys<T>(api: UndoRedoApi<T>, getCurrent: () => T, apply: (state: T) => void) {
  function handler(e: KeyboardEvent) {
    const isCtrl = e.ctrlKey || e.metaKey;
    if (!isCtrl) return;
    const key = e.key.toLowerCase();
    if (key === "z") {
      e.preventDefault();
      const prev = api.undo(getCurrent());
      if (prev) apply(prev);
    } else if (key === "y") {
      e.preventDefault();
      const next = api.redo(getCurrent());
      if (next) apply(next);
    }
  }
  return {
    mount() {
      window.addEventListener("keydown", handler);
    },
    cleanup() {
      window.removeEventListener("keydown", handler);
    },
  };
}



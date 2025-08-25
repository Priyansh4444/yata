export type UndoRedoOptions = {
  limit?: number;
};

export function createUndoRedo<T>(options?: UndoRedoOptions) {
  const limit = options?.limit ?? 50;
  const undoStack: T[] = [];
  const redoStack: T[] = [];

  function push(state: T) {
    undoStack.push(state);
    if (undoStack.length > limit) undoStack.shift();
    redoStack.length = 0;
  }

  function undo(currentState: T): T | null {
    if (undoStack.length === 0) return null;
    const prev = undoStack.pop() as T;
    redoStack.push(currentState);
    return prev;
  }

  function redo(currentState: T): T | null {
    if (redoStack.length === 0) return null;
    const next = redoStack.pop() as T;
    undoStack.push(currentState);
    return next;
  }

  function canUndo(): boolean {
    return undoStack.length > 0;
  }
  function canRedo(): boolean {
    return redoStack.length > 0;
  }
  function clear() {
    undoStack.length = 0;
    redoStack.length = 0;
  }

  return { push, undo, redo, canUndo, canRedo, clear };
}

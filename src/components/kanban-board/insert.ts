import type { TaskList } from "@/types";
import { COMPLETED_LIST_ID } from "@/libs/dnd-helpers";

export function computeInsertIndexForNewList(lists: TaskList[]): number {
  if (!lists || lists.length === 0) return 0;
  const completedIndex = lists.findIndex((l) => l.id === COMPLETED_LIST_ID);
  if (completedIndex !== -1) return Math.max(0, completedIndex);
  // No explicit completed list; insert at second last if there are 2+ lists,
  // else append when there is only one list (which becomes index 1 after insert).
  return Math.max(0, lists.length - 1);
}



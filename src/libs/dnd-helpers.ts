import type { Draggable, Droppable } from "@thisbeyond/solid-dnd";
import type { TaskList } from "@/types";

export const COMPLETED_LIST_ID = "completed";

export function isSortableGroup(x: Draggable | Droppable): boolean {
  return x?.data?.type === "group";
}

export function getGroupIds(lists: TaskList[]): string[] {
  return lists.map((list) => list.id);
}

export function getItemIdsByGroup(lists: TaskList[], listId: string): string[] {
  const list = lists.find((l) => l.id === listId);
  return list?.tasks.map((t) => t.id) ?? [];
}

export function findTaskById(lists: TaskList[], id: string):
  | { groupIndex: number; ii: number }
  | undefined {
  for (let groupIndex = 0; groupIndex < lists.length; groupIndex++) {
    const tasks = lists[groupIndex].tasks;
    const ii = tasks.findIndex((t) => t.id === id);
    if (ii !== -1) return { groupIndex, ii };
  }
  return undefined;
}



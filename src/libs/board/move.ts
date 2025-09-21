import type { TaskList } from "@/types";
import { COMPLETED_LIST_ID } from "@/libs/dnd-helpers";

export function moveTaskToCompleted(
  lists: TaskList[],
  taskId: string,
): TaskList[] {
  const next = lists.map((l) => ({
    ...l,
    tasks: l.tasks.map((t) => ({ ...t })),
  }));

  let fromListIndex = -1;
  let taskIndex = -1;
  for (let li = 0; li < next.length; li++) {
    taskIndex = next[li].tasks.findIndex((t) => t.id === taskId);
    if (taskIndex !== -1) {
      fromListIndex = li;
      break;
    }
  }
  if (fromListIndex === -1 || taskIndex === -1) return next;

  let completedIndex = next.findIndex((l) => l.id === COMPLETED_LIST_ID);
  if (completedIndex === -1) {
    next.push({ id: COMPLETED_LIST_ID, header: "Completed", tasks: [] });
    completedIndex = next.length - 1;
  }

  const [task] = next[fromListIndex].tasks.splice(taskIndex, 1);
  if (!task) return next;
  task.completedAt = new Date();
  next[completedIndex].tasks.unshift(task);
  return next;
}

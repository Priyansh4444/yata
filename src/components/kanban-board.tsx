import { TaskList } from "@/types";
import KanbanList from "@components/task-list";
import { For } from "solid-js";
import { Sheet } from "@components/ui/sheet";

export default function KanbanBoard({ taskLists }: { taskLists: TaskList[] }) {
  return (
    <div class="kanban-board h-full flex flex-row gap-6 overflow-x-auto pb-4">
      <For each={taskLists}>{(list) => <KanbanList taskList={list} />}</For>
    </div>
  );
}

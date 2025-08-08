import { For, Show, createSignal } from "solid-js";
import { Task, TaskList } from "../types";
import TaskCard from "./task-card";
import InlineTaskEditor from "./inline-task-editor";

export default function KanbanList({ taskList }: { taskList: TaskList }) {
  const [tasks, setTasks] = createSignal<Task[]>(taskList.tasks);
  // Single source of truth for add/edit state: a draft task or null
  const [draftTask, setDraftTask] = createSignal<Task | null>(null);

  function handleAdd(newTask: Task) {
    setTasks((prev) => [...prev, newTask]);
    setDraftTask(null);
  }

  
  return (
    <section
      class="
        column relative flex flex-col rounded-2xl
        bg-black/40 backdrop-blur-sm
        border border-white/5
        shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_24px_48px_-20px_rgba(0,0,0,0.9)]
        min-w-[320px] w-[360px] max-w-[400px]
      "
    >
      <header
        class="
          sticky top-0 z-10
          flex items-center justify-between
          px-4 py-3 rounded-t-2xl
          bg-black/20
          border-b border-white/5
        "
      >
        <div class="flex items-center gap-2">
          <span class="h-2 w-2 rounded-full bg-emerald-400/80 shadow-[0_0_8px_1px_rgba(16,185,129,0.5)]" />
          <h3 class="text-sm font-medium text-zinc-100 tracking-wide">
            {taskList.header}
          </h3>
        </div>
        <span
          class="
            text-[11px] px-2 py-0.5 rounded-md
            bg-white/5 text-zinc-400 border border-white/10
          "
        >
          {tasks().length}
        </span>
      </header>

      <div
        class="
          flex-1 overflow-y-auto px-3 pt-3 pb-4 space-y-3
          scrollbar-thin
          scrollbar-track-transparent
          scrollbar-thumb-zinc-900/80 hover:scrollbar-thumb-zinc-700/80
        "
      >
        <Show
          when={tasks().length > 0}
          fallback={
            <div
              class="
              rounded-xl border border-dashed border-white/10
              text-zinc-500 text-xs p-6 text-center
              bg-black/20
            "
            >
              No tasks yet. Drag here or click “Add task”.
            </div>
          }
        >
          <For each={tasks()}>{(task) => <TaskCard task={task} />}</For>
          <Show when={!!draftTask()}>
            <InlineTaskEditor
              initial={draftTask() ?? undefined}
              onSave={handleAdd}
              onCancel={() => setDraftTask(null)}
            />
          </Show>
        </Show>
      </div>

      <div class="px-3 pb-3">
        <button
          class="
              w-full inline-flex items-center justify-center gap-2
              rounded-xl px-3 py-2
              text-xs font-medium
              text-zinc-200
              bg-white/5 hover:bg-white/10 active:bg-white/15
              border border-white/10
              transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          type="button"
          disabled={!!draftTask()}
          onClick={() => setDraftTask({ header: "", description: "", tags: [] })}
        >
          + Add task
        </button>
      </div>
    </section>
  );
}


// Alternative way to do this: 
// Where id == draft means that it is draft, This could also add resumability if tasks are being saved to the file system!
// function handleAdd(newTask: Task) {
//   setTasks((prev) => prev.map(t => (t.id === "__draft__" ? newTask : t)));
// }

// function startAdd() {
//   setTasks((prev) => [...prev, { id: "__draft__", title: "", /*...*/ }]);
// }

// function cancelAdd() {
//   setTasks((prev) => prev.filter(t => t.id !== "__draft__"));
// }
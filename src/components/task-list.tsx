import { For, Show, createMemo, createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { Task, TaskList, Tag } from "@/types";
import TaskCard from "@components/task-card";
import InlineTaskEditor from "@components/inline-task-editor";
import { createTask } from "@/utils";
import InlineListTitle from "@components/inline-list-title";
import TaskDetailsSheet from "@components/task-details-sheet";

export default function KanbanList({
  taskList,
  onRenameList,
  onDeleteList,
}: {
  taskList: TaskList;
  onRenameList: (name: string) => void;
  onDeleteList: () => void;
}) {
  const [tasks, setTasks] = createStore<Task[]>(taskList.tasks);
  const [openTaskIndex, setOpenTaskIndex] = createSignal<number | null>(null);
  const [sheetOpen, setSheetOpen] = createSignal<boolean>(false);

  const hasDraft = createMemo(() => tasks.some((t) => t.isDraft));

  const openTask = createMemo(() => {
    const index = openTaskIndex();
    return index !== null && index < tasks.length ? tasks[index] : null;
  });

  const existingTags = createMemo<Tag[]>(() => {
    const map = new Map<string, Tag>();
    for (const task of tasks) {
      for (const tag of task.tags ?? []) {
        const key = tag.label.toLowerCase();
        if (!map.has(key)) map.set(key, tag);
      }
    }
    return Array.from(map.values());
  });

  function startEditAt(index: number) {
    setTasks(index, "isDraft", true);
  }

  function startAddNew() {
    const newTask: Task = createTask("", [], undefined, { isDraft: true });
    setTasks([newTask, ...tasks]);
  }

  function handleSave(index: number, updates: Partial<Task>) {
    const patch: Partial<Task> = { ...updates };
    if (patch.header !== undefined) patch.header = patch.header.trim();
    patch.isDraft = false;
    setTasks(index, patch);
  }

  function handleCancel(index: number) {
    const task = tasks[index];
    if (!task) return;
    if ((task.header ?? "").trim() === "") {
      setTasks(tasks.filter((_, i) => i !== index));
    } else {
      setTasks(index, "isDraft", false);
    }
  }

  function updateOpenTask(updates: Partial<Task>) {
    const index = openTaskIndex();
    if (index === null) return;
    Object.entries(updates).forEach(([key, value]) => {
      setTasks(index, key as keyof Task, value);
    });
  }

  return (
    <section
      class="
        column relative flex flex-col h-full rounded-2xl
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
          <InlineListTitle
            value={taskList.header}
            onSave={(v) => onRenameList?.(v)}
          />
        </div>
        <div class="flex items-center gap-2">
          <span
            class="
              text-[11px] px-2 py-0.5 rounded-md
              bg-white/5 text-zinc-400 border border-white/10
            "
          >
            {tasks.length}
          </span>
          <button
            type="button"
            class="h-7 w-7 grid place-items-center rounded-md border border-white/10 text-zinc-400/80 hover:text-rose-200 hover:border-rose-400/40 hover:bg-rose-500/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)] transition"
            title="Delete list"
            onClick={onDeleteList}
          >
            <span class="relative inline-flex">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                <path d="M3 6h18" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </span>
          </button>
        </div>
      </header>

      <div
        class="
          flex-1 overflow-y-auto px-3 pt-4 pb-8 space-y-4
          scrollbar-black
        "
      >
        <Show
          when={tasks.length > 0}
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
          <For each={tasks}>
            {(task, i) => (
              <>
                {task.isDraft ? (
                  <InlineTaskEditor
                    initial={task}
                    onSave={(u) => handleSave(i(), u)}
                    onCancel={() => handleCancel(i())}
                    existingTags={existingTags()}
                  />
                ) : (
                  <TaskCard
                    task={task}
                    onOpen={() => {
                      setOpenTaskIndex(i());
                      setSheetOpen(true);
                    }}
                    onAddTags={() => startEditAt(i())}
                    onStartEdit={() => startEditAt(i())}
                  />
                )}
              </>
            )}
          </For>
        </Show>
      </div>

      <div class="px-3 pb-3">
        <button
          class="
              w-full inline-flex items-center justify-center gap-2
              rounded-xl px-3 py-2.5
              text-sm font-medium
              text-zinc-200
              bg-white/5 hover:bg-white/10 active:bg-white/15
              border border-white/10
              transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          type="button"
          disabled={hasDraft()}
          onClick={startAddNew}
        >
          + Add task
        </button>
      </div>
      <TaskDetailsSheet
        open={sheetOpen()}
        onOpenChange={(v) => {
          if (v) {
            setSheetOpen(true);
            return;
          }
          setSheetOpen(false);
          // ! Delay clearing the task until the closing animation finishes
          // ! Keep this in sync with the CSS close animation duration (~160-200ms)
          setTimeout(() => setOpenTaskIndex(null), 200);
        }}
        task={openTask()}
        taskList={taskList}
        onUpdate={updateOpenTask}
        existingTags={existingTags()}
      />
    </section>
  );
}

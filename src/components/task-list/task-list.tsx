import {
  For,
  Show,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  createEffect,
  JSX,
} from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import type { Task, TaskList, Tag } from "@/types";
import TaskCard from "@/components/task-card/task-card";
import InlineTaskEditor from "@/components/task-card/task-card.editor";
import { createTask } from "@/utils";
import InlineListTitle from "@/components/task-list/task-list.title-edit";
import TaskDetailsSheet from "@components/task-details-sheet";
import { createUndoRedo } from "@/libs/undo";
import {
  SortableProvider,
  createSortable,
  maybeTransformStyle,
  type Id,
} from "@thisbeyond/solid-dnd";

interface KanbanListProps {
  taskList: TaskList;
  onRenameList: (name: string) => void;
  onDeleteList: () => void;
  listId: string;
}

export default function KanbanList({
  taskList,
  onRenameList,
  onDeleteList,
  listId,
}: KanbanListProps) {
  const [tasks, setTasks] = createStore<Task[]>(taskList.tasks);
  const [openTaskIndex, setOpenTaskIndex] = createSignal<number | null>(null);
  const [sheetOpen, setSheetOpen] = createSignal<boolean>(false);
  const history = createUndoRedo<Task[]>({ limit: 100 });

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

  function snapshot() {
    // Convert Solid store arrays to plain objects for cloning
    const plain = tasks.map((task) => ({ ...task }));
    history.push(plain);
  }

  function startAddNew() {
    snapshot();
    const newTask: Task = createTask("", [], undefined, { isDraft: true });
    setTasks([newTask, ...tasks]);
  }

  function handleSave(index: number, updates: Partial<Task>) {
    snapshot();
    const patch: Partial<Task> = { ...updates };
    if (patch.header !== undefined) patch.header = patch.header.trim();
    patch.isDraft = false;
    setTasks(index, patch);
  }

  function handleCancel(index: number) {
    const task = tasks[index];
    if (!task) return;

    if ((task.header ?? "").trim() === "") {
      snapshot();
      setTasks(tasks.filter((_, i) => i !== index));
    } else {
      setTasks(index, "isDraft", false);
    }
  }

  function deleteTaskAt(index: number) {
    snapshot();
    const next = tasks.filter((_, i) => i !== index);
    setTasks(reconcile(next));

    // If the deleted task was open, close the sheet
    if (openTaskIndex() === index) {
      setOpenTaskIndex(null);
      setSheetOpen(false);
    } else if (openTaskIndex() !== null && openTaskIndex()! > index) {
      // Adjust the open task index if a task before it was deleted
      setOpenTaskIndex(openTaskIndex()! - 1);
    }
  }

  function updateOpenTask(updates: Partial<Task>) {
    const index = openTaskIndex();
    if (index === null) return;

    snapshot();
    Object.entries(updates).forEach(([key, value]) => {
      setTasks(index, key as keyof Task, value);
    });
  }

  function handleKeydown(e: KeyboardEvent) {
    const isCtrl = e.ctrlKey || e.metaKey;
    if (!isCtrl) return;

    if (e.key.toLowerCase() === "z") {
      e.preventDefault();
      const prev = history.undo(tasks.map((task) => ({ ...task })));
      if (prev) setTasks(reconcile(prev));
    } else if (e.key.toLowerCase() === "y") {
      e.preventDefault();
      const next = history.redo(tasks.map((task) => ({ ...task })));
      if (next) setTasks(reconcile(next));
    }
  }

  onMount(() => {
    window.addEventListener("keydown", handleKeydown);
  });

  onCleanup(() => {
    window.removeEventListener("keydown", handleKeydown);
  });

  createEffect(() => {
    setTasks(reconcile(taskList.tasks));
  });

  const listSortable = createSortable(listId, { type: "group" });

  return (
    <section
      ref={listSortable.ref}
      style={maybeTransformStyle(listSortable.transform)}
      classList={{ "opacity-25": listSortable.isActiveDraggable }}
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
        {...listSortable.dragActivators}
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
              No tasks yet. Drag here or click "Add task".
            </div>
          }
        >
          <SortableProvider ids={tasks.map((t) => t.id)}>
            <For each={tasks}>
              {(task, i) => (
                <>
                  {task.isDraft ? (
                    <InlineTaskEditor
                      initial={task}
                      onSave={(update) => handleSave(i(), update)}
                      onCancel={() => handleCancel(i())}
                      existingTags={existingTags()}
                    />
                  ) : (
                    <SortableTaskCard id={task.id} group={listId}>
                      <TaskCard
                        task={task}
                        onOpen={() => {
                          setOpenTaskIndex(i());
                          setSheetOpen(true);
                        }}
                        onAddTags={() => startEditAt(i())}
                        onStartEdit={() => startEditAt(i())}
                        onDelete={() => deleteTaskAt(i())}
                      />
                    </SortableTaskCard>
                  )}
                </>
              )}
            </For>
          </SortableProvider>
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
          // Delay clearing the task until the closing animation finishes
          // Keep this in sync with the CSS close animation duration (~160-200ms)
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

interface SortableTaskCardProps {
  id: Id;
  group: string;
  children: JSX.Element;
}

function SortableTaskCard(props: SortableTaskCardProps) {
  const sortable = createSortable(props.id, {
    type: "item",
    group: props.group,
  });

  return (
    <div
      ref={sortable.ref}
      style={maybeTransformStyle(sortable.transform)}
      {...sortable.dragActivators}
      classList={{ "opacity-25": sortable.isActiveDraggable }}
    >
      {props.children}
    </div>
  );
}

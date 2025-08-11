import { For, Show, createMemo, createSignal } from "solid-js";
import { Task, TaskList, Tag, Priority, Option } from "@/types";
import TaskCard from "@components/task-card";
import InlineTaskEditor from "@components/inline-task-editor";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@components/ui/sheet";
import { generateUID } from "@/utils";
import { cn } from "@/libs/cn";

export default function KanbanList({
  taskList,
  onRenameList,
}: {
  taskList: TaskList;
  onRenameList?: (name: string) => void;
}) {
  const [tasks, setTasks] = createSignal<Task[]>(taskList.tasks);
  const [openTaskIndex, setOpenTaskIndex] = createSignal<number | null>(null);

  const hasDraft = createMemo(() => tasks().some((t) => t.isDraft));

  const openTask = createMemo(() => {
    const index = openTaskIndex();
    return index !== null && index < tasks().length ? tasks()[index] : null;
  });

  const priorityUi = createMemo(() => getPriorityUiProps(openTask()?.priority));

  const existingTags = createMemo<Tag[]>(() => {
    const map = new Map<string, Tag>();
    for (const t of tasks()) {
      for (const tag of t.tags ?? []) {
        const key = tag.label.toLowerCase();
        if (!map.has(key)) map.set(key, tag);
      }
    }
    return Array.from(map.values());
  });

  function startEditAt(index: number) {
    setTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, isDraft: true } : t))
    );
  }

  function startAddNew() {
    const newTask: Task = {
      id: generateUID(),
      header: "",
      isDraft: true,
      createdAt: new Date(),
      description: undefined,
      tags: [],
      priority: undefined,
      dueDate: undefined,
      completedAt: undefined,
    };
    setTasks((prev) => [newTask, ...prev]);
  }

  function handleSave(index: number, updates: Partial<Task>) {
    setTasks((prev) =>
      prev.map((task, i) =>
        i === index
          ? {
              ...task,
              header: updates.header?.trim() ?? task.header,
              description: updates.description ?? task.description,
              tags: updates.tags ?? task.tags,
              priority: updates.priority ?? task.priority,
              dueDate: updates.dueDate ?? task.dueDate,
              isDraft: false,
            }
          : task
      )
    );
  }

  function handleCancel(index: number) {
    const task = tasks()[index];
    if (!task) return;
    if ((task.header ?? "").trim() === "") {
      setTasks((prev) => prev.filter((_, i) => i !== index));
    } else {
      setTasks((prev) =>
        prev.map((task, i) =>
          i === index ? { ...task, isDraft: false } : task
        )
      );
    }
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
          flex-1 overflow-y-auto px-3 pt-4 pb-8 space-y-4
          scrollbar-black
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
          <For each={tasks()}>
            {(task, i) =>
              task.isDraft ? (
                <InlineTaskEditor
                  initial={task}
                  onSave={(u) => handleSave(i(), u)}
                  onCancel={() => handleCancel(i())}
                  existingTags={existingTags()}
                />
              ) : (
                <TaskCard
                  task={task}
                  onOpen={() => setOpenTaskIndex(i())}
                  onAddTags={() => startEditAt(i())}
                />
              )
            }
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
      <Sheet
        open={openTaskIndex() !== null}
        onOpenChange={(v) => !v && setOpenTaskIndex(null)}
      >
        <SheetContent
          side="right"
          class={cn(
            "bg-black/50 backdrop-blur-xl p-5 border",
            priorityUi().sheetBorderClass
          )}
        >
          <SheetHeader>
            <SheetDescription class="text-sm tracking-wide text-zinc-500">
              In list: <span class="text-zinc-300">{taskList.header}</span>
            </SheetDescription>
            <SheetTitle
              class={cn(
                "text-4xl sm:text-5xl md:text-6xl leading-tight",
                priorityUi().titleTextClass
              )}
            >
              {openTask()?.header ?? ""}
            </SheetTitle>
          </SheetHeader>

          <div class="mt-5 space-y-5">
            <div
              class={cn(
                "text-xs flex items-center gap-3",
                priorityUi().metaTextClass
              )}
            >
              <Show when={!!openTask()}>
                <span>
                  Created {openTask()?.createdAt.toLocaleDateString()}
                </span>
              </Show>
              <Show when={!!openTask()?.dueDate}>
                <span>• Due {openTask()?.dueDate?.toLocaleDateString()}</span>
              </Show>
              <Show when={!!openTask()?.priority}>
                <span>• Priority {openTask()?.priority}</span>
              </Show>
            </div>
            <div class="flex flex-wrap gap-2">
              <For each={openTask()?.tags ?? []}>
                {(tag) => (
                  <span
                    class="px-2.5 py-1 text-[11px] rounded-md text-zinc-200 border border-white/10"
                    style={{
                      "background-color": `${tag.color}33`,
                      color: tag.color,
                    }}
                  >
                    {tag.label}
                  </span>
                )}
              </For>
            </div>
            {/* Divider line below tags */}
            <div class="border-t border-white/10" />
            <p class="text-base sm:text-lg text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {openTask()?.description || ""}
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}

function InlineListTitle({
  value,
  onSave,
}: {
  value: string;
  onSave?: (val: string) => void;
}) {
  const [isEditing, setIsEditing] = createSignal(false);
  const [text, setText] = createSignal(value);

  function commit() {
    const v = text().trim();
    if (!v) {
      setText(value);
      setIsEditing(false);
      return;
    }
    if (v !== value) onSave?.(v);
    setIsEditing(false);
  }

  return (
    <div>
      <Show
        when={isEditing()}
        fallback={
          <h3
            class="text-sm font-medium text-zinc-100 tracking-wide cursor-text"
            onDblClick={() => setIsEditing(true)}
            title="Double-click to rename"
          >
            {value}
          </h3>
        }
      >
        <input
          class="bg-transparent text-sm font-medium text-zinc-100 tracking-wide outline-none border-b border-white/10 focus:border-white/20"
          value={text()}
          onInput={(e) => setText(e.currentTarget.value)}
          onBlur={() => {
            if (!isEditing()) return;
            commit();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setText(value);
              setIsEditing(false);
            }
          }}
          autofocus
        />
      </Show>
    </div>
  );
}

type PriorityUiProps = {
  sheetBorderClass: string;
  titleTextClass: string;
  metaTextClass: string;
};

function getPriorityUiProps(priority: Option<Priority>): PriorityUiProps {
  switch (priority) {
    case "low":
      return {
        sheetBorderClass: "border-emerald-500/30",
        titleTextClass: "text-emerald-100",
        metaTextClass: "text-emerald-300/80",
      };
    case "medium":
      return {
        sheetBorderClass: "border-amber-500/35",
        titleTextClass: "text-amber-100",
        metaTextClass: "text-amber-300/80",
      };
    case "high":
      return {
        sheetBorderClass: "border-rose-600/40",
        titleTextClass: "text-rose-100",
        metaTextClass: "text-rose-300/80",
      };
    default:
      return {
        sheetBorderClass: "border-white/10",
        titleTextClass: "text-zinc-100",
        metaTextClass: "text-zinc-400",
      };
  }
}

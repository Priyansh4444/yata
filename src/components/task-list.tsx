import { For, Show, createMemo, createSignal } from "solid-js";
import { Task, TaskList } from "../types";
import TaskCard from "./task-card";
import InlineTaskEditor from "./inline-task-editor";
import type { Tag } from "@/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet";

export default function KanbanList({ taskList }: { taskList: TaskList }) {
  const [tasks, setTasks] = createSignal<Task[]>(taskList.tasks);
  // Single source of truth for inline editor state
  const [editor, setEditor] = createSignal<{ task: Task; index: number | null } | null>(null);
  const [openTaskIndex, setOpenTaskIndex] = createSignal<number | null>(null);

  function handleSave(task: Task) {
    const state = editor();
    const idx = state?.index ?? null;
    if (idx === null) {
      setTasks((prev) => [...prev, task]);
    } else {
      setTasks((prev) => prev.map((t, i) => (i === idx ? task : t)));
    }
    setEditor(null);
  }

  // Suggestions built from current list content (unique by label, case-insensitive)
  const existingTags = createMemo<Tag[]>(() =>
    Array.from(
      new Map(
        tasks()
          .flatMap((t) => t.tags ?? [])
          .map((t) => [t.label.toLowerCase(), t]),
      ).values(),
    ),
  );

  function startAddNew() {
    setEditor({ task: { header: "", description: "", tags: [] }, index: null });
  }

  function startEditAt(index: number) {
    const item = tasks()[index];
    setEditor({ task: item, index });
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
          flex-1 overflow-y-auto px-3 pt-4 pb-8 space-y-4
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
          <For each={tasks()}>
            {(task, i) => {
              const ed = editor();
              return ed && ed.index === i() ? (
                <InlineTaskEditor
                  initial={ed.task}
                  onSave={handleSave}
                  onCancel={() => setEditor(null)}
                  existingTags={existingTags()}
                />
              ) : (
                <TaskCard
                  task={task}
                  onOpen={() => setOpenTaskIndex(i())}
                  onAddTags={() => startEditAt(i())}
                />
              );
            }}
          </For>
          <Show when={!!editor() && editor()!.index === null}>
            <InlineTaskEditor
              initial={editor()!.task}
              onSave={handleSave}
              onCancel={() => setEditor(null)}
              existingTags={existingTags()}
            />
          </Show>
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
          disabled={!!editor()}
          onClick={startAddNew}
        >
          + Add task
        </button>
      </div>
      <Sheet open={openTaskIndex() !== null} onOpenChange={(v) => !v && setOpenTaskIndex(null)}>
        <SheetContent
          side="right"
          class="bg-black/50 backdrop-blur-xl border-white/10 p-5"
        >
          <SheetHeader>
            <SheetDescription class="text-sm tracking-wide text-zinc-500">
              In list: <span class="text-zinc-300">{taskList.header}</span>
            </SheetDescription>
            <SheetTitle class="text-4xl sm:text-5xl md:text-6xl leading-tight text-zinc-100">
              {openTaskIndex() !== null ? tasks()[openTaskIndex()!].header : ""}
            </SheetTitle>
          </SheetHeader>

          <div class="mt-5 space-y-5">
            <div class="flex flex-wrap gap-2">
              <For each={openTaskIndex() !== null ? (tasks()[openTaskIndex()!].tags ?? []) : []}>
                {(tag) => (
                  <span class="px-2.5 py-1 text-[11px] rounded-md text-zinc-200 border border-white/10" style={{
                    "background-color": `${tag.color}33`,
                    color: tag.color,
                  }}>
                    {tag.label}
                  </span>
                )}
              </For>
            </div>
            {/* Divider line below tags */}
            <div class="border-t border-white/10" />
            <p class="text-base sm:text-lg text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {openTaskIndex() !== null ? (tasks()[openTaskIndex()!].description || "") : ""}
            </p>
          </div>
        </SheetContent>
      </Sheet>
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
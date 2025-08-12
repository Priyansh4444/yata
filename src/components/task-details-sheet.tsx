import {
  Show,
  For,
  JSX,
  createMemo,
  createSignal,
  createEffect,
  on,
  onCleanup,
} from "solid-js";
import { Task, TaskList, Priority, Option, Tag } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetDescription,
} from "@components/ui/sheet";
import { cn } from "@/libs/cn";
import TagPicker from "@components/tags/tag-picker";

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

interface TaskDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  taskList: TaskList;
  onUpdate?: (updates: Partial<Task>) => void;
  existingTags?: Tag[];
}

export default function TaskDetailsSheet(
  props: TaskDetailsSheetProps,
): JSX.Element {
  const priorityUi = createMemo(() => getPriorityUiProps(props.task?.priority));
  const [editingTags, setEditingTags] = createSignal(false);
  const [title, setTitle] = createSignal<string>(props.task?.header ?? "");
  const [desc, setDesc] = createSignal<string>(props.task?.description ?? "");
  const [prio, setPrio] = createSignal<Option<Priority>>(props.task?.priority);
  const [dueStr, setDueStr] = createSignal<string>(
    toLocalDateInputString(props.task?.dueDate) ?? "",
  );

  // Sync local fields when the opened task changes
  createEffect(
    on(
      () => props.task?.id,
      () => {
        setTitle(props.task?.header ?? "");
        setDesc(props.task?.description ?? "");
        setPrio(props.task?.priority);
        setDueStr(toLocalDateInputString(props.task?.dueDate) ?? "");
        setEditingTags(false);
      },
      { defer: true },
    ),
  );

  // Lightweight debounce to avoid re-rendering the whole board on every keystroke
  let debouncedId: ReturnType<typeof setTimeout> | null = null;
  function debounceUpdate(partial: Partial<Task>, delay = 120) {
    if (debouncedId) clearTimeout(debouncedId);
    debouncedId = setTimeout(() => props.onUpdate?.(partial), delay);
  }
  onCleanup(() => {
    if (debouncedId) clearTimeout(debouncedId);
  });

  function toLocalDateInputString(
    date: Date | string | undefined,
  ): string | undefined {
    if (!date) return undefined;
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return undefined;
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function parseLocalDateInput(input: string | undefined): Date | undefined {
    if (!input) return undefined;
    const [y, m, d] = input.split("-").map(Number);
    if (!y || !m || !d) return undefined;
    const date = new Date(y, m - 1, d);
    return isNaN(date.getTime()) ? undefined : date;
  }

  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent
        side="right"
        class={cn(
          "bg-black/50 backdrop-blur-xl p-5 border",
          priorityUi().sheetBorderClass,
        )}
      >
        <SheetHeader>
          <SheetDescription class="text-sm tracking-wide text-zinc-500">
            In list: <span class="text-zinc-300">{props.taskList.header}</span>
          </SheetDescription>
          <div class="mt-1">
            <input
              class={cn(
                "w-full bg-transparent outline-none border-0 p-0 m-0 font-semibold",
                "text-4xl sm:text-5xl md:text-6xl leading-tight font-inter",
                priorityUi().titleTextClass,
              )}
              placeholder="Untitled"
              value={title()}
              onInput={(e) => {
                setTitle(e.currentTarget.value);
                debounceUpdate({ header: e.currentTarget.value });
              }}
            />
          </div>
        </SheetHeader>

        <div class="mt-5 space-y-5">
          <div class="flex flex-wrap items-center gap-3">
            <span class={cn("text-xs", priorityUi().metaTextClass)}>
              <Show when={!!props.task}>
                Created {props.task?.createdAt.toLocaleDateString()}
              </Show>
            </span>
            <div class="flex items-center gap-2">
              <select
                class="bg-transparent text-xs text-zinc-300 border border-white/10 rounded-md px-2 py-1"
                value={prio() ?? ""}
                onChange={(e) => {
                  const value = (e.currentTarget.value ||
                    undefined) as Option<Priority>;
                  setPrio(value);
                  debounceUpdate({ priority: value });
                }}
              >
                <option value="" class="bg-black">
                  Priority
                </option>
                <option value="low" class="bg-black">
                  Low
                </option>
                <option value="medium" class="bg-black">
                  Medium
                </option>
                <option value="high" class="bg-black">
                  High
                </option>
              </select>
              <input
                type="date"
                class="bg-transparent text-xs text-zinc-300 border border-white/10 rounded-md px-2 py-1"
                value={dueStr()}
                onInput={(e) => {
                  const val = e.currentTarget.value || undefined;
                  setDueStr(val ?? "");
                  debounceUpdate({ dueDate: parseLocalDateInput(val) });
                }}
              />
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <div class="flex flex-wrap gap-2">
                <For each={props.task?.tags ?? []}>
                  {(tag: Tag) => (
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
              <button
                type="button"
                class="ml-2 shrink-0 px-2 py-1 text-[11px] rounded-md border border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/10"
                onClick={() => setEditingTags((v) => !v)}
              >
                <Show
                  when={(props.task?.tags?.length ?? 0) === 0 && !editingTags()}
                >
                  + Add tags
                </Show>
                <Show
                  when={(props.task?.tags?.length ?? 0) > 0 || editingTags()}
                >
                  {editingTags() ? "Done" : "Edit tags"}
                </Show>
              </button>
            </div>
            <Show when={editingTags()}>
              <TagPicker
                value={(props.task?.tags ?? []) as Tag[]}
                onChange={(tags) => props.onUpdate?.({ tags })}
                suggestions={props.existingTags}
              />
            </Show>
          </div>
          {/* Divider line below tags */}
          <div class="border-t border-white/10" />
          <textarea
            class="w-full bg-transparent text-base sm:text-lg text-zinc-300 placeholder-zinc-600 outline-none leading-relaxed resize-none"
            rows={8}
            placeholder="Write details..."
            value={desc()}
            onInput={(e) => {
              setDesc(e.currentTarget.value);
              debounceUpdate({ description: e.currentTarget.value });
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetDescription,
} from "@components/ui/sheet";
import { cn } from "@/libs/cn";
import TagPicker from "@components/tags/tag-picker";
import RichEditor from "./tiptap-editor/rich-editor";

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
  const [content, setContent] = createSignal<string>(props.task?.content ?? "");
  const [priority, setPriority] = createSignal<Option<Priority>>(
    props.task?.priority,
  );
  const [dueStr, setDueStr] = createSignal<string>(
    toLocalDateInputString(props.task?.dueDate) ?? "",
  );

  // Sync local fields when the opened task changes
  createEffect(
    on(
      () => props.task?.id,
      () => {
        setTitle(props.task?.header ?? "");
        setContent(props.task?.content ?? "");
        setPriority(props.task?.priority);
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
          "bg-black/50 backdrop-blur-xl p-5 border w-full",
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
              <Select
                multiple={false}
                options={["", "low", "medium", "high"]}
                value={priority() ?? ""}
                onChange={(value) => {
                  const v = (value || undefined) as Option<Priority>;
                  setPriority(v);
                  debounceUpdate({ priority: v });
                }}
                itemComponent={(itemProps) => (
                  <SelectItem item={itemProps.item}>
                    {itemProps.item.textValue === ""
                      ? "Priority"
                      : itemProps.item.textValue.charAt(0).toUpperCase() +
                        itemProps.item.textValue.slice(1)}
                  </SelectItem>
                )}
              >
                <SelectTrigger class="min-w-[120px] bg-transparent text-xs text-zinc-300">
                  <span class="opacity-80">
                    {priority()
                      ? priority()!.charAt(0).toUpperCase() +
                        priority()!.slice(1)
                      : "Priority"}
                  </span>
                </SelectTrigger>
                <SelectContent class="text-xs" />
              </Select>
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
                    <span class="inline-flex items-center gap-1">
                      <span
                        class="h-1.5 w-1.5 rounded-full"
                        style={{ background: tag.color }}
                      />
                      <span class="text-[11px] text-zinc-200/90">
                        <span style={{ color: tag.color }}>{tag.label}</span>
                      </span>
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
          <div class="w-full">
            <RichEditor value={content()} onChange={(val) => {
              setContent(val);
              debounceUpdate({ content: val });
            }} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

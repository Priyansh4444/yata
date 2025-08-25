import { Task, Option } from "@/types";
import { cn } from "@/libs/cn";
import { createMemo } from "solid-js";
import TagBadge from "@components/tags/tag-badge";
import { Dots } from "./task-card.dots";
import { getPriorityProps } from "./task-card.priority";

export default function TaskCard({
  task,
  onOpen,
  onAddTags,
  onStartEdit,
}: {
  task: Task;
  onOpen?: () => void;
  onAddTags?: () => void;
  onStartEdit?: () => void;
}) {
  // Derive a nested store from task to avoid unnecessary recomputation of siblings
  const header = createMemo(() => task.header ?? "");
  const hasTags = createMemo(() => (task.tags?.length ?? 0) > 0);
  const isDraft = createMemo(() => task.isDraft);
  // Potential error if invalid date, but this is an issue I think that should be faced in Input Validation
  const due = createMemo<Option<Date>>(() =>
    task.dueDate ? new Date(task.dueDate) : undefined,
  );

  const priorityProps = createMemo(() => getPriorityProps(task.priority));

  function handleAddTagsClick(event: MouseEvent) {
    event.stopPropagation();
    if (onAddTags) onAddTags();
  }
  function shouldIgnoreTarget(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    if (!el) return false;
    const tag = (el.tagName || "").toLowerCase();
    if (el.isContentEditable) return true;
    return (
      tag === "input" ||
      tag === "textarea" ||
      tag === "select" ||
      tag === "button"
    );
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key.toLowerCase() !== "e") return;
    if (shouldIgnoreTarget(event.target)) return;
    event.preventDefault();
    onStartEdit?.();
  }

  function handleMouseEnter(event: MouseEvent) {
    // Only focus if not already focused
    const target = event.currentTarget as HTMLElement;
    if (document.activeElement !== target) {
      target.focus();
    }
  }

  return (
    <article
      class={cn(
        "task-card group relative rounded-xl p-6 min-h-[110px] bg-black/50 backdrop-blur-sm border outline-none",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_8px_24px_-12px_rgba(0,0,0,0.8)] transition-colors duration-150 cursor-pointer",
        priorityProps().borderClass,
      )}
      onClick={onOpen}
      onMouseEnter={handleMouseEnter}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {task.priority && (
        <Dots priority={task.priority} seed={`${task.id}:${task.priority}`} />
      )}
      <header class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2
            class={cn(
              "text-base sm:text-lg font-semibold leading-snug line-clamp-2",
              priorityProps().headerTextClass,
            )}
          >
            {header().trim() || "Untitled Task"}
          </h2>
          <div
            class={cn(
              "mt-1 flex items-center gap-2 text-[11px]",
              priorityProps().metaTextClass,
            )}
          >
            {due() && <span>Due {due()!.toLocaleDateString()}</span>}
            {isDraft() && <span class="text-amber-300">Draft</span>}
          </div>
        </div>
      </header>

      <div class="mt-3 min-h-[24px] flex flex-wrap gap-1.5">
        {hasTags() ? (
          (task.tags || []).map((tag) => <TagBadge tag={tag} size="sm" />)
        ) : (
          <button
            type="button"
            class="px-2 py-0.5 text-[11px] rounded-md border border-dashed border-white/10 text-zinc-500/70 opacity-80 group-hover:opacity-100 transition-opacity bg-transparent"
            onClick={handleAddTagsClick}
            aria-label="Add tags inline"
            title="Add tags"
          >
            + Add tags
          </button>
        )}
      </div>

      <div
        class="
          pointer-events-none absolute inset-0 rounded-xl
          ring-0 group-hover:ring-1 ring-white/5 transition duration-200
        "
      />
    </article>
  );
}

import type { Task } from "@/types";
import { cn } from "@/libs/cn";
import { createMemo } from "solid-js";
import TagBadge from "@components/tags/tag-badge";
import { Dots } from "@components/task-card/task-card.dots";
import { getPriorityProps } from "@components/task-card/task-card.priority";

interface TaskCardProps {
  task: Task;
  onOpen?: () => void;
  onAddTags?: () => void;
  onStartEdit?: () => void;
  onDelete?: () => void;
}

export default function TaskCard({
  task,
  onOpen,
  onAddTags,
  onStartEdit,
  onDelete,
}: TaskCardProps) {
  const header = createMemo(() => task.header ?? "");
  const hasTags = createMemo(() => (task.tags?.length ?? 0) > 0);
  const isDraft = createMemo(() => task.isDraft);

  const due = createMemo<Date | undefined>(() =>
    task.dueDate ? new Date(task.dueDate) : undefined,
  );

  const priorityProps = createMemo(() => getPriorityProps(task.priority));
  const estMin = createMemo(() =>
    Math.round((task.estimatedSeconds || 0) / 60 || 0),
  );
  const doneMin = createMemo(() =>
    Math.round((task.timeSpentSeconds || 0) / 60 || 0),
  );

  function handleAddTagsClick(event: MouseEvent) {
    event.stopPropagation();
    if (onAddTags) onAddTags();
  }

  function handleDeleteClick(event: MouseEvent) {
    event.stopPropagation();
    if (onDelete) onDelete();
  }

  function shouldIgnoreTarget(target: EventTarget | null): boolean {
    if (!target || !(target instanceof HTMLElement)) return false;

    const tag = target.tagName?.toLowerCase() || "";
    if (target.isContentEditable) return true;

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
    if (!(event.currentTarget instanceof HTMLElement)) return;

    const target = event.currentTarget;
    // Only focus if not already focused
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
        <div class="min-w-0 flex-1">
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
            {estMin() > 0 && <span>Est {estMin()}m</span>}
            {doneMin() > 0 && <span>Done {doneMin()}m</span>}
            {isDraft() && <span class="text-amber-300">Draft</span>}
          </div>
        </div>
        <button
          type="button"
          class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-6 w-6 grid place-items-center rounded-md text-zinc-400/80 hover:text-rose-300 hover:bg-rose-500/10"
          onClick={handleDeleteClick}
          title="Delete task"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            class="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </header>

      <div class="mt-3 min-h-[24px] flex flex-wrap gap-1.5">
        {hasTags() ? (
          (task.tags || []).map((tag) => <TagBadge tag={tag} size="sm" />)
        ) : (
          <button
            type="button"
            class="px-2 py-0.5 text-[11px] rounded-md border border-dashed border-white/10 text-zinc-500/70 opacity-80 group-hover:opacity-100 transition-opacity bg-transparent"
            onClick={handleAddTagsClick}
            aria-label="Add tags"
            title="Add tags to task"
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

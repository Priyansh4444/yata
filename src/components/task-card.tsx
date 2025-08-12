import { Task, Option, Priority } from "@/types";
import { cn } from "@/libs/cn";
import { createMemo, JSX } from "solid-js";
import TagBadge from "@components/tags/tag-badge";

function Dots({
  priority,
}: {
  priority: Option<Priority>;
}): JSX.Element | null {
  const dots = createMemo(() => {
    const { rgb, baseCount, opacity, sizeRange, blurRange } =
      getPriorityProps(priority);
    if (!rgb || baseCount === 0) return null;
    const [r, g, b] = rgb;
    return Array.from({ length: baseCount }, () => {
      const left = 5 + Math.random() * 90; // percent
      const top = 5 + Math.random() * 70; // percent
      const size = 40 + Math.random() * sizeRange; // px
      const blur = 12 + Math.random() * blurRange; // px
      return {
        left: `${left}%`,
        top: `${top}%`,
        size,
        blur,
        opacity,
        color: `rgba(${r}, ${g}, ${b}, ${opacity})`,
      };
    });
  });

  const dotsArray = dots();
  if (!dotsArray) return null;
  return (
    <div class="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
      {dots()!.map((d) => (
        <div
          style={{
            position: "absolute",
            left: d.left,
            top: d.top,
            width: `${d.size}px`,
            height: `${d.size}px`,
            background: d.color,
            "border-radius": "9999px",
            filter: `blur(${d.blur}px)`,
          }}
        />
      ))}
    </div>
  );
}

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
  const header: string = task.header;
  const hasTags: boolean = (task.tags?.length ?? 0) > 0;
  const isDraft: boolean = task.isDraft;
  // Potential error if invalid date, but this is an issue I think that should be faced in Input Validation
  const due: Option<Date> = task.dueDate ? new Date(task.dueDate) : undefined;

  const priorityProps = getPriorityProps(task.priority);

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
        priorityProps.borderClass,
      )}
      onClick={onOpen}
      onMouseEnter={handleMouseEnter}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {task.priority && <Dots priority={task.priority} />}
      <header class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2
            class={cn(
              "text-base sm:text-lg font-semibold leading-snug line-clamp-2",
              priorityProps.headerTextClass,
            )}
          >
            {header.trim() || "Untitled Task"}
          </h2>
          <div
            class={cn(
              "mt-1 flex items-center gap-2 text-[11px]",
              priorityProps.metaTextClass,
            )}
          >
            {due && <span>Due {due.toLocaleDateString()}</span>}
            {isDraft && <span class="text-amber-300">Draft</span>}
          </div>
        </div>
      </header>

      <div class="mt-3 min-h-[24px] flex flex-wrap gap-1.5">
        {hasTags ? (
          (task.tags || []).map((tag) => <TagBadge tag={tag} />)
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

type PriorityProps = {
  borderClass: string;
  headerTextClass: string;
  metaTextClass: string;
  rgb: [number, number, number] | null;
  baseCount: number;
  opacity: number;
  sizeRange: number;
  blurRange: number;
};

function getPriorityProps(priority: Option<Priority>): PriorityProps {
  switch (priority) {
    case "low":
      return {
        borderClass: "border-emerald-500/20 hover:border-emerald-400/30",
        headerTextClass: "text-emerald-100",
        metaTextClass: "text-emerald-300/80",
        rgb: [16, 185, 129],
        baseCount: 4,
        opacity: 0.12,
        sizeRange: 70,
        blurRange: 18,
      };
    case "medium":
      return {
        borderClass: "border-amber-500/25 hover:border-amber-400/35",
        headerTextClass: "text-amber-100",
        metaTextClass: "text-amber-300/80",
        rgb: [245, 158, 11],
        baseCount: 6,
        opacity: 0.16,
        sizeRange: 90,
        blurRange: 22,
      };
    case "high":
      return {
        borderClass: "border-rose-600/30 hover:border-rose-500/40",
        headerTextClass: "text-rose-100",
        metaTextClass: "text-rose-300/80",
        rgb: [244, 63, 94],
        baseCount: 8,
        opacity: 0.22,
        sizeRange: 110,
        blurRange: 28,
      };
    default:
      return {
        borderClass: "border-white/5 hover:border-white/10",
        headerTextClass: "text-zinc-100",
        metaTextClass: "text-zinc-400",
        rgb: null,
        baseCount: 0,
        opacity: 0,
        sizeRange: 0,
        blurRange: 0,
      };
  }
}

import { Task } from "../types";
import { cn } from "@/libs/cn";
import { createMemo } from "solid-js";
import TagBadge from "@components/tags/tag-badge";

export default function TaskCard({
  task,
  onOpen,
  onAddTags,
}: {
  task: Task;
  onOpen?: () => void;
  onAddTags?: () => void;
}) {
  const { header } = task;
  const hasTags = (task.tags?.length ?? 0) > 0;
  const isDraft = task.isDraft;
  const due = task.dueDate ? new Date(task.dueDate) : undefined;

  const priority = task.priority;
  const borderClass =
    priority === "low"
      ? "border-emerald-500/20 hover:border-emerald-400/30"
      : priority === "medium"
        ? "border-amber-500/25 hover:border-amber-400/35"
        : priority === "high"
          ? "border-rose-600/30 hover:border-rose-500/40"
          : "border-white/5 hover:border-white/10";
  const headerTextClass =
    priority === "low"
      ? "text-emerald-100"
      : priority === "medium"
        ? "text-amber-100"
        : priority === "high"
          ? "text-rose-100"
          : "text-zinc-100";
  const metaTextClass =
    priority === "low"
      ? "text-emerald-300/80"
      : priority === "medium"
        ? "text-amber-300/80"
        : priority === "high"
          ? "text-rose-300/80"
          : "text-zinc-400";
  function getPriorityRGB(): [number, number, number] | null {
    if (priority === "low") return [16, 185, 129]; // emerald-500
    if (priority === "medium") return [245, 158, 11]; // amber-500
    if (priority === "high") return [244, 63, 94]; // rose-500
    return null;
  }

  function hashString(value: string): number {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i++) {
      hash ^= value.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return hash >>> 0;
  }

  function rng(seed: number): () => number {
    let t = seed + 0x6d2b79f5;
    return () => {
      t += 0x6d2b79f5;
      let x = t;
      x = Math.imul(x ^ (x >>> 15), x | 1);
      x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  const dots = createMemo(() => {
    const color = getPriorityRGB();
    if (!color) return [] as { left: string; top: string; size: number; blur: number; opacity: number; color: string }[];
    const baseCount = priority === "low" ? 4 : priority === "medium" ? 6 : 8;
    const seed = hashString(task.id + task.header + (task.createdAt?.toString() ?? ""));
    const rand = rng(seed);
    const [r, g, b] = color;
    const arr: { left: string; top: string; size: number; blur: number; opacity: number; color: string }[] = [];
    for (let i = 0; i < baseCount; i++) {
      const left = 5 + rand() * 90; // percent
      const top = 5 + rand() * 70; // percent
      const size = 40 + rand() * (priority === "high" ? 110 : priority === "medium" ? 90 : 70); // px
      const blur = 12 + rand() * (priority === "high" ? 28 : priority === "medium" ? 22 : 18); // px
      const opacity = priority === "high" ? 0.22 : priority === "medium" ? 0.16 : 0.12;
      arr.push({
        left: `${left}%`,
        top: `${top}%`,
        size,
        blur,
        opacity,
        color: `rgba(${r}, ${g}, ${b}, ${opacity})`,
      });
    }
    return arr;
  });

  function handleAddTagsClick(event: MouseEvent) {
    // Prevent the card's onClick (which opens the sheet) from firing
    event.stopPropagation();
    // Also prevent default to avoid any odd focus behavior
    event.preventDefault();
    if (onAddTags) onAddTags();
  }

  return (
    <article
      class={cn(
        "task-card group relative rounded-xl p-6 min-h-[110px] bg-black/50 backdrop-blur-sm border",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_8px_24px_-12px_rgba(0,0,0,0.8)] transition-colors duration-150 cursor-pointer",
        borderClass,
      )}
      onClick={onOpen}
    >
      {priority && (
        <div class="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          {dots().map((d) => (
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
      )}
      <header class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class={cn("text-base sm:text-lg font-semibold leading-snug line-clamp-2", headerTextClass)}>
            {header}
          </h2>
          <div class={cn("mt-1 flex items-center gap-2 text-[11px]", metaTextClass)}>
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
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
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

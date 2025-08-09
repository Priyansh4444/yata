import { Task } from "../types";
import TagBadge from "@components/tags/tag-badge";

export default function TaskCard({ task, onOpen, onAddTags }: { task: Task; onOpen?: () => void; onAddTags?: () => void }) {
  const { header } = task;
  const hasTags = (task.tags?.length ?? 0) > 0;

  function handleAddTagsClick(event: MouseEvent) {
    // Prevent the card's onClick (which opens the sheet) from firing
    event.stopPropagation();
    if (onAddTags) onAddTags();
  }

  return (
    <article
      class="
        task-card group relative rounded-xl p-6 min-h-[110px]
        bg-black/50 backdrop-blur-sm
        border border-white/5
        shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_8px_24px_-12px_rgba(0,0,0,0.8)]
        hover:border-white/10
        transition-colors duration-150
        cursor-pointer
      "
      onClick={onOpen}
    >
      <header class="flex items-start justify-between gap-3">
        <h2 class="text-base sm:text-lg font-semibold text-zinc-100 leading-snug line-clamp-2">
          {header}
        </h2>
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

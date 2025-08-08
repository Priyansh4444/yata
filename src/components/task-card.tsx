import { Task } from "../types";

export default function TaskCard({ task }: { task: Task }) {
  const { header, tags, description } = task;

  return (
    <article
      class="
        task-card group relative rounded-xl p-4
        bg-black/50 backdrop-blur-sm
        border border-white/5
        shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_8px_24px_-12px_rgba(0,0,0,0.8)]
        hover:border-white/10
        transition-colors duration-150
        cursor-grab active:cursor-grabbing
      "
    >
      <header class="flex items-start justify-between gap-3">
        <h2 class="text-sm font-medium text-zinc-100 leading-snug line-clamp-2">
          {header}
        </h2>

        {tags && tags.length > 0 && (
          <div class="flex flex-wrap gap-1.5 shrink-0">
            {tags.map((tag) => (
              <span class="px-2 py-0.5 text-[10px] rounded-md bg-white/5 text-zinc-300 border border-white/10">
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      <div class="mt-2.5">
        <p class="text-xs text-zinc-400/90 leading-relaxed">
          {description || ""}
        </p>
      </div>

      <footer class="mt-3">
        <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] bg-white/5 text-zinc-400 border border-white/10">
          • Todo
        </span>
      </footer>

      <div
        class="
          pointer-events-none absolute inset-0 rounded-xl
          ring-0 group-hover:ring-1 ring-white/5 transition duration-200
        "
      />
    </article>
  );
}

import { createMemo } from "solid-js";
import { createStore } from "solid-js/store";
import type { Task } from "@/types";

type Props = {
  onSave: (task: Task) => void;
  onCancel: () => void;
  initial?: Partial<Task>;
};

export default function InlineTaskEditor({onSave, onCancel, initial}: Props) {
  const [draft, setDraft] = createStore<Task>({
    header: initial?.header ?? "",
    description: initial?.description,
    tags: initial?.tags ?? [],
  });

  const canSave = createMemo(() => draft.header.trim().length > 0);

  function onSubmit() {
    if (!canSave()) return onCancel();
    const task: Task = {
      header: draft.header.trim(),
      description: draft.description?.trim() || undefined,
      tags: (draft.tags ?? []).map((t) => t.trim()).filter(Boolean),
    };
    onSave(task);
  }

  return (
    <div class="rounded-xl p-4 bg-black/50 backdrop-blur-sm border border-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_8px_24px_-12px_rgba(0,0,0,0.8)] space-y-2">
      <input
        class="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none"
        placeholder="Task title"
        value={draft.header}
        onInput={(e) => setDraft("header", e.currentTarget.value)}
        autofocus
      />
      <textarea
        class="w-full bg-transparent text-xs text-zinc-400 placeholder-zinc-600 outline-none resize-none"
        rows={3}
        placeholder="Description (optional)"
        value={draft.description || ""}
        onInput={(e) => setDraft("description", e.currentTarget.value)}
      />
      <input
        class="w-full bg-transparent text-[11px] text-zinc-300 placeholder-zinc-600 outline-none"
        placeholder="tags, comma,separated"
        value={(draft.tags ?? []).join(", ")}
        onInput={(e) =>
          setDraft(
            "tags",
            e.currentTarget.value
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          )
        }
      />
      <div class="pt-1 flex items-center gap-2">
        <button
          type="button"
          class="px-3 py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/15 text-white border border-white/10 disabled:opacity-50"
          disabled={!canSave()}
          onClick={onSubmit}
        >
          Save
        </button>
        <button
          type="button"
          class="px-3 py-1.5 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}



import { createMemo } from "solid-js";
import { createStore } from "solid-js/store";
import type { Task, Tag } from "@/types";
import TagPicker from "@components/tags/tag-picker";

type Props = {
  onSave: (task: Task) => void;
  onCancel: () => void;
  initial?: Partial<Task>;
  existingTags?: Tag[];
};

export default function InlineTaskEditor(props: Props) {
  const { onSave, onCancel, initial } = props;
  type FormState = {
    header: string;
    description: string | undefined;
    tags: Tag[];
  };

  const [form, setForm] = createStore<FormState>({
    header: initial?.header ?? "",
    description: initial?.description,
    tags: (initial?.tags ?? []) as Tag[],
  });

  const canSave = createMemo(() => form.header.trim().length > 0);

  function onTagsChange(tags: Tag[]) {
    setForm("tags", tags);
  }

  function handleHeaderInput(
    e: InputEvent & { currentTarget: HTMLInputElement },
  ) {
    setForm("header", e.currentTarget.value);
  }

  function handleDescriptionInput(
    e: InputEvent & { currentTarget: HTMLTextAreaElement },
  ) {
    setForm("description", e.currentTarget.value);
  }

  // no-op placeholder removed; TagPicker manages its own inputs

  function onSubmit() {
    if (!canSave()) return onCancel();
    const task: Task = {
      header: form.header.trim(),
      description: form.description?.trim() || undefined,
      tags: form.tags,
    };
    onSave(task);
  }

  return (
    <div class="rounded-xl p-4 bg-black/50 backdrop-blur-sm border border-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_8px_24px_-12px_rgba(0,0,0,0.8)] space-y-2">
      <input
        class="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none"
        placeholder="Task title"
        value={form.header}
        onInput={handleHeaderInput}
        autofocus
      />
      <textarea
        class="w-full bg-transparent text-xs text-zinc-400 placeholder-zinc-600 outline-none resize-none"
        rows={3}
        placeholder="Description (optional)"
        value={form.description || ""}
        onInput={handleDescriptionInput}
      />
      <TagPicker
        value={form.tags}
        onChange={onTagsChange}
        suggestions={props.existingTags}
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

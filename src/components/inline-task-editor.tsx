// Returns yyyy-MM-dd from a Date or string, using local time (not UTC)
function toLocalDateInputString(
  date: Date | string | undefined
): string | undefined {
  if (!date) return undefined;
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return undefined;
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}
import { createMemo } from "solid-js";
import { createStore } from "solid-js/store";
import type { Option, Task, Tag, Priority } from "@/types";
import TagPicker from "@components/tags/tag-picker";

type Props = {
  onSave: (updates: Partial<Task>) => void;
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
    priority?: Option<Priority>;
    // Keep dueDate as an ISO date string for the input; convert before save
    dueDate?: string;
  };

  const [form, setForm] = createStore<FormState>({
    header: initial?.header ?? "",
    description: initial?.description,
    tags: (initial?.tags ?? []) as Tag[],
    priority: initial?.priority,
    dueDate: toLocalDateInputString(initial?.dueDate),
  });

  const canSave = createMemo(() => form.header.trim().length > 0);

  function onTagsChange(tags: Tag[]) {
    setForm("tags", tags);
  }

  function handleHeaderInput(
    e: InputEvent & { currentTarget: HTMLInputElement }
  ) {
    setForm("header", e.currentTarget.value);
  }

  function handleDescriptionInput(
    e: InputEvent & { currentTarget: HTMLTextAreaElement }
  ) {
    setForm("description", e.currentTarget.value);
  }

  // no-op placeholder removed; TagPicker manages its own inputs

  function parseLocalDateInput(input: string | undefined): Date | undefined {
    if (!input) return undefined;
    const [y, m, d] = input.split("-").map(Number);
    if (!y || !m || !d) return undefined;
    const date = new Date(y, m - 1, d);
    return isNaN(date.getTime()) ? undefined : date;
  }

  function onSubmit() {
    if (!canSave()) return onCancel();
    const updates: Partial<Task> = {};
    const header = form.header.trim();
    if (header) updates.header = header;
    if (form.description && form.description.trim())
      updates.description = form.description.trim();
    if (form.tags && form.tags.length > 0) updates.tags = form.tags;
    if (form.priority !== undefined) updates.priority = form.priority;
    const dueDate = parseLocalDateInput(form.dueDate);
    if (dueDate) updates.dueDate = dueDate;
    onSave(updates);
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
      <div class="flex items-center gap-2">
        <select
          class="bg-transparent text-xs text-zinc-300 border border-white/10 rounded-md px-2 py-1"
          value={form.priority ?? ""}
          onChange={(e) =>
            setForm(
              "priority",
              (e.currentTarget.value || undefined) as Task["priority"]
            )
          }
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
          value={form.dueDate ?? ""}
          onInput={(e) =>
            setForm("dueDate", e.currentTarget.value || undefined)
          }
        />
      </div>
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

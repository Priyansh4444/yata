import { createSignal } from "solid-js";

export default function NewListCard({
  onAdd,
  onCancel,
}: {
  onAdd: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = createSignal("");

  function submit() {
    const v = name().trim();
    if (!v) return;
    onAdd(v);
    setName("");
  }
  return (
    <div class="flex-1 rounded-2xl border border-white/10 bg-gradient-radial from-white/5 via-white/0 to-transparent backdrop-blur-sm p-3 flex flex-col">
      <div class="sticky top-0 z-10 flex items-center justify-between px-2 py-2 rounded-xl bg-black/20 border-b border-white/5">
        <input
          class="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-600 outline-none"
          placeholder="Name your list"
          value={name()}
          onInput={(e) => setName(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.isComposing) return;
            if (e.key === "Enter") submit();
            if (e.key === "Escape") onCancel();
          }}
          autofocus
        />
      </div>
      <div class="mt-auto flex items-center justify-between pt-3 px-2">
        <div class="text-[11px] text-zinc-500">Press Enter to add</div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/15 text-white border border-white/10 disabled:opacity-50"
            disabled={name().trim().length === 0}
            onClick={submit}
          >
            Add list
          </button>
        </div>
      </div>
    </div>
  );
}

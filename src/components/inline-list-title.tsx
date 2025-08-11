import { Show, createSignal } from "solid-js";

export default function InlineListTitle({
  value,
  onSave,
}: {
  value: string;
  onSave?: (val: string) => void;
}) {
  const [isEditing, setIsEditing] = createSignal(false);
  const [text, setText] = createSignal(value);

  function commit() {
    const v = text().trim();
    if (!v) {
      setText(value);
      setIsEditing(false);
      return;
    }
    if (v !== value) onSave?.(v);
    setIsEditing(false);
  }

  return (
    <div>
      <Show
        when={isEditing()}
        fallback={
          <h3
            class="text-sm font-medium text-zinc-100 tracking-wide cursor-text"
            onDblClick={() => setIsEditing(true)}
            title="Double-click to rename"
          >
            {value}
          </h3>
        }
      >
        <input
          class="bg-transparent text-sm font-medium text-zinc-100 tracking-wide outline-none border-b border-white/10 focus:border-white/20"
          value={text()}
          onInput={(e) => setText(e.currentTarget.value)}
          onBlur={() => {
            if (!isEditing()) return;
            commit();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setText(value);
              setIsEditing(false);
            }
          }}
          autofocus
        />
      </Show>
    </div>
  );
}



import { createMemo, createSignal } from "solid-js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

export type Item = { id: string; label: string; meta?: string };

type MiniPickerProps = {
  items: Item[];
  value?: string | null;
  onChange?: (id: string | null) => void;
  placeholder?: string;
};

export default function MiniPicker(props: MiniPickerProps) {
  const [q, setQ] = createSignal("");
  const filtered = createMemo(() => {
    const term = q().toLowerCase().trim();
    if (!term) return props.items;
    return props.items.filter(
      (i) =>
        i.label.toLowerCase().includes(term) ||
        (i.meta || "").toLowerCase().includes(term),
    );
  });

  function formatItemLabel(id: string): string {
    const it =
      filtered().find((x) => x.id === id) ||
      props.items.find((x) => x.id === id);
    return `${it?.meta ? `[${it.meta}] ` : ""}${it?.label ?? id}`;
  }

  function formatSelectedLabel(): string {
    const id = props.value;
    if (!id) return "Select…";
    const it = props.items.find((x) => x.id === id);
    return it ? `${it.meta ? `[${it.meta}] ` : ""}${it.label}` : "Select…";
  }

  return (
    <div class="flex items-center gap-2">
      <input
        class="flex-1 bg-transparent text-white placeholder:text-white/50 rounded-md px-3 py-2 border border-white/20 focus:outline-none focus:ring-1 focus:ring-white/30"
        placeholder={props.placeholder || "Search..."}
        value={q()}
        onInput={(e) => setQ(e.currentTarget.value)}
      />
      <Select
        multiple={false}
        options={filtered().map((i) => i.id)}
        value={props.value ?? ""}
        onChange={(id) => props.onChange?.(id || null)}
        itemComponent={(itemProps) => (
          <SelectItem item={itemProps.item} class="text-white">
            {formatItemLabel(itemProps.item.textValue)}
          </SelectItem>
        )}
      >
        <SelectTrigger class="min-w-[220px] bg-transparent text-white border border-white/20">
          <span class="opacity-90">{formatSelectedLabel()}</span>
        </SelectTrigger>
        <SelectContent class="text-white bg-black" />
      </Select>
    </div>
  );
}

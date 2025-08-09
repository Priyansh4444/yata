import { For, Show, createMemo } from "solid-js";
import { createStore } from "solid-js/store";
import type { HexColor, Tag } from "@/types";
import TagBadge from "./tag-badge";

type Props = {
    value: Tag[];
    onChange: (tags: Tag[]) => void;
    suggestions?: Tag[];
};

export default function TagPicker(props: Props) {
    const [state, setState] = createStore<{ label: string; color: HexColor }>({
        label: "",
        color: "#3b82f6",
    });

    const canAdd = createMemo(
        () => state.label.trim().length > 0 && !props.value.some((t) => t.label.toLowerCase() === state.label.trim().toLowerCase()),
    );

    function addTag(tag: Tag) {
        if (props.value.some((t) => t.label.toLowerCase() === tag.label.toLowerCase())) return;
        props.onChange([...props.value, tag]);
    }

    function removeTag(label: string) {
        props.onChange(props.value.filter((t) => t.label !== label));
    }

    return (
        <div class="space-y-2">
            <div class="flex items-center gap-2">
                <input
                    class="flex-1 bg-transparent text-xs text-zinc-300 placeholder-zinc-600 outline-none border border-white/10 rounded-md px-2 py-1"
                    placeholder="New tag label"
                    value={state.label}
                    onInput={(e) => setState("label", e.currentTarget.value)}
                />
                <input
                    type="color"
                    class="h-7 w-7 rounded border border-white/10 bg-transparent p-0"
                    value={state.color}
                    onInput={(e) => setState("color", e.currentTarget.value as HexColor)}
                />
                <button
                    type="button"
                    class="px-2.5 py-1 rounded-md text-[11px] bg-white/10 hover:bg-white/15 border border-white/10 text-zinc-100 disabled:opacity-50"
                    disabled={!canAdd()}
                    onClick={() => {
                        addTag({ label: state.label.trim(), color: state.color });
                        setState("label", "");
                    }}
                >
                    Add tag
                </button>
            </div>

            <div class="flex flex-wrap gap-1.5">
                <For each={props.value}>
                    {(tag) => (
                        <span class="inline-flex items-center gap-1">
                            <TagBadge tag={tag} />
                            <button
                                type="button"
                                class="ml-1 h-4 w-4 grid place-items-center rounded hover:bg-white/10"
                                onClick={() => removeTag(tag.label)}
                                aria-label={`Remove ${tag.label}`}
                            >
                                ×
                            </button>
                        </span>
                    )}
                </For>
            </div>

            <Show when={(props.suggestions?.length ?? 0) > 0}>
                <div class="pt-1">
                    <p class="text-[11px] text-zinc-500 mb-1">Suggestions</p>
                    <div class="flex flex-wrap gap-1.5">
                        <For each={[...new Map((props.suggestions ?? []).map((t) => [t.label.toLowerCase(), t])).values()] as Tag[]}>
                            {(t) => (
                                <button
                                    type="button"
                                    class="px-2 py-0.5 text-[11px] rounded-md border border-white/10 hover:bg-white/10"
                                    style={{ "background-color": `${t.color}22`, color: t.color }}
                                    onClick={() => addTag(t)}
                                >
                                    {t.label}
                                </button>
                            )}
                        </For>
                    </div>
                </div>
            </Show>
        </div>
    );
}



Below is a minimal, clean Notion‑inspired Kanban UI with a bottom floating navbar. It uses Solid.js + anime.js for subtle interactions, Tailwind (optional but recommended) for styling, and pointer-based drag-and-drop. You can drop Tailwind and replace classes with your own CSS if you prefer.

Features
- Notion-like columns with rounded cards, soft shadows, ample whitespace
- Bottom floating navbar with blur, glassy look, dock-style hover
- Smooth micro-interactions using anime.js (mount, hover, drag-over)
- Simple local state (no backend), keyboard-friendly
- Accessible (aria-* labels, focus styles)

Setup
1) Create app
- With Vite: npm create vite@latest kanban-solid -- --template solid
- cd kanban-solid && npm i
- npm i animejs tailwindcss postcss autoprefixer
- npx tailwindcss init -p
- Configure Tailwind: in tailwind.config.js set content: ['./index.html','./src/**/*.{js,ts,jsx,tsx}']

2) index.css
Replace with Tailwind base plus a few custom utilities.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg: #0f1115;       /* deep neutral for a modern feel */
  --panel: #151821;    /* panel layer */
  --card: #1a1f2b;     /* card layer */
  --text: #e8e9ee;     /* primary text */
  --muted: #a6a8b6;    /* secondary text */
  --ring: #6aa4ff;     /* focus ring */
}

html, body, #root {
  height: 100%;
  background: var(--bg);
  color: var(--text);
}

.focus-ring:focus {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

.scrollbar-thin::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #2a3142;
  border-radius: 8px;
}
```

4) src/types.ts
```ts
export type Card = {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
};

export type Column = {
  id: string;
  title: string;
  cards: Card[];
};
```

5) src/utils.ts
```ts
export const uid = () => Math.random().toString(36).slice(2, 9);

export const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));
```

6) src/BottomDock.tsx
A floating bottom navbar with a dock effect (anime.js on hover).

```tsx
import { Component, onMount } from "solid-js";
import anime from "animejs";

type DockItem = {
  id: string;
  label: string;
  icon: string; // emoji or svg path
  onClick?: () => void;
};

const DockButton: Component<{ item: DockItem }> = (props) => {
  let btnRef!: HTMLButtonElement;

  const hoverIn = () => {
    anime({
      targets: btnRef,
      scale: 1.1,
      translateY: -4,
      duration: 180,
      easing: "easeOutQuad",
    });
  };
  const hoverOut = () => {
    anime({
      targets: btnRef,
      scale: 1,
      translateY: 0,
      duration: 180,
      easing: "easeOutQuad",
    });
  };

  return (
    <button
      ref={btnRef}
      type="button"
      aria-label={props.item.label}
      onClick={props.item.onClick}
      onMouseEnter={hoverIn}
      onMouseLeave={hoverOut}
      class="focus-ring grid place-items-center size-12 rounded-2xl bg-[#0f1220]/60 text-[var(--text)] hover:bg-[#14172a]/70 border border-white/5 shadow-lg"
    >
      <span class="text-xl">{props.item.icon}</span>
    </button>
  );
};

const BottomDock: Component<{ items: DockItem[] }> = (props) => {
  let dockRef!: HTMLDivElement;

  onMount(() => {
    anime({
      targets: dockRef,
      translateY: [24, 0],
      opacity: [0, 1],
      duration: 380,
      easing: "easeOutCubic",
    });
  });

  return (
    <div
      ref={dockRef}
      role="navigation"
      aria-label="Bottom dock"
      class="fixed left-1/2 -translate-x-1/2 bottom-6 z-50"
    >
      <div class="backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl rounded-3xl px-3 py-2">
        <div class="flex items-center gap-2">
          {props.items.map((it) => (
            <DockButton item={it} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BottomDock;
```

7) src/Kanban.tsx
Notion-like columns with drag-and-drop and subtle animations.

```tsx
import { createSignal, For, onMount, createEffect } from "solid-js";
import type { Column, Card } from "./types";
import anime from "animejs";
import { uid } from "./utils";

const sample: Column[] = [
  {
    id: "todo",
    title: "To do",
    cards: [
      { id: uid(), title: "Design landing hero", tags: ["design"] },
      { id: uid(), title: "Write product copy", tags: ["content"] },
    ],
  },
  {
    id: "doing",
    title: "In progress",
    cards: [{ id: uid(), title: "Implement auth", tags: ["dev"] }],
  },
  { id: "done", title: "Done", cards: [{ id: uid(), title: "Setup repo", tags: ["ops"] }] },
];

type DragState = {
  card?: Card;
  fromCol?: string;
  fromIndex?: number;
};

export default function Kanban() {
  const [columns, setColumns] = createSignal<Column[]>(sample);
  const [drag, setDrag] = createSignal<DragState>({});
  let boardRef!: HTMLDivElement;

  onMount(() => {
    anime({
      targets: boardRef.querySelectorAll("[data-col]"),
      opacity: [0, 1],
      translateY: [10, 0],
      delay: anime.stagger(80),
      duration: 280,
      easing: "easeOutQuad",
    });
  });

  const addCard = (colId: string) => {
    const title = prompt("New card title");
    if (!title) return;
    setColumns((prev) =>
      prev.map((c) =>
        c.id === colId
          ? { ...c, cards: [{ id: uid(), title }, ...c.cards] }
          : c
      )
    );
  };

  const onPointerDownCard = (e: PointerEvent, colId: string, index: number, card: Card) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ card, fromCol: colId, fromIndex: index });
    anime({
      targets: e.currentTarget as HTMLElement,
      scale: 1.02,
      boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
      duration: 120,
      easing: "easeOutQuad",
    });
  };

  const onPointerUpCard = (e: PointerEvent) => {
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    anime({
      targets: e.currentTarget as HTMLElement,
      scale: 1,
      boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
      duration: 120,
      easing: "easeOutQuad",
    });
    setDrag({});
  };

  const moveCard = (toCol: string, toIndex?: number) => {
    const d = drag();
    if (!d.card || d.fromCol == null || d.fromIndex == null) return;
    if (d.fromCol === toCol && toIndex === d.fromIndex) return;

    setColumns((prev) => {
      const cols = prev.map((c) => ({ ...c, cards: [...c.cards] }));
      const from = cols.find((c) => c.id === d.fromCol)!;
      const to = cols.find((c) => c.id === toCol)!;

      // remove from source
      const [moved] = from.cards.splice(d.fromIndex, 1);
      // insert to target
      const idx = toIndex == null ? to.cards.length : Math.max(0, Math.min(toIndex, to.cards.length));
      to.cards.splice(idx, 0, moved);
      return cols;
    });

    setDrag({ card: undefined, fromCol: undefined, fromIndex: undefined });
  };

  const onDragEnterColumn = (colId: string) => {
    const el = document.querySelector(`[data-col="${colId}"] .drop-glow`) as HTMLElement | null;
    if (!el) return;
    anime({ targets: el, opacity: [0, 1], scaleY: [0.96, 1], duration: 160, easing: "easeOutQuad" });
  };

  const onDragLeaveColumn = (colId: string) => {
    const el = document.querySelector(`[data-col="${colId}"] .drop-glow`) as HTMLElement | null;
    if (!el) return;
    anime({ targets: el, opacity: [1, 0], scaleY: [1, 0.98], duration: 140, easing: "easeOutQuad" });
  };

  const onCardEnter = (colId: string, index: number) => {
    const d = drag();
    if (!d.card) return;
    // If hovering another card spot, reorder preview by moving to that index
    moveCard(colId, index);
    setDrag({ card: d.card, fromCol: colId, fromIndex: index });
  };

  const onColumnEnd = (colId: string) => {
    const d = drag();
    if (!d.card) return;
    // Drop to end of column
    moveCard(colId, undefined);
  };

  return (
    <div class="px-6 pb-24"> {/* extra bottom padding to avoid dock overlap */}
      <header class="sticky top-0 z-10 -mx-6 px-6 py-4 backdrop-blur-sm bg-[var(--bg)]/65 border-b border-white/5">
        <div class="flex items-center gap-3">
          <div class="size-7 rounded-md bg-indigo-500/80 grid place-items-center text-white font-bold">K</div>
          <h1 class="text-lg md:text-xl font-semibold">Kanban</h1>
          <span class="text-sm text-[var(--muted)]">• Notion‑style</span>
        </div>
      </header>

      <div
        ref={boardRef}
        class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
        role="list"
        aria-label="Kanban columns"
      >
        <For each={columns()}>
          {(col) => (
            <section
              data-col={col.id}
              class="rounded-2xl bg-[var(--panel)]/80 border border-white/5 shadow-[0_6px_24px_rgba(0,0,0,0.25)] flex flex-col min-h-[50vh]"
              onPointerLeave={[onDragLeaveColumn, col.id]}
              onPointerEnter={[onDragEnterColumn, col.id]}
            >
              <div class="flex items-center justify-between p-3 md:p-4">
                <div class="flex items-center gap-2">
                  <div class="size-2.5 rounded-full bg-indigo-400/90" />
                  <h2 class="font-medium">{col.title}</h2>
                  <span class="text-xs text-[var(--muted)]">({col.cards.length})</span>
                </div>
                <button
                  class="focus-ring text-xs px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10"
                  onClick={[addCard, col.id]}
                >
                  + Add
                </button>
              </div>

              <div class="relative">
                <div class="drop-glow pointer-events-none absolute inset-0 rounded-2xl opacity-0 ring-2 ring-indigo-500/25 transition" />
              </div>

              <ol class="flex-1 p-3 md:p-4 space-y-2 overflow-auto scrollbar-thin" role="list">
                <For each={col.cards}>
                  {(card, index) => (
                    <li
                      role="listitem"
                      class="rounded-xl bg-[var(--card)] border border-white/5 p-3 shadow-[0_4px_16px_rgba(0,0,0,0.2)] cursor-grab active:cursor-grabbing select-none"
                      onPointerDown={(e) => onPointerDownCard(e as PointerEvent, col.id, index(), card)}
                      onPointerUp={(e) => onPointerUpCard(e as PointerEvent)}
                      onPointerEnter={() => onCardEnter(col.id, index())}
                    >
                      <div class="flex items-start justify-between gap-2">
                        <h3 class="font-medium leading-5">{card.title}</h3>
                      </div>
                      {card.description && (
                        <p class="text-sm text-[var(--muted)] mt-1">{card.description}</p>
                      )}
                      {card.tags && card.tags.length > 0 && (
                        <div class="mt-2 flex flex-wrap gap-2">
                          {card.tags.map((t) => (
                            <span class="text-[10px] uppercase tracking-wide bg-white/5 border border-white/10 px-2 py-0.5 rounded-md text-[var(--muted)]">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </li>
                  )}
                </For>

                <button
                  onClick={[addCard, col.id]}
                  class="w-full mt-2 text-left text-sm text-[var(--muted)] hover:text-[var(--text)] rounded-lg px-2 py-1 hover:bg-white/5 focus-ring"
                >
                  + New
                </button>
              </ol>

              <button
                class="m-3 mb-4 text-xs text-[var(--muted)] hover:text-[var(--text)] px-2 py-1 rounded-md focus-ring self-start"
                onPointerEnter={() => onDragEnterColumn(col.id)}
                onPointerLeave={() => onDragLeaveColumn(col.id)}
                onClick={() => onColumnEnd(col.id)}
                aria-label={`Drop to end of ${col.title}`}
              >
                Drop here
              </button>
            </section>
          )}
        </For>
      </div>
    </div>
  );
}
```

8) src/App.tsx
Tie board and dock together.

```tsx
import BottomDock from "./BottomDock";
import Kanban from "./Kanban";

export default function App() {
  const dockItems = [
    { id: "search", label: "Search", icon: "🔎", onClick: () => alert("Search…") },
    { id: "add", label: "New card", icon: "➕", onClick: () => alert("Global add…") },
    { id: "inbox", label: "Inbox", icon: "📥", onClick: () => alert("Inbox…") },
    { id: "settings", label: "Settings", icon: "⚙️", onClick: () => alert("Settings…") },
  ];

  return (
    <>
      <Kanban />
      <BottomDock items={dockItems} />
    </>
  );
}
```

Run
npm run dev

Notes and options
- Animations: We used anime.js for mount, hover, and drop glow. You can further animate column reorder or ghost previews.
- Accessibility: Pointer-based DnD keeps it simple. For keyboard DnD, add roving tabindex and Enter/Arrow controls.
- Persistence: Store `columns()` to `localStorage` on change if you want offline support like Notion clones.
- Styling: The palette and shadows are tuned for a crisp Notion-like vibe with a slightly darker, glassy aesthetic. Replace Tailwind classes with your preferred CSS if desired.

References and inspiration
- Notion-like visual kanban reference: a similar open-source approach without external DnD libraries [github.com](https://github.com/SuryaNelakanti/notion-lookalike)
- Tailwind kanban layouts for baseline structure [demo.themesberg.com](https://demo.themesberg.com/windster-pro/kanban/)
- General drag-and-drop kanban patterns in React/Socket.io (conceptual patterns still relevant) [suprsend.com](https://www.suprsend.com/post/how-to-create-a-drag-and-drop-kanban-board-in-6-steps-using-react-node-js-and-socket-io)

If you want this without Tailwind, say “no Tailwind” and I’ll output a plain CSS version.
import { For, createMemo, createSignal, onMount } from "solid-js";
import { loadBoard } from "@/libs/storage";
import type { TaskList } from "@/types";

export default function SchedulePage() {
  const [lists, setLists] = createSignal<TaskList[]>([]);
  onMount(async () => setLists((await loadBoard()) ?? []));

  const dueNow = createMemo(() => {
    const now = Date.now();
    const upcoming: { list: string; id: string; header: string; due?: Date }[] =
      [];
    for (const l of lists()) {
      for (const t of l.tasks) {
        if (t.completedAt) continue;
        const when = t.scheduledAt || t.dueDate;
        if (!when) continue;
        const ts =
          when instanceof Date ? when.getTime() : new Date(when).getTime();
        if (ts <= now) {
          upcoming.push({
            list: l.header,
            id: t.id,
            header: t.header,
            due: when as Date,
          });
        }
      }
    }
    return upcoming.sort(
      (task1, task2) => (task1.due?.getTime() || 0) - (task2.due?.getTime() || 0),
    );
  });

  return (
    <main class="min-h-screen w-screen bg-black text-white p-8">
      <h1 class="text-2xl font-semibold mb-6">Schedule</h1>
      <section class="p-4 rounded-xl border border-white/15 bg-black">
        <h2 class="text-lg font-medium mb-3">Tasks due now</h2>
        <ul class="space-y-2">
          <For each={dueNow()}>
            {(task) => (
              <li class="flex items-center justify-between">
                <span>
                  <span class="opacity-80">[{task.list}]</span> {task.header}
                </span>
                <span class="text-xs opacity-70">
                  {task.due?.toLocaleString?.() || ""}
                </span>
                <span>
                  <a
                    href={`/focus?taskId=${task.id}`}
                    class="px-2 py-1 rounded-md border border-white/25 hover:bg-white/10 text-xs"
                  >
                    Focus
                  </a>
                </span>
              </li>
            )}
          </For>
        </ul>
      </section>
    </main>
  );
}

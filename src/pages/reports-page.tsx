import { For, createMemo, createSignal, onMount } from "solid-js";
import { loadBoard } from "@/libs/storage";
import type { TaskList } from "@/types";

function secondsToHrsMins(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}hr ${m}m`;
}

export default function ReportsPage() {
  const [lists, setLists] = createSignal<TaskList[]>([]);
  onMount(async () => setLists((await loadBoard()) ?? []));

  const summaryByList = createMemo(() => {
    const rows = lists().map((list) => {
      let total = 0;
      for (const task of list.tasks) total += task.timeSpentSeconds || 0;
      return { list: list.header, seconds: total };
    });
    const grand = rows.reduce((acc, r) => acc + r.seconds, 0);
    return { rows, grand };
  });

  return (
    <main class="min-h-screen w-screen bg-black text-white p-8">
      <h1 class="text-2xl font-semibold mb-6">Reports</h1>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section class="p-4 rounded-xl border border-white/15 bg-black">
          <h2 class="text-lg font-medium mb-3">Time by List</h2>
          <ul class="space-y-2">
            <For each={summaryByList().rows}>
              {(row) => (
                <li class="flex items-center justify-between">
                  <span>{row.list}</span>
                  <span class="opacity-80">
                    {secondsToHrsMins(row.seconds)}
                  </span>
                </li>
              )}
            </For>
          </ul>
          <div class="mt-4 text-sm opacity-80">
            Total: {secondsToHrsMins(summaryByList().grand)}
          </div>
        </section>
      </div>
    </main>
  );
}

import { createMemo, createSignal, Show, onMount } from "solid-js";
import { loadBoard, saveBoard } from "@/libs/storage";
import type { TaskList } from "@/types";
import { openWindow } from "@/libs/window";
import MiniShell from "@/components/mini/mini-shell";
import MiniPicker from "@/components/mini/mini-picker";
import MiniProgress from "@/components/mini/mini-progress";
import MiniActions, { MiniButton } from "@/components/mini/mini-actions";
import { moveTaskToCompleted } from "@/libs/board";

export default function FocusPage() {
  const [lists, setLists] = createSignal<TaskList[]>([]);
  const [focusedTaskId, setFocusedTaskId] = createSignal<string | null>(null);

  onMount(async () => {
    const board = (await loadBoard()) ?? [];
    setLists(board);
    const search = new URLSearchParams(window.location.search);
    const taskId = search.get("taskId");
    if (taskId) setFocusedTaskId(taskId);
  });

  const currentTask = () => {
    const id = focusedTaskId();
    if (!id) return null;
    for (const list of lists()) {
      const task = list.tasks.find((x) => x.id === id);
      if (task) return task;
    }
    return null;
  };

  const allTasks = createMemo(() => {
    const items: { id: string; header: string; list: string }[] = [];
    for (const list of lists()) {
      for (const task of list.tasks) {
        if (task.isDraft) continue;
        items.push({
          id: task.id,
          header: task.header || "Untitled",
          list: list.header,
        });
      }
    }
    return items;
  });

  const filtered = allTasks;

  async function moveToCompleted(taskId: string) {
    const board = lists();
    const next = moveTaskToCompleted(board, taskId);
    await saveBoard(next);
    setLists(next);
  }

  return (
    <MiniShell>
      <div class="space-y-3">
        <MiniPicker
          items={filtered().map((task) => ({
            id: task.id,
            label: task.header,
            meta: task.list,
          }))}
          value={focusedTaskId()}
          onChange={(id) => {
            setFocusedTaskId(id);
            const url = new URL(window.location.href);
            if (id) url.searchParams.set("taskId", id);
            else url.searchParams.delete("taskId");
            window.history.replaceState({}, "", url);
          }}
          placeholder="Search tasks or lists..."
        />
        <Show
          when={!!currentTask()}
          fallback={<div>Select a task to focus.</div>}
        >
          <div class="space-y-4">
            <h1 class="text-2xl font-semibold text-white">
              {currentTask()!.header}
            </h1>
            <div class="flex items-center gap-3 text-xs opacity-90 text-white/80">
              <Show when={currentTask()!.estimatedSeconds}>
                <span>
                  Est: {Math.round((currentTask()!.estimatedSeconds || 0) / 60)}{" "}
                  min
                </span>
              </Show>
              <Show when={currentTask()!.timeSpentSeconds}>
                <span>
                  Done:{" "}
                  {Math.round((currentTask()!.timeSpentSeconds || 0) / 60)} min
                </span>
              </Show>
            </div>
            <MiniProgress
              value={
                (currentTask()!.timeSpentSeconds || 0) /
                Math.max(1, currentTask()!.estimatedSeconds || 1)
              }
            />
            <MiniActions>
              <MiniButton
                onClick={() =>
                  openWindow({
                    label: `timer-${Date.now()}`,
                    title: "Timer",
                    url: `/timer?taskId=${currentTask()!.id}`,
                    width: 420,
                    height: 260,
                    alwaysOnTop: true,
                  })
                }
              >
                Start Timer
              </MiniButton>
              <MiniButton onClick={() => moveToCompleted(currentTask()!.id)}>
                Move to Completed
              </MiniButton>
            </MiniActions>
          </div>
        </Show>
      </div>
    </MiniShell>
  );
}

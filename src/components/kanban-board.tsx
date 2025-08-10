import { TaskList } from "@/types";
import KanbanList from "@components/task-list";
import { For, Show, createSignal } from "solid-js";
import { createTaskList } from "@/utils";

export default function KanbanBoard({ taskLists }: { taskLists: TaskList[] }) {
  const [lists, setLists] = createSignal<TaskList[]>(taskLists);
  const [isAdding, setIsAdding] = createSignal(false);
  const [newListName, setNewListName] = createSignal("");

  function addList(name?: string) {
    const header = (name ?? newListName()).trim() || "New list";
    const newList = createTaskList(header, []);
    setLists((prev) => [...prev, newList]);
    setNewListName("");
    setIsAdding(false);
  }

  function renameListAt(index: number, newHeader: string) {
    setLists((prev) => prev.map((l, i) => (i === index ? { ...l, header: newHeader } : l)));
  }

  function startAdd() {
    setIsAdding(true);
    setNewListName("");
  }

  function cancelAdd() {
    setIsAdding(false);
    setNewListName("");
  }

  return (
    <div class="kanban-board h-full flex flex-row gap-6 overflow-x-auto pb-4 scrollbar-black">
      <For each={lists()}>
        {(list, i) => (
          <KanbanList
            taskList={list}
            onRenameList={(name) => renameListAt(i(), name)}
          />
        )}
      </For>

      <section class="column flex flex-col h-full rounded-2xl min-w-[320px] w-[360px] max-w-[400px]">
        <Show
          when={isAdding()}
          fallback={
            <div class="flex-1 rounded-2xl border border-dashed border-white/10 bg-black/30 backdrop-blur-sm p-3">
              <button
                type="button"
                class="h-8 px-2 text-xs rounded-md bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10"
                onClick={startAdd}
                title="Add a new list"
              >
                + New list
              </button>
            </div>
          }
        >
          <div class="flex-1 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm p-3 flex flex-col">
            <div class="sticky top-0 z-10 flex items-center justify-between px-2 py-2 rounded-xl bg-black/20 border-b border-white/5">
              <input
                class="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-600 outline-none"
                placeholder="List name"
                value={newListName()}
                onInput={(e) => setNewListName(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addList();
                  if (e.key === "Escape") cancelAdd();
                }}
                autofocus
              />
            </div>
            <div class="mt-auto flex items-center justify-end gap-2 pt-3 px-2">
              <button
                type="button"
                class="px-3 py-1.5 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10"
                onClick={cancelAdd}
              >
                Cancel
              </button>
              <button
                type="button"
                class="px-3 py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/15 text-white border border-white/10 disabled:opacity-50"
                disabled={newListName().trim().length === 0}
                onClick={() => addList()}
              >
                Add list
              </button>
            </div>
          </div>
        </Show>
      </section>
    </div>
  );
}

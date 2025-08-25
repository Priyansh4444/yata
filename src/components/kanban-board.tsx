import { TaskList } from "@/types";
import KanbanList from "@/components/task-list/task-list";
import { For, Show, createSignal, onMount, onCleanup } from "solid-js";
import { createStore, reconcile, unwrap } from "solid-js/store";
import { createTaskList } from "@/utils";
import NewListCard from "@/components/task-list/task-list.create";
import { createUndoRedo } from "@/libs/undo";

export default function KanbanBoard({ taskLists }: { taskLists: TaskList[] }) {
  const [lists, setLists] = createStore<TaskList[]>(taskLists);
  const [isAdding, setIsAdding] = createSignal<boolean>(false);
  const [newListName, setNewListName] = createSignal<string>("");
  const history = createUndoRedo<TaskList[]>({ limit: 100 });

  function snapshotBoard() {
    // Clone only the board structure to avoid regenerating per-card random visuals
    // Getting the raw data  https://docs.solidjs.com/concepts/stores#extracting-raw-data-with-unwrap
    history.push(unwrap(lists));
  }

  function addList(name?: string) {
    snapshotBoard();
    const header = (name ?? newListName()).trim();
    if (header.length === 0) return; // no-op on empty input
    const newList = createTaskList(header, []);
    setLists(taskLists.length, newList);
    setNewListName("");
    setIsAdding(false);
  }

  function renameListAt(index: number, newHeader: string) {
    setLists(index, (taskList) => {
      return {
        ...taskList,
        header: newHeader.trim(),
      };
    });
  }

  function deleteListAt(index: number) {
    snapshotBoard();
    const next = lists.filter((_, i) => i !== index);
    setLists(reconcile(next)); // reconcile to avoid non diff data to trigger re-renders
  }

  function startAdd() {
    setIsAdding(true);
    setNewListName("");
  }

  function cancelAdd() {
    setIsAdding(false);
    setNewListName("");
  }

  function handleKeydown(e: KeyboardEvent) {
    const isCtrl = e.ctrlKey || e.metaKey;
    if (!isCtrl) return;
    if (e.key.toLowerCase() === "z") {
      e.preventDefault();
      const prev = history.undo(
        (lists as unknown as TaskList[]).map((l) => ({
          header: l.header,
          tasks: l.tasks,
        })),
      );
      if (prev) setLists(prev as TaskList[]);
    } else if (e.key.toLowerCase() === "y") {
      e.preventDefault();
      const next = history.redo(
        (lists as unknown as TaskList[]).map((l) => ({
          header: l.header,
          tasks: l.tasks,
        })),
      );
      if (next) setLists(next as TaskList[]);
    }
  }

  onMount(() => window.addEventListener("keydown", handleKeydown));
  onCleanup(() => window.removeEventListener("keydown", handleKeydown));

  return (
    <div class="kanban-board h-full flex flex-row gap-6 overflow-x-auto pb-4 scrollbar-black">
      <For each={lists}>
        {(list, i) => (
          <KanbanList
            taskList={list}
            onRenameList={(name) => renameListAt(i(), name)}
            onDeleteList={() => deleteListAt(i())}
          />
        )}
      </For>

      <section class="column flex flex-col h-full rounded-2xl min-w-[320px] w-[360px] max-w-[400px]">
        <Show
          when={isAdding()}
          fallback={
            <button
              type="button"
              class="rounded-2xl border border-dashed border-white/10 bg-black/30 backdrop-blur-sm p-4 group relative overflow-hidden min-h-[140px] grid place-items-center"
              onClick={startAdd}
              title="Add a new list"
            >
              <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div class="absolute -top-16 -left-16 h-36 w-36 rounded-full bg-emerald-400/10 blur-2xl" />
                <div class="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-blue-500/10 blur-2xl" />
              </div>
              <div class="relative z-10 flex flex-col items-center gap-2">
                <span class="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] group-hover:bg-white/[0.08] transition-colors ring-1 ring-inset ring-white/5 text-zinc-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    class="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
                <span class="text-xs text-zinc-300">New list</span>
              </div>
            </button>
          }
        >
          <NewListCard onAdd={(n) => addList(n)} onCancel={cancelAdd} />
        </Show>
      </section>
    </div>
  );
}

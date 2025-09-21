import type { Id } from "@thisbeyond/solid-dnd";
import {
  DragDropProvider,
  DragDropSensors,
  DragOverlay,
  SortableProvider,
  type DragEventHandler,
  type Draggable,
  type Droppable,
} from "@thisbeyond/solid-dnd";
import { For, Show, createSignal, onCleanup, onMount } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import KanbanList from "@/components/task-list/task-list";
import NewListCard from "@/components/task-list/task-list.create";
import type { Task, TaskList } from "@/types";
import { createTaskList } from "@/utils";
import { loadBoard, saveBoard } from "@/libs/storage";
import {
  boardCollisionDetector,
  computeMovedLists,
  isGroup,
} from "./kanban-board/dnd";
import { computeInsertIndexForNewList } from "./kanban-board/insert";
import { COMPLETED_LIST_ID } from "@/libs/dnd-helpers";
import { watchBoardFile, type BoardWatchHandle } from "@/libs/board";

export default function KanbanBoard() {
  const [lists, setLists] = createStore<TaskList[]>([]);
  const [addingList, setAddingList] = createSignal(false);

  onMount(async () => {
    const loaded = await loadBoard();
    if (loaded && loaded.length > 0) {
      const hasCompleted = loaded.some((l) => l.id === COMPLETED_LIST_ID);
      const next = hasCompleted
        ? loaded
        : [
          ...loaded,
          { id: COMPLETED_LIST_ID, header: "Completed", tasks: [] },
        ];
      setLists(reconcile(next));
      if (next !== loaded) await saveBoard(next);
    } else {
      // Start with Completed column by default
      const initial = [
        { id: COMPLETED_LIST_ID, header: "Completed", tasks: [] },
      ];
      setLists(initial);
      await saveBoard(initial);
    }
  });

  // Watch external changes to board.json and refresh state
  onMount(() => {
    let BoardHandler: BoardWatchHandle = null;

    async function startWatchingBoardFile() {
      BoardHandler = await watchBoardFile(async () => {
        const fresh = await loadBoard();
        if (!fresh) return;
        const same = JSON.stringify(fresh) === JSON.stringify(lists);
        if (!same) setLists(reconcile(fresh));
      });
    }

    startWatchingBoardFile();
    onCleanup(() => {
      void BoardHandler?.close();
    });
  });

  const listIds = () => lists.map((l) => l.id);

  function updateListTasks(listId: string, tasks: Task[]) {
    const idx = lists.findIndex((l) => l.id === listId);
    if (idx === -1) return;
    const next = lists.map((l, i) => (i === idx ? { ...l, tasks } : l));
    setLists(reconcile(next));
    void saveBoard(next);
  }

  function renameList(listId: string, name: string) {
    const idx = lists.findIndex((l) => l.id === listId);
    if (idx === -1) return;
    const next = lists.map((l, i) => (i === idx ? { ...l, header: name } : l));
    setLists(reconcile(next));
    void saveBoard(next);
  }

  function deleteList(listId: string) {
    if (listId === COMPLETED_LIST_ID) return; // never delete Completed
    const next = lists.filter((l) => l.id !== listId);
    setLists(reconcile(next));
    void saveBoard(next);
  }

  async function addList(name: string) {
    const newList = createTaskList(name, []);
    let next: TaskList[];
    if (lists.length === 0) {
      next = [newList];
    } else {
      const insertAt = computeInsertIndexForNewList(lists);
      next = lists.slice();
      next.splice(insertAt, 0, newList);
    }
    setLists(reconcile(next));
    setAddingList(false);
    await saveBoard(next);
  }

  function findTask(
    taskId: Id,
  ): { listIndex: number; taskIndex: number } | null {
    for (let li = 0; li < lists.length; li++) {
      const ti = lists[li].tasks.findIndex((t) => t.id === taskId);
      if (ti !== -1) return { listIndex: li, taskIndex: ti };
    }
    return null;
  }

  const collisionDetector = boardCollisionDetector;

  function move(draggable: Draggable, droppable: Droppable) {
    const next = computeMovedLists(lists, draggable, droppable);
    if (!next) return;
    setLists(reconcile(next));
  }

  const onDragOver: DragEventHandler = ({ draggable, droppable }) => {
    if (!draggable || !droppable) return;
    // Avoid reordering lists during hover; only finalize on drag end.
    if (isGroup(draggable)) return;
    move(draggable, droppable);
  };

  const onDragEnd: DragEventHandler = async ({ draggable, droppable }) => {
    if (!draggable || !droppable) return;
    move(draggable, droppable);
    await saveBoard(lists);
  };

  return (
    <div class="kanban-board h-full flex flex-row gap-6 overflow-x-auto pb-4 scrollbar-black" style={{ "max-height": "calc(100vh - 160px)" }}>
      <DragDropProvider
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        collisionDetector={collisionDetector}
      >
        <DragDropSensors />
        <div class="columns flex flex-row gap-4 sm:gap-6 items-start">
          <SortableProvider ids={listIds()}>
            <For each={lists}>
              {(list) => (
                <KanbanList
                  taskList={list}
                  listId={list.id}
                  onRenameList={(name) => renameList(list.id, name)}
                  onDeleteList={() => deleteList(list.id)}
                  onTasksChange={(tasks) => updateListTasks(list.id, tasks)}
                  isGroupDraggable={list.id !== COMPLETED_LIST_ID}
                />
              )}
            </For>
          </SortableProvider>

          <Show when={!addingList()}>
            <button
              type="button"
              class="min-w-[280px] sm:min-w-[320px] w-[320px] sm:w-[360px] max-w-[400px] h-[48px] sm:h-[52px] rounded-xl border border-dashed border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20 bg-black/10"
              onClick={() => setAddingList(true)}
            >
              + Add list
            </button>
          </Show>
          <Show when={addingList()}>
            <div class="min-w-[280px] sm:min-w-[320px] w-[320px] sm:w-[360px] max-w-[400px]">
              <NewListCard
                onAdd={addList}
                onCancel={() => setAddingList(false)}
              />
            </div>
          </Show>
        </div>

        <DragOverlay>
          {(draggable) => {
            if (!draggable) return null;
            if (isGroup(draggable)) {
              const list = lists.find((l) => l.id === draggable.id);
              if (!list) return null;
              return (
                <div class="column bg-black/40 border border-white/10 rounded-2xl">
                  <div class="px-4 py-3 border-b border-white/10">
                    {list.header}
                  </div>
                  <div class="p-3 space-y-3">
                    <For each={list.tasks}>
                      {(t) => (
                        <div class="rounded-xl px-4 py-2 bg-black/30 border border-white/10 text-zinc-200">
                          {t.header}
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              );
            }
            const loc = findTask(draggable.id);
            if (!loc) return null;
            const task = lists[loc.listIndex].tasks[loc.taskIndex];
            return (
              <div class="rounded-xl px-4 py-2 bg-black/60 border border-white/10 text-zinc-200 max-w-[360px]">
                {task.header}
              </div>
            );
          }}
        </DragOverlay>
      </DragDropProvider>
    </div>
  );
}

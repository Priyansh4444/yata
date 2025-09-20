import type { Id } from "@thisbeyond/solid-dnd";
import {
  DragDropProvider,
  DragDropSensors,
  DragOverlay,
  SortableProvider,
  closestCenter,
  type DragEventHandler,
  type Draggable,
  type Droppable,
  type CollisionDetector,
} from "@thisbeyond/solid-dnd";
import { For, Show, createSignal, onMount } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import KanbanList from "@/components/task-list/task-list";
import NewListCard from "@/components/task-list/task-list.create";
import type { Task, TaskList } from "@/types";
import { createTaskList } from "@/utils";
import { loadBoard, saveBoard } from "@/libs/storage";

function isGroup(x: Draggable | Droppable | undefined | null) {
  return !!x && x.data?.type === "group";
}

export default function KanbanBoard() {
  const [lists, setLists] = createStore<TaskList[]>([]);
  const [addingList, setAddingList] = createSignal(false);

  onMount(async () => {
    const loaded = await loadBoard();
    if (loaded && loaded.length > 0) {
      setLists(reconcile(loaded));
    } else {
      // Start with one empty list to get going
      setLists([createTaskList("Todo", [])]);
      await saveBoard([createTaskList("Todo", [])]);
    }
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
    const next = lists.filter((l) => l.id !== listId);
    setLists(reconcile(next));
    void saveBoard(next);
  }

  async function addList(name: string) {
    const next = [...lists, createTaskList(name, [])];
    setLists(reconcile(next));
    setAddingList(false);
    await saveBoard(next);
  }

  function findTask(taskId: Id): { listIndex: number; taskIndex: number } | null {
    for (let li = 0; li < lists.length; li++) {
      const ti = lists[li].tasks.findIndex((t) => t.id === taskId);
      if (ti !== -1) return { listIndex: li, taskIndex: ti };
    }
    return null;
  }

  const collisionDetector: CollisionDetector = (draggable, droppables, context) => {
    const closestGroup = closestCenter(
      draggable,
      droppables.filter((d) => isGroup(d)),
      context,
    );
    if (isGroup(draggable)) return closestGroup;
    if (closestGroup) {
      const closestItem = closestCenter(
        draggable,
        droppables.filter((d) => !isGroup(d) && d.data.group === closestGroup.id),
        context,
      );
      return closestItem ?? closestGroup;
    }
    return null;
  };

  function move(draggable: Draggable, droppable: Droppable) {
    if (!draggable || !droppable) return;

    const draggableIsGroup = isGroup(draggable);
    const droppableIsGroup = isGroup(droppable);

    if (draggableIsGroup) {
      const from = lists.findIndex((l) => l.id === draggable.id);
      const targetGroupId = droppableIsGroup ? droppable.id : droppable.data.group;
      const to = lists.findIndex((l) => l.id === targetGroupId);
      if (from === -1 || to === -1 || from === to) return;
      const next = lists.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      setLists(reconcile(next));
      return;
    }

    // Item move
    const loc = findTask(draggable.id);
    if (!loc) return;
    const sourceListIndex = loc.listIndex;
    const sourceTaskIndex = loc.taskIndex;

    const targetGroupId = droppableIsGroup ? droppable.id : droppable.data.group;
    const targetListIndex = lists.findIndex((l) => l.id === targetGroupId);
    if (targetListIndex === -1) return;

    // If within the same list, let the list component handle reordering to avoid conflicts
    if (targetListIndex === sourceListIndex) {
      // Debug
      console.debug("[DND][Board] Skip within-list move (handled locally)", {
        listId: targetGroupId,
        draggableId: draggable.id,
        droppableId: droppableIsGroup ? null : droppable.id,
      });
      return;
    }

    // Build next lists with shallow copies
    const next = lists.map((l) => ({ ...l, tasks: [...l.tasks] }));

    // Remove from source
    const [movedTask] = next[sourceListIndex].tasks.splice(sourceTaskIndex, 1);
    if (!movedTask) return;

    // Determine insertion index
    let insertIndex = next[targetListIndex].tasks.length; // default end
    if (!droppableIsGroup) {
      const idx = next[targetListIndex].tasks.findIndex((t) => t.id === droppable.id);
      if (idx !== -1) insertIndex = idx; // insert before the target item
    }

    next[targetListIndex].tasks.splice(insertIndex, 0, movedTask);
    console.debug("[DND][Board] Cross-list move", {
      fromListId: lists[sourceListIndex].id,
      toListId: lists[targetListIndex].id,
      fromTaskIndex: sourceTaskIndex,
      toInsertIndex: insertIndex,
      taskId: draggable.id,
    });
    setLists(reconcile(next));
  }

  const onDragOver: DragEventHandler = ({ draggable, droppable }) => {
    if (!draggable || !droppable) return;
    move(draggable, droppable);
  };

  const onDragEnd: DragEventHandler = async ({ draggable, droppable }) => {
    if (!draggable || !droppable) return;
    move(draggable, droppable);
    await saveBoard(lists as unknown as TaskList[]);
  };

  return (
    <div class="kanban-board h-full flex flex-row gap-6 overflow-x-auto pb-4 scrollbar-black">
      <DragDropProvider onDragOver={onDragOver} onDragEnd={onDragEnd} collisionDetector={collisionDetector}>
        <DragDropSensors />
        <div class="columns flex flex-row gap-6 items-start">
          <SortableProvider ids={listIds()}>
            <For each={lists}>
              {(list) => (
                <KanbanList
                  taskList={list}
                  listId={list.id}
                  onRenameList={(name) => renameList(list.id, name)}
                  onDeleteList={() => deleteList(list.id)}
                  onTasksChange={(tasks) => updateListTasks(list.id, tasks)}
                  isGroupDraggable={true}
                />
              )}
            </For>
          </SortableProvider>

          <Show when={!addingList()}>
            <button
              type="button"
              class="min-w-[320px] w-[360px] max-w-[400px] h-[52px] rounded-xl border border-dashed border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20 bg-black/10"
              onClick={() => setAddingList(true)}
            >
              + Add list
            </button>
          </Show>
          <Show when={addingList()}>
            <div class="min-w-[320px] w-[360px] max-w-[400px]">
              <NewListCard onAdd={addList} onCancel={() => setAddingList(false)} />
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
                  <div class="px-4 py-3 border-b border-white/10">{list.header}</div>
                  <div class="p-3 space-y-3">
                    <For each={list.tasks}>
                      {(t) => <div class="rounded-xl px-4 py-2 bg-black/30 border border-white/10 text-zinc-200">{t.header}</div>}
                    </For>
                  </div>
                </div>
              );
            }
            const loc = findTask(draggable.id);
            if (!loc) return null;
            const task = lists[loc.listIndex].tasks[loc.taskIndex];
            return <div class="rounded-xl px-4 py-2 bg-black/60 border border-white/10 text-zinc-200 max-w-[360px]">{task.header}</div>;
          }}
        </DragOverlay>
      </DragDropProvider>
    </div>
  );
}

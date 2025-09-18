import { TaskList } from "@/types";
import KanbanList from "@/components/task-list/task-list";
import { For, Show, createSignal, onMount, onCleanup, createEffect } from "solid-js";
import { createStore, reconcile, unwrap } from "solid-js/store";
import { createTaskList } from "@/utils";
import { COMPLETED_LIST_ID, isSortableGroup, getGroupIds, getItemIdsByGroup } from "@/libs/dnd-helpers";
import { createUndoRedoHotkeys } from "@/libs/hotkeys";
import NewListCard from "@/components/task-list/task-list.create";
import { createUndoRedo } from "@/libs/undo";
import { saveBoardIfChanged } from "@/libs/storage";
import {
  DragDropProvider,
  DragDropSensors,
  SortableProvider,
  DragOverlay,
  closestCenter,
  type DragEventHandler,
  type Droppable,
  type CollisionDetector,
} from "@thisbeyond/solid-dnd";

interface KanbanBoardProps {
  taskLists: TaskList[];
}

export default function KanbanBoard({ taskLists }: KanbanBoardProps) {
  const [lists, setLists] = createStore<TaskList[]>(taskLists);
  // Completed list id centralized in dnd-helpers
  const [isAdding, setIsAdding] = createSignal<boolean>(false);
  const [newListName, setNewListName] = createSignal<string>("");
  const history = createUndoRedo<TaskList[]>({ limit: 100 });
  let lastSavedJson: string | undefined = undefined;

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
    const completedIndex = lists.findIndex((l) => l.id === COMPLETED_LIST_ID);
    const insertIndex = completedIndex === -1 ? lists.length : Math.max(0, completedIndex);
    setLists(insertIndex, newList);
    setNewListName("");
    setIsAdding(false);
  }

  function renameListAt(index: number, newHeader: string) {
    setLists(index, (taskList) => ({
      ...taskList,
      header: newHeader.trim(),
    }));
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

  const hotkeys = createUndoRedoHotkeys(history, () =>
    lists.map((list) => ({ id: list.id, header: list.header, tasks: list.tasks })),
    (state) => setLists(state),
  );
  onMount(() => hotkeys.mount());
  onCleanup(() => hotkeys.cleanup());

  // Ensure a special Completed list exists and remains last
  onMount(() => {
    const hasCompleted = lists.some((l) => l.id === COMPLETED_LIST_ID);
    if (!hasCompleted) {
      const completed: TaskList = { id: COMPLETED_LIST_ID, header: "Completed", tasks: [] };
      setLists(lists.length, completed);
    }
  });

  // Debounced autosave
  let saveTimer: number | undefined;
  createEffect(() => {
    // Read lists to track changes
    const current = unwrap(lists);
    // Clear pending timer
    if (saveTimer) clearTimeout(saveTimer);
    // debounce 400ms
    saveTimer = window.setTimeout(async () => {
      lastSavedJson = await saveBoardIfChanged(current, lastSavedJson);
    }, 400);
  });

  const groupIds = () => getGroupIds(lists);
  const groupItemIds = (listId: string) => getItemIdsByGroup(lists, listId);

  // isSortableGroup imported

  const closestEntity: CollisionDetector = (draggable, droppables, context) => {
    const closestGroup = closestCenter(
      draggable,
      droppables.filter(isSortableGroup),
      context,
    );
    if (isSortableGroup(draggable)) return closestGroup;

    if (closestGroup) {
      const listId = String(closestGroup.id);
      const closestItem = closestCenter(
        draggable,
        droppables.filter(
          (droppable) => !isSortableGroup(droppable) && droppable.data?.group === listId,
        ),
        context,
      );

      if (!closestItem) return closestGroup;

      const changingGroup = draggable.data?.group !== listId;
      if (changingGroup) {
        const ids = groupItemIds(listId);
        const lastId = ids.length > 0 ? ids[ids.length - 1] : undefined;
        const belowLastItem =
          lastId === String(closestItem.id) &&
          draggable.transformed.center.y > closestItem.transformed.center.y;
        if (belowLastItem) return closestGroup;
      }

      return closestItem;
    }
    return null;
  };

  function reorderGroups(draggableId: string, droppableId: string) {
    if (draggableId === droppableId) return;

    // Prevent moving the Completed list and prevent dropping onto Completed as a target position
    if (draggableId === COMPLETED_LIST_ID) return;

    const fromIndex = lists.findIndex((list) => list.id === draggableId);
    let toIndex = lists.findIndex((list) => list.id === droppableId);

    // If target is Completed, drop just before it to keep Completed last
    const completedIndex = lists.findIndex((l) => l.id === COMPLETED_LIST_ID);
    if (droppableId === COMPLETED_LIST_ID && completedIndex !== -1) {
      toIndex = Math.max(0, completedIndex - 1);
    }

    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

    snapshotBoard();
    const base = unwrap(lists);
    const next = base.map((list) => ({
      id: list.id,
      header: list.header,
      tasks: list.tasks.slice(),
    }));
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    // Ensure Completed remains last
    const movedCompletedIndex = next.findIndex((l) => l.id === COMPLETED_LIST_ID);
    if (movedCompletedIndex !== -1 && movedCompletedIndex !== next.length - 1) {
      const [comp] = next.splice(movedCompletedIndex, 1);
      next.push(comp);
    }
    setLists(reconcile(next));
  }

  function moveItem(
    draggableId: string,
    droppable: Droppable,
    onlyWhenChangingGroup = true,
  ) {
    const from = (() => {
      for (let groupIndexIter = 0; groupIndexIter < lists.length; groupIndexIter++) {
        const idx = lists[groupIndexIter].tasks.findIndex((task) => task.id === draggableId);
        if (idx !== -1) return { groupIndex: groupIndexIter, itemIndex: idx };
      }
      return undefined;
    })();

    if (!from) return;

    const droppableIsGroup = isSortableGroup(droppable);
    const targetGroupId = droppableIsGroup
      ? String(droppable.id)
      : String(droppable.data?.group);
    const targetGroupIndex = lists.findIndex(
      (list) => list.id === targetGroupId,
    );

    if (onlyWhenChangingGroup && from.groupIndex === targetGroupIndex) return;

    let targetIndex: number;
    if (droppableIsGroup) {
      targetIndex = lists[targetGroupIndex]?.tasks.length ?? 0;
    } else {
      const ids = groupItemIds(targetGroupId);
      const toIndex = ids.indexOf(String(droppable.id));
      const existingIndexInTarget = ids.indexOf(draggableId);
      if (toIndex === -1) return;
      targetIndex =
        existingIndexInTarget === -1 || existingIndexInTarget > toIndex
          ? toIndex
          : toIndex + 1;
    }

    if (from.groupIndex === targetGroupIndex && from.itemIndex === targetIndex)
      return;

    snapshotBoard();
    const next = unwrap(lists).map((list) => ({
      id: list.id,
      header: list.header,
      tasks: list.tasks.slice(),
    }));
    const fromListId = next[from.groupIndex].id;
    const [moved] = next[from.groupIndex].tasks.splice(from.itemIndex, 1);
    const adjustedIndex =
      from.groupIndex === targetGroupIndex && from.itemIndex < targetIndex
        ? Math.max(0, targetIndex - 1)
        : targetIndex;
    const toListId = next[targetGroupIndex].id;
    const changingGroup = from.groupIndex !== targetGroupIndex;
    if (changingGroup) {
      const movingIntoCompleted = toListId === COMPLETED_LIST_ID;
      const movingOutOfCompleted = fromListId === COMPLETED_LIST_ID && toListId !== COMPLETED_LIST_ID;
      if (movingIntoCompleted) {
        moved.completedAt = new Date();
      } else if (movingOutOfCompleted) {
        moved.completedAt = undefined;
      }
    }
    next[targetGroupIndex].tasks.splice(adjustedIndex, 0, moved);
    setLists(reconcile(next));
  }

  const onDragOver: DragEventHandler = ({ draggable, droppable }) => {
    if (!draggable || !droppable) return;
    if (isSortableGroup(draggable)) return; // don't reorder groups on hover
    moveItem(String(draggable.id), droppable, true);
  };

  const onDragEnd: DragEventHandler = ({ draggable, droppable }) => {
    if (!draggable || !droppable) return;

    if (isSortableGroup(draggable) && isSortableGroup(droppable)) {
      reorderGroups(String(draggable.id), String(droppable.id));
      return;
    }

    if (!isSortableGroup(draggable)) {
      moveItem(String(draggable.id), droppable, false);
    }
  };

  function findTaskById(id: string) {
    for (let groupIndex = 0; groupIndex < lists.length; groupIndex++) {
      const tasks = lists[groupIndex].tasks;
      const ii = tasks.findIndex((task) => task.id === id);
      if (ii !== -1) {
        return { groupIndex, ii, task: tasks[ii] };
      }
    }
    return undefined;
  }

  return (
    <div class="kanban-board h-full flex flex-row gap-6 overflow-x-auto pb-4 scrollbar-black">
      <DragDropProvider
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        collisionDetector={closestEntity}
      >
        <DragDropSensors />
        <SortableProvider ids={groupIds()}>
          <For each={lists}>
            {(list, i) => (
              <KanbanList
                taskList={list}
                onRenameList={(name) => renameListAt(i(), name)}
                onDeleteList={() => deleteListAt(i())}
                listId={list.id}
                isGroupDraggable={list.id !== COMPLETED_LIST_ID}
              />
            )}
          </For>
        </SortableProvider>

        <DragOverlay>
          {(draggable) => {
            if (!draggable) return null;

            if (isSortableGroup(draggable)) {
              const listId = String(draggable.id);
              const list = lists.find((list) => list.id === listId);
              return (
                <div class="rounded-2xl px-4 py-3 bg-black/40 border border-white/10 text-zinc-200">
                  {list?.header ?? "List"}
                </div>
              );
            }

            const id = String(draggable.id);
            const taskLocation = findTaskById(id);

            if (!taskLocation) return null;

            return (
              <div class="rounded-xl px-4 py-2 bg-black/60 border border-white/10 text-zinc-200 max-w-[360px]">
                {taskLocation.task.header?.trim() || "Untitled Task"}
              </div>
            );
          }}
        </DragOverlay>
      </DragDropProvider>

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

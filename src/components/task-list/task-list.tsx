import {
  For,
  Show,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  createEffect,
} from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import type { Task, TaskList, Tag } from "@/types";
import TaskCard from "@/components/task-card/task-card";
import InlineTaskEditor from "@/components/task-card/task-card.editor";
import { createTask } from "@/utils";
import InlineListTitle from "@/components/task-list/task-list.title-edit";
import TaskDetailsSheet from "@components/task-details-sheet";
import { COMPLETED_LIST_ID } from "@/libs/dnd-helpers";
import { createUndoRedo } from "@/libs/undo";
import { createUndoRedoHotkeys } from "@/libs/hotkeys";
import {
  SortableProvider,
  createSortable,
  maybeTransformStyle,
  useDragDropContext,
  type DragEventHandler,
} from "@thisbeyond/solid-dnd";
import SortableTaskCard from "./sortable-task-card";
import { writeTaskContent, deleteTaskContent } from "@/libs/storage";

interface KanbanListProps {
  taskList: TaskList;
  onRenameList: (name: string) => void;
  onDeleteList: () => void;
  onTasksChange?: (tasks: Task[]) => void;
  listId: string;
  isGroupDraggable?: boolean;
}

export default function KanbanList({
  taskList,
  onRenameList,
  onDeleteList,
  onTasksChange,
  listId,
  isGroupDraggable = true,
}: KanbanListProps) {
  const [tasks, setTasks] = createStore<Task[]>(taskList.tasks);
  const [openTaskIndex, setOpenTaskIndex] = createSignal<number | null>(null);
  const [sheetOpen, setSheetOpen] = createSignal<boolean>(false);
  const history = createUndoRedo<Task[]>({ limit: 100 });

  const hasDraft = createMemo(() => tasks.some((t) => t.isDraft));

  const openTask = createMemo(() => {
    const index = openTaskIndex();
    return index !== null && index < tasks.length ? tasks[index] : null;
  });

  const existingTags = createMemo<Tag[]>(() => {
    const map = new Map<string, Tag>();
    for (const task of tasks) {
      for (const tag of task.tags ?? []) {
        const key = tag.label.toLowerCase();
        if (!map.has(key)) map.set(key, tag);
      }
    }
    return Array.from(map.values());
  });

  function startEditAt(index: number) {
    setTasks(index, "isDraft", true);
  }

  function snapshot() {
    // Convert Solid store arrays to plain objects for cloning
    const plain = tasks.map((task) => ({ ...task }));
    history.push(plain);
  }

  function startAddNew() {
    snapshot();
    const newTask: Task = createTask("", [], undefined, { isDraft: true });
    // Use reconcile to replace the array so Solid tracks changes properly
    setTasks(reconcile([newTask, ...tasks]));
    notifyParent();
  }

  async function handleSave(index: number, updates: Partial<Task>) {
    console.log(
      "[TaskList] handleSave called for task at index",
      index,
      "with updates:",
      updates,
    );
    snapshot();
    const patch: Partial<Task> = { ...updates };
    if (patch.header !== undefined) patch.header = patch.header.trim();
    patch.isDraft = false;
    // If content was provided on first save, persist it to the per-task file
    if (Object.prototype.hasOwnProperty.call(patch, "content")) {
      const id = tasks[index].id;
      const content = (patch as Partial<Task>).content ?? "";
      await writeTaskContent(id, content);
    }
    setTasks(index, patch);
    console.log("[TaskList] handleSave completed - task updated");
    console.log(
      "[TaskList] handleSave -> task store updated, should trigger kanban autosave",
    );
    notifyParent();
  }

  function handleCancel(index: number) {
    const task = tasks[index];
    if (!task) return;

    if ((task.header ?? "").trim() === "") {
      snapshot();
      setTasks(tasks.filter((_, i) => i !== index));
    } else {
      setTasks(index, "isDraft", false);
    }
  }

  function deleteTaskAt(index: number) {
    const task = tasks[index];
    console.log(
      "[TaskList] deleteTaskAt called for task at index",
      index,
      "task:",
      task?.id,
    );
    snapshot();
    const next = tasks.filter((_, i) => i !== index);
    setTasks(reconcile(next));

    // Clean up stored content for the deleted task
    if (task) {
      console.log("[TaskList] deleting content for task:", task.id);
      deleteTaskContent(task.id);
    }

    // If the deleted task was open, close the sheet
    if (openTaskIndex() === index) {
      setOpenTaskIndex(null);
      setSheetOpen(false);
    } else if (openTaskIndex() !== null && openTaskIndex()! > index) {
      // Adjust the open task index if a task before it was deleted
      setOpenTaskIndex(openTaskIndex()! - 1);
    }
    console.log("[TaskList] deleteTaskAt completed");
    notifyParent();
  }

  function updateOpenTask(updates: Partial<Task>) {
    const index = openTaskIndex();
    if (index === null) return;

    console.log(
      "[TaskList] updateOpenTask called for task at index",
      index,
      "with updates:",
      updates,
    );
    snapshot();
    Object.entries(updates).forEach(([key, value]) => {
      setTasks(index, key as keyof Task, value);
    });
  }

  const hotkeys = createUndoRedoHotkeys(
    history,
    () => tasks.map((task) => ({ ...task })),
    (state) => setTasks(reconcile(state)),
  );
  onMount(() => hotkeys.mount());
  onCleanup(() => hotkeys.cleanup());

  createEffect(() => {
    setTasks(reconcile(taskList.tasks));
  });

  const listSortable = createSortable(listId, {
    type: "group",
    disabled: !isGroupDraggable,
  });

  // Only include non-draft items in SortableProvider ids to keep DOM order in sync
  const sortableIds = createMemo(() =>
    tasks.filter((t) => !t.isDraft).map((t) => t.id),
  );

  createEffect(() => {
    console.debug("[DND][TaskList] sortable ids updated", {
      listId,
      ids: sortableIds(),
      totalTasks: tasks.length,
    });
  });

  // Local within-list move handling to keep array order in sync during drag
  function moveWithinList(draggableId: string, droppableId: string | null) {
    const fromIndex = tasks.findIndex((t) => t.id === draggableId);
    if (fromIndex === -1) return;

    // Determine target index. If hovering over group, append to end.
    let targetIndex: number | null = null;
    if (droppableId) {
      const idx = tasks.findIndex((t) => t.id === droppableId);
      if (idx !== -1) targetIndex = idx;
    }

    const next = tasks.slice();
    const [moved] = next.splice(fromIndex, 1);
    if (!moved) return;

    let insertIndex = targetIndex ?? next.length; // append when hovering group
    if (fromIndex < insertIndex) insertIndex = Math.max(0, insertIndex);
    insertIndex = Math.max(0, Math.min(insertIndex, next.length));

    next.splice(insertIndex, 0, moved);
    setTasks(reconcile(next));
  }

  onMount(() => {
    const ctx = useDragDropContext();
    if (!ctx) return;
    const [, actions] = ctx;

    const handleOver: DragEventHandler = ({ draggable, droppable }) => {
      if (!draggable || !droppable) return;
      // Only handle item reordering within this list
      const draggableType = draggable.data?.type;
      const droppableType = droppable.data?.type;
      const draggableGroup = draggable.data?.group;
      const droppableGroup =
        droppableType === "group" ? droppable.id : droppable.data?.group;
      if (draggableType !== "item") return;
      if (droppableGroup !== listId) return;
      // Ignore if coming from another list; board-level will handle cross-list moves
      if (draggableGroup && draggableGroup !== listId) return;

      console.debug("[DND][TaskList] onDragOver", {
        listId,
        draggableId: draggable.id,
        droppableId: droppableType === "group" ? null : droppable.id,
        droppableType,
      });

      moveWithinList(
        String(draggable.id),
        droppableType === "group" ? null : String(droppable.id),
      );
      notifyParent();
    };

    const handleEnd: DragEventHandler = ({ draggable, droppable }) => {
      if (!draggable || !droppable) return;
      const draggableType = draggable.data?.type;
      const droppableType = droppable.data?.type;
      const draggableGroup = draggable.data?.group;
      const droppableGroup =
        droppableType === "group" ? droppable.id : droppable.data?.group;
      if (draggableType !== "item") return;
      if (droppableGroup !== listId) return;
      if (draggableGroup && draggableGroup !== listId) return;

      console.debug("[DND][TaskList] onDragEnd finalize within-list", {
        listId,
        draggableId: draggable.id,
        droppableId: droppableType === "group" ? null : droppable.id,
      });
      notifyParent();
    };

    actions.onDragOver(handleOver);
    actions.onDragEnd(handleEnd);
  });

  function notifyParent() {
    try {
      onTasksChange?.(tasks.map((t) => ({ ...t })));
    } catch (_e) {
      // ignore
    }
  }

  return (
    <section
      ref={listSortable.ref}
      style={maybeTransformStyle(listSortable.transform)}
      data-list-id={listId}
      classList={{ "opacity-25": listSortable.isActiveDraggable }}
      class="
        column relative flex flex-col h-full rounded-2xl
        bg-black/40 backdrop-blur-sm
        border border-white/5
        shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_24px_48px_-20px_rgba(0,0,0,0.9)]
        min-w-[320px] w-[360px] max-w-[400px]
      "
    >
      <header
        class="
          sticky top-0 z-10
          flex items-center justify-between
          px-4 py-3 rounded-t-2xl
          bg-black/20
          border-b border-white/5
        "
        {...(isGroupDraggable ? listSortable.dragActivators : {})}
      >
        <div class="flex items-center gap-2">
          <span class="h-2 w-2 rounded-full bg-emerald-400/80 shadow-[0_0_8px_1px_rgba(16,185,129,0.5)]" />
          <InlineListTitle
            value={taskList.header}
            onSave={(v) => onRenameList?.(v)}
          />
        </div>
        <div class="flex items-center gap-2">
          <span
            class="
              text-[11px] px-2 py-0.5 rounded-md
              bg-white/5 text-zinc-400 border border-white/10
            "
          >
            {tasks.length}
          </span>
          <button
            type="button"
            class="h-7 w-7 grid place-items-center rounded-md border border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-red-500/20 hover:border-red-500/30 bg-white/5 transition-colors"
            title="Delete list"
            onClick={() => {
              if (tasks.length > 0) {
                if (
                  confirm(
                    `Are you sure you want to delete "${taskList.header}" and all ${tasks.length} tasks?`,
                  )
                ) {
                  onDeleteList();
                }
              } else {
                onDeleteList();
              }
            }}
          >
            <span class="relative inline-flex">
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
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                <path d="M3 6h18" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </span>
          </button>
        </div>
      </header>

      <div
        class="
          flex-1 overflow-y-auto px-3 pt-4 pb-8 space-y-4
          scrollbar-black
        "
      >
        <Show
          when={tasks.length > 0}
          fallback={
            <div
              class="
              rounded-xl border border-dashed border-white/10
              text-zinc-500 text-xs p-6 text-center
              bg-black/20
            "
            >
              No tasks yet. Drag here or click "Add task".
            </div>
          }
        >
          <SortableProvider ids={sortableIds()}>
            <For each={tasks}>
              {(task, i) => (
                <>
                  {task.isDraft ? (
                    <InlineTaskEditor
                      initial={task}
                      onSave={(update) => handleSave(i(), update)}
                      onCancel={() => handleCancel(i())}
                      existingTags={existingTags()}
                    />
                  ) : (
                    <SortableTaskCard id={task.id} group={listId}>
                      <TaskCard
                        task={task}
                        onOpen={() => {
                          setOpenTaskIndex(i());
                          setSheetOpen(true);
                        }}
                        onAddTags={() => startEditAt(i())}
                        onStartEdit={() => startEditAt(i())}
                        onDelete={() => deleteTaskAt(i())}
                      />
                    </SortableTaskCard>
                  )}
                </>
              )}
            </For>
          </SortableProvider>
        </Show>
      </div>

      <div class="px-3 pb-3">
        <button
          class="
              w-full inline-flex items-center justify-center gap-2
              rounded-xl px-3 py-2.5
              text-sm font-medium
              text-zinc-200
              bg-white/5 hover:bg-white/10 active:bg-white/15
              border border-white/10
              transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          type="button"
          disabled={hasDraft() || listId === COMPLETED_LIST_ID}
          onClick={startAddNew}
        >
          {listId === COMPLETED_LIST_ID ? "Completed list" : "+ Add task"}
        </button>
      </div>

      <TaskDetailsSheet
        open={sheetOpen()}
        onOpenChange={(v) => {
          if (v) {
            setSheetOpen(true);
            return;
          }
          setSheetOpen(false);
          // Delay clearing the task until the closing animation finishes
          // Keep this in sync with the CSS close animation duration (~160-200ms)
          setTimeout(() => setOpenTaskIndex(null), 200);
        }}
        task={openTask()}
        taskList={taskList}
        onUpdate={updateOpenTask}
        existingTags={existingTags()}
      />
    </section>
  );
}

// moved to ./sortable-task-card to keep this file focused

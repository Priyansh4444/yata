import type { TaskList } from "@/types";
import {
    closestCenter,
    type CollisionDetector,
    type Draggable,
    type Droppable,
} from "@thisbeyond/solid-dnd";

function isGroup(x: Draggable | Droppable | undefined | null) {
    return !!x && x.data?.type === "group";
}

const boardCollisionDetector: CollisionDetector = (
    draggable,
    droppables,
    context,
) => {
    const closestGroup = closestCenter(
        draggable,
        droppables.filter((d) => isGroup(d)),
        context,
    );
    if (isGroup(draggable)) return closestGroup;
    if (closestGroup) {
        const innerClosest = closestCenter(
            draggable,
            droppables.filter((d) => !isGroup(d) && d.data.group === closestGroup.id),
            context,
        );
        return innerClosest ?? closestGroup;
    }
    return null;
};

function computeMovedLists(
    lists: TaskList[],
    draggable: Draggable,
    droppable: Droppable,
): TaskList[] | null {
    if (!draggable || !droppable) return null;

    const draggableIsGroup = isGroup(draggable);
    const droppableIsGroup = isGroup(droppable);

    if (draggableIsGroup) {
        const fromIndex = lists.findIndex((l) => l.id === (draggable).id);
        const targetGroupId = droppableIsGroup
            ? (droppable).id
            : (droppable).data.group;
        const toIndex = lists.findIndex((l) => l.id === targetGroupId);
        if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return null;
        const removed = lists[fromIndex];
        const without = lists.filter((_, i) => i !== fromIndex);
        const insertAt = Math.max(0, toIndex);
        const next = [
            ...without.slice(0, insertAt),
            removed,
            ...without.slice(insertAt),
        ];
        console.log("next", next);
        return next;
    }

    let sourceListIndex = -1;
    let sourceTaskIndex = -1;
    outer: for (let li = 0; li < lists.length; li++) {
        const ti = lists[li].tasks.findIndex((t) => t.id === (draggable).id);
        if (ti !== -1) {
            sourceListIndex = li;
            sourceTaskIndex = ti;
            break outer;
        }
    }
    if (sourceListIndex === -1 || sourceTaskIndex === -1) return null;

    const targetGroupId = droppableIsGroup
        ? (droppable).id
        : (droppable).data.group;
    const targetListIndex = lists.findIndex((l) => l.id === targetGroupId);
    if (targetListIndex === -1) return null;

    // If within the same list, skip so that list handles its own ordering
    if (targetListIndex === sourceListIndex) return null;

    const next = lists.map((l) => ({ ...l, tasks: [...l.tasks] }));
    const [movedTask] = next[sourceListIndex].tasks.splice(sourceTaskIndex, 1);
    if (!movedTask) return null;

    // Determine insertion index
    let insertIndex = next[targetListIndex].tasks.length; // default end
    if (!droppableIsGroup) {
        const idx = next[targetListIndex].tasks.findIndex(
            (t) => t.id === (droppable).id,
        );
        if (idx !== -1) insertIndex = idx; // insert before the target item
    }

    next[targetListIndex].tasks.splice(insertIndex, 0, movedTask);
    return next;
}

export { isGroup, boardCollisionDetector, computeMovedLists };



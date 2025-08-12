import type { Task, TaskList, Tag, HexColor } from "@/types";

const DEFAULT_TAG_COLOR = "#3b82f6" as HexColor;

function createTask(
  name: string,
  tags?: (string | Tag)[],
  description?: string,
  options?: {
    priority?: Task["priority"];
    dueDate?: Date | string;
    isDraft?: boolean;
    completedAt?: Date | string;
  },
): Task {
  const normalizedTags = (tags ?? []).map((t) =>
    typeof t === "string"
      ? { label: t, color: DEFAULT_TAG_COLOR }
      : { ...t, color: (t.color ?? DEFAULT_TAG_COLOR) as HexColor },
  );
  const dueDate = options?.dueDate ? new Date(options.dueDate) : undefined;
  const completedAt = options?.completedAt
    ? new Date(options.completedAt)
    : undefined;
  return {
    id: generateUID(),
    header: name,
    isDraft: options?.isDraft ?? false,
    createdAt: new Date(),
    dueDate,
    completedAt,
    priority: options?.priority,
    description,
    tags: normalizedTags,
  };
}

function createTaskList(name: string, tasks: Task[]): TaskList {
  return {
    header: name,
    tasks: tasks,
  };
}

function generateUID(): string {
  return Math.random().toString(36).slice(2, 9);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export { createTask, createTaskList, generateUID, clamp };

function generateRandomTasks(count: number): Task[] {
  const tasks: Task[] = [];
  for (let i = 0; i < count; i++) {
    const taskName = `Task ${i + 1}`;
    const tags =
      Math.random() > 0.5
        ? [
            {
              label: `Tag${Math.floor(Math.random() * 5)}`,
              color: randomColor(),
            },
          ]
        : [];
    const description =
      Math.random() > 0.4 ? "Task description goes here..." : undefined;
    const priorityRoll = Math.random();
    const priority: Task["priority"] =
      priorityRoll > 0.8
        ? "high"
        : priorityRoll > 0.5
          ? "medium"
          : Math.random() > 0.5
            ? "low"
            : undefined;
    const dueDate =
      Math.random() > 0.6
        ? daysFromNow(Math.floor(Math.random() * 14) + 1)
        : undefined;
    tasks.push(
      createTask(taskName, tags, description, {
        priority,
        dueDate,
      }),
    );
  }
  return tasks;
}

function randomColor(): HexColor {
  const r = Math.floor(Math.random() * 200) + 30;
  const g = Math.floor(Math.random() * 200) + 30;
  const b = Math.floor(Math.random() * 200) + 30;
  const value = `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`.toLowerCase();
  return value as HexColor;
}

function generateRandomTaskLists(count: number): TaskList[] {
  const taskLists: TaskList[] = [];
  for (let i = 0; i < count; i++) {
    const listName = `Task List ${i + 1}`;
    const tasks = generateRandomTasks(Math.floor(Math.random() * 5) + 1);
    taskLists.push(createTaskList(listName, tasks));
  }
  return taskLists;
}

export { generateRandomTaskLists };

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

import type { Task, TaskList, Tag, HexColor } from "@/types";

const DEFAULT_TAG_COLOR = "#3b82f6" as HexColor;

function createTask(name: string, tags?: (string | Tag)[], description?: string): Task {
  return {
    header: name,
    description,
    tags: (tags ?? []).map(t =>
      typeof t === "string"
        ? { label: t, color: DEFAULT_TAG_COLOR }
        : { ...t, color: t.color ?? DEFAULT_TAG_COLOR }
    ),
  }
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
    const tags = Math.random() > 0.5
      ? [{ label: `Tag${Math.floor(Math.random() * 5)}`, color: randomColor() }]
      : [];
    const description = Math.random() > 0.4 ? "Task description goes here..." : undefined;
    tasks.push(createTask(taskName, tags, description));
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

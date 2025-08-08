import { Task, TaskList } from "@/types";

function createTask(name: string, tags?: string[], description?: string): Task {
  return {
    header: name,
    description,
    tags: tags || [],
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
    const tags = Math.random() > 0.5 ? [`Tag${Math.floor(Math.random() * 5)}`] : [];
    const description = Math.random() > 0.4 ? "Task description goes here..." : undefined;
    tasks.push(createTask(taskName, tags, description));
  }
  return tasks;
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

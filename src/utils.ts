import { Task, TaskList } from "@/types";

function createTask(name: string, tags?: string[]): Task {
  return {
    header: name,
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

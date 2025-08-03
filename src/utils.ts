import { Task, TaskList } from "./types";

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

export { createTask, createTaskList };

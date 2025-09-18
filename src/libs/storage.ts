import type { TaskList, Task } from "@/types";
import { BaseDirectory, readTextFile, writeTextFile, exists, mkdir } from "@tauri-apps/plugin-fs";

const ROOT_DIR = "boards";
const SESSIONS_DIR = `${ROOT_DIR}/sessions`;
const LOAD_FILE = `${ROOT_DIR}/load.json`;

type SerializableTask = Omit<Task, "createdAt" | "dueDate" | "completedAt"> & {
  createdAt: string;
  dueDate?: string;
  completedAt?: string;
};

type SerializableTaskList = Omit<TaskList, never> & {
  tasks: SerializableTask[];
};

type BoardState = SerializableTaskList[];

function serializeBoard(lists: TaskList[]): BoardState {
  return lists.map((list) => ({
    id: list.id,
    header: list.header,
    tasks: list.tasks.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
      dueDate: t.dueDate ? t.dueDate.toISOString() : undefined,
      completedAt: t.completedAt ? t.completedAt.toISOString() : undefined,
    })),
  }));
}

function deserializeBoard(data: BoardState): TaskList[] {
  return data.map((list) => ({
    id: list.id,
    header: list.header,
    tasks: list.tasks.map((t) => ({
      ...t,
      createdAt: new Date(t.createdAt),
      dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
      completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
    })),
  }));
}

async function ensureRootDir(): Promise<void> {
  const hasDir = await exists(ROOT_DIR, { baseDir: BaseDirectory.AppData });
  if (!hasDir) {
    await mkdir(ROOT_DIR, { baseDir: BaseDirectory.AppData, recursive: true });
  }
}

export async function saveBoard(lists: TaskList[]): Promise<void> {
  await ensureRootDir();
  const json = JSON.stringify(serializeBoard(lists));
  await writeTextFile(LOAD_FILE, json, { baseDir: BaseDirectory.AppData });
}

export async function loadBoard(): Promise<TaskList[] | null> {
  try {
    const existsLoad = await exists(LOAD_FILE, { baseDir: BaseDirectory.AppData });
    if (!existsLoad) return null;
    const text = await readTextFile(LOAD_FILE, { baseDir: BaseDirectory.AppData });
    if (!text) return null;
    const data = JSON.parse(text) as BoardState;
    return deserializeBoard(data);
  } catch (_e) {
    return null;
  }
}

export async function saveBoardIfChanged(lists: TaskList[], previousJson?: string): Promise<string> {
  const json = JSON.stringify(serializeBoard(lists));
  if (json !== previousJson) {
    await saveBoard(lists);
  }
  return json;
}

function formatTimestamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
}

async function ensureSessionsDir(): Promise<void> {
  const hasDir = await exists(SESSIONS_DIR, { baseDir: BaseDirectory.AppData });
  if (!hasDir) {
    await mkdir(SESSIONS_DIR, { baseDir: BaseDirectory.AppData, recursive: true });
  }
}

export async function writeAppInitSnapshot(lists: TaskList[]): Promise<string> {
  await ensureRootDir();
  await ensureSessionsDir();
  const stamp = formatTimestamp(new Date());
  const path = `${SESSIONS_DIR}/startup-${stamp}.json`;
  const json = JSON.stringify(serializeBoard(lists));
  await writeTextFile(path, json, { baseDir: BaseDirectory.AppData });
  return path;
}



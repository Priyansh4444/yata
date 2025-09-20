import type { TaskList, Task } from "@/types";
import {
  BaseDirectory,
  readTextFile,
  writeTextFile,
  exists,
  mkdir,
  remove,
  writeFile,
  readDir,
} from "@tauri-apps/plugin-fs";
import { convertFileSrc } from "@tauri-apps/api/core";
import { appDataDir, join } from "@tauri-apps/api/path";
const ROOT_DIR = "boards";
const BOARD_FILE = `${ROOT_DIR}/board.json`;
const LEGACY_LOAD_FILE = `${ROOT_DIR}/load.json`;

type SerializableTask = Omit<
  Task,
  "createdAt" | "dueDate" | "completedAt" | "content"
> & {
  createdAt: string;
  dueDate?: string;
  completedAt?: string;
  contentPath?: string;
  assetsDir?: string;
};

type SerializableTaskList = {
  id: string;
  header: string;
  tasks: SerializableTask[];
};

type BoardState = SerializableTaskList[];

function serializeBoard(lists: TaskList[]): BoardState {
  const serialized: BoardState = lists.map((list) => ({
    id: list.id,
    header: list.header,
    tasks: list.tasks.map((t) => ({
      id: t.id,
      header: t.header,
      isDraft: t.isDraft,
      createdAt: t.createdAt.toISOString(),
      dueDate: t.dueDate ? t.dueDate.toISOString() : undefined,
      completedAt: t.completedAt ? t.completedAt.toISOString() : undefined,
      priority: t.priority,
      tags: t.tags,
      contentPath: taskContentFile(t.id),
      assetsDir: taskAssetsDir(t.id),
    })),
  }));
  return serialized;
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
  console.log("[Storage] saveBoard -> bytes", json.length);
  await writeTextFile(BOARD_FILE, json, { baseDir: BaseDirectory.AppData });
}

export async function loadBoard(): Promise<TaskList[] | null> {
  try {
    // Prefer new board.json, fallback to legacy load.json
    const hasBoard = await exists(BOARD_FILE, {
      baseDir: BaseDirectory.AppData,
    });
    const path = hasBoard
      ? BOARD_FILE
      : (await exists(LEGACY_LOAD_FILE, { baseDir: BaseDirectory.AppData }))
        ? LEGACY_LOAD_FILE
        : null;
    if (!path) return null;
    const text = await readTextFile(path, { baseDir: BaseDirectory.AppData });
    console.log("[Storage] loadBoard from", path, "bytes", text?.length ?? 0);
    if (!text) return null;
    const data = JSON.parse(text) as BoardState;
    return deserializeBoard(data);
  } catch (_e) {
    return null;
  }
}

const CONTENTS_DIR = `${ROOT_DIR}/contents`;

function taskContentDir(taskId: string): string {
  return `${CONTENTS_DIR}/${taskId}`;
}

function taskContentFile(taskId: string): string {
  return `${taskContentDir(taskId)}/content.md`;
}

function taskAssetsDir(taskId: string): string {
  return `${taskContentDir(taskId)}/assets`;
}

async function ensureTaskDir(taskId: string): Promise<void> {
  await ensureRootDir();
  const dir = taskContentDir(taskId);
  const hasDir = await exists(dir, { baseDir: BaseDirectory.AppData });
  if (!hasDir) {
    await mkdir(dir, { baseDir: BaseDirectory.AppData, recursive: true });
  }
}

async function ensureTaskAssetsDir(taskId: string): Promise<void> {
  await ensureTaskDir(taskId);
  const dir = taskAssetsDir(taskId);
  const hasDir = await exists(dir, { baseDir: BaseDirectory.AppData });
  if (!hasDir) {
    await mkdir(dir, { baseDir: BaseDirectory.AppData, recursive: true });
  }
}

export async function readTaskContent(taskId: string): Promise<string | null> {
  try {
    const file = taskContentFile(taskId);
    const has = await exists(file, { baseDir: BaseDirectory.AppData });
    if (!has) return null;
    const text = await readTextFile(file, { baseDir: BaseDirectory.AppData });
    console.log(
      "[Storage] readTaskContent",
      taskId,
      "bytes",
      text?.length ?? 0,
    );
    return text;
  } catch (_e) {
    return null;
  }
}

export async function writeTaskContent(
  taskId: string,
  content: string,
): Promise<void> {
  await ensureTaskDir(taskId);
  const file = taskContentFile(taskId);
  console.log(
    "[Storage] writeTaskContent",
    taskId,
    "bytes",
    content?.length ?? 0,
  );
  await writeTextFile(file, content, { baseDir: BaseDirectory.AppData });
}

export async function deleteTaskContent(taskId: string): Promise<void> {
  try {
    const dir = taskContentDir(taskId);
    await remove(dir, {
      baseDir: BaseDirectory.AppData,
      recursive: true,
    } as any);
  } catch (_e) {
    // ignore
  }
}

function isImageNameOrType(filename: string, mimeType?: string): boolean {
  if (mimeType && mimeType.startsWith("image/")) return true;
  const lower = filename.toLowerCase();
  return [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".svg",
    ".avif",
    ".bmp",
  ].some((ext) => lower.endsWith(ext));
}

function extractExtension(filename: string, defaultExt = "bin"): string {
  const idx = filename.lastIndexOf(".");
  if (idx !== -1 && idx < filename.length - 1) return filename.slice(idx + 1);
  return defaultExt;
}

export async function writeTaskAsset(
  taskId: string,
  filename: string,
  bytes: Uint8Array,
  mimeType?: string,
): Promise<{ relativePath: string; url: string; path: string }> {
  await ensureTaskAssetsDir(taskId);
  const assetsDir = taskAssetsDir(taskId);
  let safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");

  // Auto-name images as image-<n>.<ext>
  if (isImageNameOrType(filename, mimeType)) {
    const ext = extractExtension(filename, "png");
    let maxIndex = 0;
    try {
      const entries = await readDir(assetsDir, {
        baseDir: BaseDirectory.AppData,
      });
      for (const entry of entries) {
        const name = entry.name || "";
        const match = name.match(/^image-(\d+)\./i);
        if (match) {
          const n = parseInt(match[1], 10);
          if (!isNaN(n)) maxIndex = Math.max(maxIndex, n);
        }
      }
    } catch (_e) {
      // ignore dir read errors
    }
    safeName = `image-${maxIndex + 1}.${ext}`;
  }

  const relativePath = `${assetsDir}/${safeName}`;
  console.log(
    "[Storage] writeTaskAsset",
    taskId,
    safeName,
    "bytes",
    bytes?.byteLength ?? 0,
  );
  await writeFile(relativePath, bytes, { baseDir: BaseDirectory.AppData });
  // Build a URL that the webview can load
  const fullPath = await join(await appDataDir(), relativePath);
  const url = convertFileSrc(fullPath);
  return { relativePath, url, path: fullPath };
}

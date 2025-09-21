import type { WatchEvent } from "@tauri-apps/plugin-fs";
import { watch, BaseDirectory } from "@tauri-apps/plugin-fs";

export type BoardWatchHandle = {
  close: () => Promise<void>;
} | null;

export async function watchBoardFile(
  onEvent: (event: WatchEvent) => void,
): Promise<BoardWatchHandle> {
  try {
    const rawHandle = await watch(
      "boards",
      (event) => {
        const path = (event as { path?: string } | undefined)?.path;
        if (!path || path.endsWith("board.json")) onEvent(event);
      },
      { delayMs: 150, recursive: false, baseDir: BaseDirectory.AppData },
    );
    return {
      close: async () => {
        try {
          // "watch" returns an UnwatchFn; call it to stop watching
          await Promise.resolve(rawHandle());
        } catch (_e) {
          /* ignore */
        }
      },
    };
  } catch (_e) {
    return null;
  }
}



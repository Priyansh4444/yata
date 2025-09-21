import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

export type OpenWindowOptions = {
  label: string;
  title?: string;
  url: string;
  width?: number;
  height?: number;
  alwaysOnTop?: boolean;
  transparent?: boolean;
};

export async function openWindow(opts: OpenWindowOptions): Promise<void> {
  const url = toAbsoluteUrl(opts.url);

  // Reuse existing window if it already exists
  const existing = await WebviewWindow.getByLabel(opts.label);
  if (existing) {
    try {
      await existing.show();
    } catch (_) {
      console.error("[window] existing.show failed, falling back", _);
      // ignore
    }
    try {
      await existing.setFocus();
    } catch (_) {
      console.error("[window] existing.setFocus failed, falling back", _);
      // ignore
    }
    return;
  }

  // Create a new window
  const wv = new WebviewWindow(opts.label, {
    title: opts.title ?? "Yata",
    url,
    width: opts.width ?? 480,
    height: opts.height ?? 640,
    decorations: true,
    transparent: opts.transparent ?? false,
    alwaysOnTop: opts.alwaysOnTop ?? false,
    focus: true,
    resizable: true,
  });

  // Wait for window creation to complete
  try {
    await wv.once("tauri://created", () => {
      // Window created successfully
    });
  } catch (_) {
    console.error("[window] wv.once failed, falling back", _);
    // ignore
  }
}

function toAbsoluteUrl(pathOrUrl: string): string {
  try {
    // already absolute
    new URL(pathOrUrl);
    return pathOrUrl;
  } catch (_) {
    const isDev = import.meta.env?.DEV;
    const devServerUrl = import.meta.env?.VITE_DEV_SERVER_URL;
    const base = isDev && devServerUrl ? devServerUrl : window.location.origin;
    const url = new URL(
      pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`,
      base,
    );
    return url.toString();
  }
}

import { onCleanup, onMount, createEffect } from "solid-js";
import { writeTaskAsset } from "@/libs/storage";
import { createEditor, defaultContent } from "./editor-config";
import "./editor-styles.css";
import "katex/dist/katex.min.css";

type Props = {
  value?: string;
  onChange?: (value: string) => void;
  taskId?: string; // used for storing pasted assets per-task
};

export default function RichEditor(props: Props) {
  let editorElement: HTMLDivElement | undefined;
  let editor: ReturnType<typeof createEditor> | undefined;
  // Get task id: prefer prop, fallback to data attribute
  function getTaskId(): string | undefined {
    return props.taskId || editorElement?.getAttribute("data-task-id") || undefined;
  }
  onMount(() => {
    if (editorElement) {
      if (props.taskId) {
        editorElement.setAttribute("data-task-id", props.taskId);
      }
      editor = createEditor({
        element: editorElement,
        content: props.value ?? defaultContent,
        autofocus: "start",
      });
      editor.on("update", () => {
        props.onChange?.(editor!.getHTML());
      });
      // Handle paste of images/files
      editorElement.addEventListener("paste", async (e: ClipboardEvent) => {
        try {
          const taskId = getTaskId();
          if (!taskId) return; // need task id to store assets
          const files: File[] = [];
          const items = Array.from(e.clipboardData?.items || []);
          for (const item of items) {
            if (item.kind === "file") {
              const file = item.getAsFile();
              if (file) files.push(file);
            }
          }
          if (files.length === 0) return;
          e.preventDefault();
          // Save all files first, then insert sequentially to avoid HTML escaping/duplication
          for (const file of files) {
            const arrayBuffer = await file.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            const asset = await writeTaskAsset(taskId, file.name || "pasted.bin", bytes, file.type);
            if (file.type.startsWith("image/")) {
              // Insert image followed by a new paragraph so the caret is after the image
              editor
                ?.chain()
                .focus()
                .insertContent([
                  { type: "image", attrs: { src: asset.url, alt: file.name || "" } },
                  { type: "paragraph" },
                ])
                .run();
            } else {
              editor
                ?.chain()
                .focus()
                .insertContent({ type: "text", text: (file.name || "file") + " " })
                .run();
            }
          }
        } catch (_e) {
          // ignore paste errors
        }
      });
    }
  });
  // Sync incoming value changes into the editor after mount
  createEffect(() => {
    if (!editor) return;
    const incoming = props.value ?? "";
    const current = editor.getHTML?.() ?? "";
    if (incoming !== current) {
      // Set content without emitting update to avoid loops
      // @ts-ignore tiptap allows emitUpdate flag
      editor.commands.setContent(incoming, false);
    }
  });
  onCleanup(() => {
    editor?.destroy?.();
  });
  return <div ref={editorElement!} id="editor" class="text-white w-full"></div>;
}
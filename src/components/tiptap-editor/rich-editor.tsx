import { onCleanup, onMount } from "solid-js";
import { createEditor, defaultContent } from "./editor-config";
import "./editor-styles.css";
import "katex/dist/katex.min.css";

type Props = {
  value?: string;
  onChange?: (value: string) => void;
};

export default function RichEditor(props: Props) {
  let editorElement: HTMLDivElement | undefined;
  let editor: ReturnType<typeof createEditor> | undefined;
  onMount(() => {
    if (editorElement) {
      editor = createEditor({
        element: editorElement,
        content: props.value ?? defaultContent,
        autofocus: "start",
      });
      editor.on("update", () => {
        props.onChange?.(editor!.getHTML());
      });
    }
  });
  onCleanup(() => {
    editor?.destroy?.();
  });
  return <div ref={editorElement!} id="editor" class="text-white w-full"></div>;
}
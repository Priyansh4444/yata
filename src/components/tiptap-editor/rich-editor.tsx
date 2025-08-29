import { onMount } from "solid-js";
import { createEditor, defaultContent } from "./editor-config";
import "./editor-styles.css";
import katex from "katex";
import "katex/dist/katex.min.css";

export default function RichEditor() {
  onMount(() => {
    const editorElement = document.getElementById("editor");
    if (editorElement) {
      createEditor({
        element: editorElement,
        content: defaultContent,
        autofocus: "start",
      });
    }
  });

  return <div id="editor" class="text-white w-full"></div>;
}

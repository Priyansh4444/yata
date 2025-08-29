import { Editor, FocusPosition } from "@tiptap/core";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Youtube from "@tiptap/extension-youtube";
import StarterKit from "@tiptap/starter-kit";
import { lowlight } from "./lowlight-config";

// Editor configuration interface
export interface EditorConfig {
  element: HTMLElement;
  content?: string;
  autofocus?: boolean | string;
}

// CSS variables for prose styling
export const proseCSSVariables = `
  color: #ffffff;
  --tw-prose-body: #ffffff;
  --tw-prose-headings: #ffffff;
  --tw-prose-lead: #ffffff;
  --tw-prose-links: #ffffff;
  --tw-prose-bold: #ffffff;
  --tw-prose-counters: #f0f0f0;
  --tw-prose-bullets: #f0f0f0;
  --tw-prose-hr: #404040;
  --tw-prose-quotes: #ffffff;
  --tw-prose-quote-borders: #404040;
  --tw-prose-captions: #f0f0f0;
  --tw-prose-kbd: #ffffff;
  --tw-prose-kbd-shadows: #404040;
  --tw-prose-code: #ffffff;
  --tw-prose-pre-code: #ffffff;
  --tw-prose-pre-bg: #0e0e0e;
  --tw-prose-th-borders: #404040;
  --tw-prose-td-borders: #404040;

  /* Compact font sizes and spacing */
  font-size: 0.875rem;
  line-height: 1.25rem;

  /* Override default prose sizes for smaller text */
  --tw-prose-sm: 0.875rem;
  --tw-prose-base: 1rem;
  --tw-prose-lg: 1.125rem;
  --tw-prose-xl: 1.25rem;
  --tw-prose-2xl: 1.5rem;

  /* Reduce margins for all elements */
  --tw-space-y-reverse: 0;
  margin: 0.75rem;
  width: 100%;
  max-width: 100%;

`;

const YOUTUBE_URL_REGEX =
  /(https?:\/\/(?:www\.|m\.)?youtu(?:\.be|be\.com)\/(?:watch\?v=|embed\/|shorts\/)?([\w-]{11}))(?:[&#?].*)?/gi;

/**
 * Function to convert YouTube URLs to embeds in the editor
 */
function convertYouTubeUrls(editor: Editor) {
  const doc = editor.state.doc;
  const tr = editor.state.tr;
  let hasChanges = false;

  // Traverse the document to find text nodes with YouTube URLs
  doc.descendants((node, pos) => {
    if (node.isText && node.text) {
      const text = node.text;
      const matches = Array.from(text.matchAll(YOUTUBE_URL_REGEX));

      if (matches.length > 0) {
        // Process matches in reverse order to maintain correct positions
        matches.reverse().forEach((match) => {
          if (match.index !== undefined) {
            const matchStart = pos + match.index;
            const matchEnd = matchStart + match[0].length;

            // Delete the URL text
            tr.delete(matchStart, matchEnd);

            // Insert YouTube embed at the same position
            tr.insert(
              matchStart,
              editor.schema.nodes.youtube.create({
                src: match[1],
                width: 640,
                height: 360,
              }),
            );

            hasChanges = true;
          }
        });
      }
    }
  });

  if (hasChanges) {
    editor.view.dispatch(tr);
  }
}

// Create editor function
export function createEditor(config: EditorConfig): Editor {
  let createdEditor: Editor;
  createdEditor = new Editor({
    element: config.element,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: "python",
        exitOnTripleEnter: true,
        exitOnArrowDown: true,
        HTMLAttributes: {
          spellcheck: "false",
        },
      }),

      Youtube.configure({
        width: 640,
        height: 360,
        controls: true,
        nocookie: true,
        HTMLAttributes: {
          // lazy load YouTube iframes
          loading: "lazy",
        },
        allowFullscreen: true,
        autoplay: false,
        modestBranding: true,
        ccLoadPolicy: true,
        inline: true,
        addPasteHandler: true,
      }),
    ],
    editorProps: {
      attributes: {
        class:
          "prose w-full prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none",
        style: proseCSSVariables,
      },
    },
    onCreate: ({ editor: currentEditor }) => {
      convertYouTubeUrls(currentEditor);
    },
    onUpdate: ({ editor: currentEditor }) => {
    },
    content: config.content || "",
    autofocus: (config.autofocus as FocusPosition | undefined) || "end",
  });

  return createdEditor;
}

// Default content for demo
export const defaultContent = `
<h1>Rich Content Demo</h1>
<h2>YouTube</h2>
<p>Paste a YouTube URL to embed automatically:</p>
<p>https://www.youtube.com/watch?v=dQw4w9WgXcQ</p>

<h2>Math</h2>
<p>Inline: $E=mc^2$ and $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$</p>
<p>Block:</p>
<p>$$ \\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi} $$</p>

<h2>Code</h2>
<pre><code class="language-javascript">function fizzBuzz() {
  for (let i = 1; i <= 20; i++) {
    if (i % 15 === 0) {
      console.log("FizzBuzz");
    } else if (i % 3 === 0) {
      console.log("Fizz");
    } else if (i % 5 === 0) {
      console.log("Buzz");
    } else {
      console.log(i);
    }
  }
}
fizzBuzz();</code></pre>

<p>Try typing <code>\`\`\`javascript</code> followed by your code to create syntax-highlighted code blocks!</p>

<p>Try typing inline math with <code>$...$</code> or block math with <code>$$...$$</code>.</p>
`;

// Mathematics.configure({
//   katexOptions: { displayMode: false, macros: { "\\RR": "\\mathbb{R}" } },
//   blockOptions: {
//     onClick: (node, pos) => {
//       const newCalculation = prompt(
//         "Enter new calculation:",
//         node.attrs.latex,
//       );
//       if (newCalculation) {
//         createdEditor
//           .chain()
//           .setNodeSelection(pos)
//           .updateBlockMath({ latex: newCalculation })
//           .focus()
//           .run();
//       }
//     },
//   },
//   inlineOptions: {
//     onClick: (node, pos) => {
//       const newCalculation = prompt(
//         "Enter new calculation:",
//         node.attrs.latex,
//       );
//       if (newCalculation) {
//         createdEditor
//           .chain()
//           .setNodeSelection(pos)
//           .updateInlineMath({ latex: newCalculation })
//           .focus()
//           .run();
//       }
//     },
//   },
// }),

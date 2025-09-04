import { Option } from "@/types";
import { Extension } from "@tiptap/core";
import {
  Plugin,
  PluginKey,
  TextSelection,
  Transaction,
  EditorState,
} from "@tiptap/pm/state";
import { Decoration, DecorationSet, EditorView } from "@tiptap/pm/view";
import type { Node as PMNode } from "@tiptap/pm/model";
import katex from "katex";

// https://prosemirror.net/docs/ref/#state.PluginSpec.view

// Custom KaTeX Extension for handling inline ($) and block ($$) math
// UX: clicking rendered math toggles to raw source for editing.
// Blur or moving selection away re-renders the KaTeX widgets.
//
// Great reference for ProseMirror plugin system and creating a plugin.
// https://emergence-engineering.com/blog/prosemirror-plugin-system
const katexPluginKey = new PluginKey("katexRenderer"); // Unique key for the plugin

type EditingRange = { from: number; to: number };

// MathRange augments EditingRange with the kind of math we matched.
// Used for placing the caret correctly when revealing raw source.
type MathRange = EditingRange & { kind: "inline" | "block" };

type KatexPluginState = {
  decorations: DecorationSet;
  editingRanges: EditingRange[];
};

type KatexDispatchAction =
  | { action: "enableEdit"; from: number; to: number }
  | { action: "clearAllEdits" };

// Helper: find an inline or block math range surrounding a document position.
// This scans the parent textblock of the given position and returns the first
// $...$ or $$...$$ span that includes the target position.
const findMathRangeAtPos = (
  state: EditorState,
  pos: number,
): MathRange | null => {
  const $pos = state.doc.resolve(
    Math.max(0, Math.min(state.doc.content.size, pos)),
  );
  const parent = $pos.parent;
  const parentStart = $pos.start();

  let found: MathRange | null = null;

  parent.forEach((child: PMNode, childOffset: number) => {
    if (found) return;
    if (child.isText && child.text) {
      const text: string = child.text;

      // 1) Block math: $$...$$
      const blockRegex: RegExp = /\$\$(.*?)\$\$/g;
      for (const match of text.matchAll(blockRegex)) {
        if (match.index === undefined) continue;
        const from: number = parentStart + childOffset + match.index;
        const to: number = from + match[0].length;
        if (pos >= from && pos <= to) {
          found = { from, to, kind: "block" };
          return;
        }
      }

      // 2) Inline math: $...$ (but not $$...$$)
      const inlineRegex: RegExp = /(?<!\$)\$(?!\$)(.*?)(?<!\$)\$(?!\$)/g;
      for (const match of text.matchAll(inlineRegex)) {
        if (match.index === undefined) continue;
        const from: number = parentStart + childOffset + match.index;
        const to: number = from + match[0].length;
        if (pos >= from && pos <= to) {
          found = { from, to, kind: "inline" };
          return;
        }
      }
    }
  });

  return found;
};

const CustomKatexExtension = Extension.create({
  name: "customKatexRenderer",

  // Add a single ProseMirror plugin that is responsible for:
  // - Scanning the doc for $...$ and $$...$$ and rendering KaTeX widgets
  // - Tracking which math ranges are currently "in edit mode"
  // - Toggling edit mode on click and Backspace
  addProseMirrorPlugins(): Plugin[] {
    return [
      new Plugin({
        key: katexPluginKey,
        state: {
          // Initial plugin state: empty decoration set and no edit ranges
          init(): KatexPluginState {
            return {
              decorations: DecorationSet.empty as DecorationSet,
              editingRanges: [] as EditingRange[],
            };
          },
          // Reducer: compute the next plugin state for each transaction
          apply(tr: Transaction, prev: KatexPluginState): KatexPluginState {
            // 1) Always map editing ranges through the transaction so they stay in sync
            let editingRanges: EditingRange[] = prev.editingRanges.map(
              (r: EditingRange): EditingRange => ({
                from: tr.mapping.map(r.from),
                to: tr.mapping.map(r.to),
              }),
            );
            // 2) Handle meta actions for toggling edit mode
            const meta: Option<KatexDispatchAction> =
              tr.getMeta(katexPluginKey);
            if (meta) {
              switch (meta.action) {
                case "enableEdit": {
                  // Add new editing range if not already present
                  const exists = editingRanges.some(
                    (r) => r.from === meta.from && r.to === meta.to,
                  );
                  if (!exists)
                    editingRanges = [
                      ...editingRanges,
                      { from: meta.from, to: meta.to },
                    ];
                  break;
                }
                case "clearAllEdits": {
                  editingRanges = [];
                  break;
                }
                // Add more cases here if needed in the future
              }
            }

            // While editing we are accumulating all the ranges If we wanted to have a single editing range we would make it a singleton array here

            // 3) Clear edits when selection moves entirely outside any editing range
            // Makes it so that if the cursor ever leaves the editing range, we re-render the KaTeX
            if (tr.selectionSet && editingRanges.length > 0) {
              const selectionFrom = tr.selection.from;
              const selectionTo = tr.selection.to;
              // if selection does not intersect any editing range, clear all i.e. only keep editing if selection is inside an editing range
              const intersects = editingRanges.some(
                (range) =>
                  !(selectionTo <= range.from || selectionFrom >= range.to),
              );
              if (!intersects) editingRanges = [];
            }

            // --- Finished updating editingRanges ---

            // 4) Rebuild decorations if the doc changed or edit ranges changed
            const shouldRebuild =
              tr.docChanged || editingRanges !== prev.editingRanges;
            if (!shouldRebuild) return prev;

            const decorations: Decoration[] = [];
            const doc = tr.doc;

            // Check if a given span overlaps any editing range i.e. should show raw source
            function isEditingRange(
              from: number,
              to: number,
              editingRanges: EditingRange[],
            ) {
              return editingRanges.some(
                (range) => !(to <= range.from || from >= range.to),
              );
            }

            doc.descendants((node, pos) => {
              if (node.type.name === "text" && node.text) {
                const text = node.text;

                // Block math: $$...$$
                const blockMatches = text.matchAll(/\$\$(.*?)\$\$/g);

                for (const match of blockMatches) {
                  if (match.index !== undefined) {
                    const from = pos + match.index;
                    const to = from + match[0].length;
                    if (isEditingRange(from, to, editingRanges)) continue; // show raw while editing

                    decorations.push(
                      Decoration.widget(
                        from,
                        (view: EditorView) => {
                          const element = document.createElement("div");
                          element.className = "katex-block-math";
                          element.style.cssText =
                            "display: block; margin: 10px 0; text-align: center;";

                          try {
                            katex.render(match[1], element, {
                              displayMode: true,
                              throwOnError: false,
                            });
                          } catch (error) {
                            element.textContent = `Error: ${match[1]}`;
                            element.style.color = "red";
                          }

                          // Click to reveal raw source and place cursor inside $$...$$
                          element.addEventListener(
                            "mousedown",
                            (ev: MouseEvent) => {
                              ev.preventDefault();
                              const toggleTr = view.state.tr.setMeta(
                                katexPluginKey,
                                {
                                  action: "enableEdit",
                                  from,
                                  to,
                                },
                              );
                              view.dispatch(toggleTr);
                              const selTr = view.state.tr.setSelection(
                                TextSelection.create(
                                  view.state.doc,
                                  Math.min(
                                    from + 2,
                                    view.state.doc.content.size,
                                  ),
                                ),
                              );
                              view.dispatch(selTr);
                              view.focus();
                            },
                          );

                          return element;
                        },
                        { side: 1 },
                      ),
                      Decoration.inline(from, to, { style: "display: none;" }),
                    );
                  }
                }

                // Inline math: $...$ (but not $$...$$)
                const inlineMatches = text.matchAll(
                  /(?<!\$)\$(?!\$)(.*?)(?<!\$)\$(?!\$)/g,
                );
                for (const match of inlineMatches) {
                  if (match.index !== undefined) {
                    const from = pos + match.index;
                    const to = from + match[0].length;
                    if (isEditingRange(from, to, editingRanges)) continue; // show raw while editing

                    decorations.push(
                      Decoration.widget(
                        from,
                        (view: EditorView) => {
                          const element = document.createElement("span");
                          element.className = "katex-inline-math";
                          element.style.cssText = "display: inline;";

                          try {
                            katex.render(match[1], element, {
                              displayMode: false,
                              throwOnError: false,
                            });
                          } catch (error) {
                            element.textContent = `Error: ${match[1]}`;
                            element.style.color = "red";
                          }

                          // Click to reveal raw source and place cursor inside $...$
                          element.addEventListener(
                            "mousedown",
                            (ev: MouseEvent) => {
                              ev.preventDefault();
                              const toggleTr = view.state.tr.setMeta(
                                katexPluginKey,
                                {
                                  action: "enableEdit",
                                  from,
                                  to,
                                },
                              );
                              view.dispatch(toggleTr);
                              const selTr = view.state.tr.setSelection(
                                TextSelection.create(
                                  view.state.doc,
                                  Math.min(
                                    from + 1,
                                    view.state.doc.content.size,
                                  ),
                                ),
                              );
                              view.dispatch(selTr);
                              view.focus();
                            },
                          );

                          return element;
                        },
                        { side: 1 },
                      ),
                      Decoration.inline(from, to, { style: "display: none;" }),
                    );
                  }
                }
              }
            });

            return {
              decorations: DecorationSet.create(doc, decorations),
              editingRanges,
            };
          },
        },
        props: {
          // Render current DecorationSet maintained by the plugin's state
          decorations(state: EditorState) {
            const pluginState = this.getState(state) as {
              decorations: DecorationSet;
            };
            return pluginState?.decorations ?? DecorationSet.empty;
          },
          handleDOMEvents: {
            // When the editor loses focus, exit edit mode (re-render KaTeX)
            blur: (view: EditorView) => {
              const tr = view.state.tr.setMeta(katexPluginKey, {
                action: "clearAllEdits",
              });
              view.dispatch(tr);
              return false;
            },
          },
          // Keyboard UX: Backspace at/into a KaTeX widget reveals raw source instead of deleting
          handleKeyDown: (view: EditorView, event: KeyboardEvent): boolean => {
            if (event.key !== "Backspace") return false;

            const { state } = view;
            const pluginState = katexPluginKey.getState(state) as
              | KatexPluginState
              | undefined;
            // selection [from, to] backspacing/replacing from (1-indexed I think) to to
            const selectionFrom: number = state.selection.from;
            const targetPos: number = Math.max(0, selectionFrom - 1);

            // If we're already editing a range that includes targetPos, allow normal deletion
            if (
              pluginState &&
              pluginState.editingRanges.some(
                (r) => targetPos >= r.from && targetPos <= r.to,
              )
            ) {
              return false;
            }

            const mathRange: MathRange | null = findMathRangeAtPos(
              state,
              targetPos,
            );
            if (!mathRange) return false;

            // Prevent the default backspace (do not delete anything yet)
            event.preventDefault();

            // 1) Enable edit mode for the detected math span so KaTeX widget disappears
            const enableTr = state.tr.setMeta(katexPluginKey, {
              action: "enableEdit",
              from: mathRange.from,
              to: mathRange.to,
            } as KatexDispatchAction);
            view.dispatch(enableTr);

            // 2) Place the caret just inside the math delimiters for convenience
            const insideOffset: number = mathRange.kind === "block" ? 2 : 1;
            const caretPos: number = Math.min(
              mathRange.to - insideOffset,
              view.state.doc.content.size,
            );
            const selTr = view.state.tr.setSelection(
              TextSelection.create(view.state.doc, caretPos),
            );
            view.dispatch(selTr);
            view.focus();
            return true;
          },
        },
      }),
    ];
  },

  // addKeyboardShortcuts() {
  //   return {
  //     // Alt+M for inline math
  //     "Alt-m": () => {
  //       const { from, to } = this.editor.state.selection;
  //       this.editor.chain().focus().insertContent("$$").run();
  //       return true;
  //     },
  //     // Alt+Shift+M for block math
  //     "Alt-Shift-m": () => {
  //       const { from, to } = this.editor.state.selection;
  //       this.editor.chain().focus().insertContent("\n$$\n\n$$\n").run();
  //       return true;
  //     },
  //   };
  // },
});

// Block Math Node for dedicated block math editing
// const KatexBlockNode = Node.create({
//   name: "katexBlock",
//   group: "block",
//   atom: true,

//   addAttributes() {
//     return {
//       latex: {
//         default: "",
//         parseHTML: (element) => element.getAttribute("data-latex"),
//         renderHTML: (attributes) => ({ "data-latex": attributes.latex }),
//       },
//     };
//   },

//   parseHTML() {
//     return [
//       {
//         tag: "div[data-katex-block]",
//       },
//     ];
//   },

//   renderHTML({ HTMLAttributes }) {
//     const element = document.createElement("div");
//     element.setAttribute("data-katex-block", "true");
//     element.className = "katex-block-container";
//     element.style.cssText =
//       "display: block; margin: 15px 0; text-align: center; padding: 10px; border: 1px dashed #ccc; border-radius: 4px;";

//     if (HTMLAttributes.latex) {
//       try {
//         katex.render(HTMLAttributes.latex, element, {
//           displayMode: true,
//           throwOnError: false,
//         });
//       } catch (error) {
//         element.textContent = `Math Error: ${HTMLAttributes.latex}`;
//         element.style.color = "red";
//       }
//     } else {
//       element.textContent = "Click to edit math...";
//       element.style.color = "#999";
//     }

//     return element;
//   },

//   addNodeView() {
//     return ({ node, editor, getPos }) => {
//       const dom = document.createElement("div");
//       dom.className = "katex-block-node";
//       dom.style.cssText =
//         "display: block; margin: 15px 0; text-align: center; padding: 10px; border: 1px dashed #ccc; border-radius: 4px; cursor: pointer;";

//       const renderMath = () => {
//         dom.innerHTML = "";
//         if (node.attrs.latex) {
//           try {
//             katex.render(node.attrs.latex, dom, {
//               displayMode: true,
//               throwOnError: false,
//             });
//           } catch (error) {
//             dom.textContent = `Math Error: ${node.attrs.latex}`;
//             dom.style.color = "red";
//           }
//         } else {
//           dom.textContent = "Click to edit math...";
//           dom.style.color = "#999";
//         }
//       };

//       dom.addEventListener("click", () => {
//         const latex = prompt("Enter LaTeX math:", node.attrs.latex || "");
//         if (latex !== null && typeof getPos === "function") {
//           editor
//             .chain()
//             .focus()
//             .setNodeMarkup(getPos(), undefined, { latex })
//             .run();
//         }
//       });

//       renderMath();

//       return {
//         dom,
//         update(updatedNode) {
//           if (updatedNode.type !== node.type) return false;
//           renderMath();
//           return true;
//         },
//       };
//     };
//   },

//   addCommands() {
//     return {
//       insertKatexBlock:
//         (options) =>
//         ({ chain }) => {
//           return chain()
//             .insertContent({
//               type: this.name,
//               attrs: options,
//             })
//             .run();
//         },
//     };
//   },
// });

// // Inline Math Mark for inline math editing
// const KatexInlineMark = Mark.create({
//   name: "katexInline",

//   addAttributes() {
//     return {
//       latex: {
//         default: "",
//         parseHTML: (element) => element.getAttribute("data-latex"),
//         renderHTML: (attributes) => ({ "data-latex": attributes.latex }),
//       },
//     };
//   },

//   parseHTML() {
//     return [
//       {
//         tag: "span[data-katex-inline]",
//       },
//     ];
//   },

//   renderHTML({ HTMLAttributes }) {
//     const element = document.createElement("span");
//     element.setAttribute("data-katex-inline", "true");
//     element.className = "katex-inline-container";
//     element.style.cssText =
//       "display: inline; padding: 2px 4px; background: rgba(0,0,0,0.1); border-radius: 3px; cursor: pointer;";

//     if (HTMLAttributes.latex) {
//       try {
//         katex.render(HTMLAttributes.latex, element, {
//           displayMode: false,
//           throwOnError: false,
//         });
//       } catch (error) {
//         element.textContent = `Error: ${HTMLAttributes.latex}`;
//         element.style.color = "red";
//       }
//     } else {
//       element.textContent = "math";
//       element.style.color = "#999";
//     }

//     return element;
//   },

//   addCommands() {
//     return {
//       toggleKatexInline:
//         (options) =>
//         ({ chain }) => {
//           return chain().toggleMark(this.name, options).run();
//         },
//     };
//   },
// });

export default CustomKatexExtension;

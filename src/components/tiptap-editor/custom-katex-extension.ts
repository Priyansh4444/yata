import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import katex from "katex";

// Custom KaTeX Extension for handling inline ($) and block ($$) math
// UX: clicking rendered math toggles to raw source for editing.
// Blur or moving selection away re-renders the KaTeX widgets.
const katexPluginKey = new PluginKey("katexRenderer");

const CustomKatexExtension = Extension.create({
  name: "customKatex",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: katexPluginKey,
        state: {
          init() {
            return {
              decorations: DecorationSet.empty as DecorationSet,
              editingRanges: [] as { from: number; to: number }[],
            };
          },
          apply(tr, prev) {
            // Map editing ranges through document changes
            let editingRanges = prev.editingRanges.map((r) => ({
              from: tr.mapping.map(r.from),
              to: tr.mapping.map(r.to),
            }));

            // Handle meta actions for toggling edit mode
            const meta = tr.getMeta(katexPluginKey) as
              | { action: "enableEdit"; from: number; to: number }
              | { action: "clearAllEdits" }
              | undefined;
            if (meta) {
              if (meta.action === "enableEdit") {
                const exists = editingRanges.some((r) => r.from === meta.from && r.to === meta.to);
                if (!exists) editingRanges = [...editingRanges, { from: meta.from, to: meta.to }];
              } else if (meta.action === "clearAllEdits") {
                editingRanges = [];
              }
            }

            // Clear edits when selection moves entirely outside any editing range
            if (tr.selectionSet && editingRanges.length > 0) {
              const selFrom = tr.selection.from;
              const selTo = tr.selection.to;
              const intersects = editingRanges.some((r) => !(selTo <= r.from || selFrom >= r.to));
              if (!intersects) editingRanges = [];
            }

            const shouldRebuild = tr.docChanged || editingRanges !== prev.editingRanges;
            if (!shouldRebuild) return prev;

            const decorations: Decoration[] = [];
            const doc = tr.doc;

            const isEditingRange = (from: number, to: number) =>
              editingRanges.some((r) => !(to <= r.from || from >= r.to));

            doc.descendants((node, pos) => {
              if (node.type.name === "text" && node.text) {
                const text = node.text;

                // Block math: $$...$$
                const blockMatches = text.matchAll(/\$\$(.*?)\$\$/g);
                for (const match of blockMatches) {
                  if (match.index !== undefined) {
                    const from = pos + match.index;
                    const to = from + match[0].length;
                    if (isEditingRange(from, to)) continue; // show raw while editing

                    decorations.push(
                      Decoration.widget(
                        from,
                        (view) => {
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
                          element.addEventListener("mousedown", (ev) => {
                            ev.preventDefault();
                            const toggleTr = view.state.tr.setMeta(katexPluginKey, {
                              action: "enableEdit",
                              from,
                              to,
                            });
                            view.dispatch(toggleTr);
                            const selTr = view.state.tr.setSelection(
                              TextSelection.create(view.state.doc, Math.min(from + 2, view.state.doc.content.size))
                            );
                            view.dispatch(selTr);
                            view.focus();
                          });

                          return element;
                        },
                        { side: 1 },
                      ),
                      Decoration.inline(from, to, { style: "display: none;" }),
                    );
                  }
                }

                // Inline math: $...$ (but not $$...$$)
                const inlineMatches = text.matchAll(/(?<!\$)\$(?!\$)(.*?)(?<!\$)\$(?!\$)/g);
                for (const match of inlineMatches) {
                  if (match.index !== undefined) {
                    const from = pos + match.index;
                    const to = from + match[0].length;
                    if (isEditingRange(from, to)) continue; // show raw while editing

                    decorations.push(
                      Decoration.widget(
                        from,
                        (view) => {
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
                          element.addEventListener("mousedown", (ev) => {
                            ev.preventDefault();
                            const toggleTr = view.state.tr.setMeta(katexPluginKey, {
                              action: "enableEdit",
                              from,
                              to,
                            });
                            view.dispatch(toggleTr);
                            const selTr = view.state.tr.setSelection(
                              TextSelection.create(view.state.doc, Math.min(from + 1, view.state.doc.content.size))
                            );
                            view.dispatch(selTr);
                            view.focus();
                          });

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
          decorations(state) {
            const pluginState = this.getState(state) as {
              decorations: DecorationSet;
            };
            return pluginState?.decorations ?? DecorationSet.empty;
          },
          handleDOMEvents: {
            blur: (view) => {
              const tr = view.state.tr.setMeta(katexPluginKey, { action: "clearAllEdits" });
              view.dispatch(tr);
              return false;
            },
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

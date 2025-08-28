// Export all TipTap editor related files
export { default as RichEditor } from './rich-editor';
export { lowlight, supportedLanguages, common } from './lowlight-config';
export { createEditor, defaultContent, type EditorConfig } from './editor-config';

// Re-export for convenience
export { Editor } from "@tiptap/core";
export { default as StarterKit } from "@tiptap/starter-kit";
export { default as CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";

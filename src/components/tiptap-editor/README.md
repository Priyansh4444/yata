# TipTap Editor

A modular, well-organized TipTap rich text editor with syntax highlighting.

## 📁 File Structure

```
tiptap-editor/
├── index.ts              # Main exports
├── rich-editor.tsx       # Main editor component
├── editor-config.ts      # Editor configuration and factory
├── lowlight-config.ts    # Syntax highlighting setup
├── editor-styles.css     # CSS styles for editor and highlighting
└── README.md            # This file
```

## 🚀 Features

- ✅ **Syntax Highlighting**: Full lowlight integration with common languages
- ✅ **Modular Architecture**: Separated concerns for maintainability
- ✅ **Custom Styling**: Dark theme optimized for your app
- ✅ **Compact Design**: Smaller fonts and reduced spacing
- ✅ **Full Width**: Responsive design that uses available space

## 📝 Usage

```tsx
import { RichEditor } from "./tiptap-editor";

// Use in your component
<RichEditor />
```

## 🔧 Configuration

### Adding New Languages
Edit `lowlight-config.ts` to add more languages:

```ts
import { createLowlight } from 'lowlight';
import javascript from 'highlight.js/lib/languages/javascript';
// Add more languages as needed

const lowlight = createLowlight({
  javascript,
  // ... other languages
});
```

### Customizing Styles
Modify `editor-styles.css` for syntax highlighting colors and `editor-config.ts` for prose variables.

## 🎨 Supported Languages

All common programming languages including:
- JavaScript/TypeScript
- Python
- HTML/CSS
- JSON
- SQL
- And many more...

## 💡 Creating Code Blocks

Type triple backticks followed by the language:

```javascript
```javascript
function hello() {
  console.log("Hello, world!");
}
```
```

This creates a syntax-highlighted code block!

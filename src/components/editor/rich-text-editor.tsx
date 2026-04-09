import { useState, useEffect, useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TurndownService from "turndown";
import { marked } from "marked";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  blankReplacement: (_content, node) => {
    // Avoid double blank lines for block elements
    if (node.nodeName === "P" && node.parentNode?.nodeName === "LI") return "\n";
    return "\n\n";
  },
});

// Override list item rule to avoid extra blank lines
turndown.addRule("listItem", {
  filter: "li",
  replacement: (content, node) => {
    content = content.replace(/^\n+/, "").replace(/\n+$/, "\n");
    const parent = node.parentNode;
    const prefix = parent?.nodeName === "OL"
      ? `${Array.from(parent.children).indexOf(node as Element) + 1}. `
      : "- ";
    return prefix + content;
  },
});

type Mode = "rich" | "markdown";

export function RichTextEditor({
  content,
  onUpdate,
  placeholder = "Write something…",
  className = "",
}: {
  content: string;
  onUpdate: (html: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [mode, setMode] = useState<Mode>("rich");
  const [markdownText, setMarkdownText] = useState("");
  const [hovering, setHovering] = useState(false);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;
  const lastSetContent = useRef("");
  const localUpdateRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
    ],
    editorProps: {
      attributes: {
        class: "tiptap focus:outline-none min-h-[120px] px-4 py-3 text-sm text-foreground leading-relaxed",
      },
    },
    onUpdate: ({ editor }) => {
      localUpdateRef.current = true;
      onUpdateRef.current(editor.getHTML());
    },
  });

  // Sync external content into editor, but skip if the user is actively editing
  // to avoid resetting their cursor position
  useEffect(() => {
    if (!editor) return;
    // If we just made a local edit, skip this remote update
    if (localUpdateRef.current) {
      localUpdateRef.current = false;
      lastSetContent.current = content;
      return;
    }
    if (content !== lastSetContent.current) {
      const currentHtml = editor.getHTML();
      if (currentHtml !== content) {
        // Don't replace content while the user is focused — it resets cursor
        if (editor.isFocused) {
          lastSetContent.current = content;
          return;
        }
        lastSetContent.current = content;
        editor.commands.setContent(content, false);
      }
    }
  }, [editor, content]);

  const switchToMarkdown = useCallback(() => {
    if (!editor) return;
    const html = editor.getHTML();
    const md = turndown.turndown(html);
    setMarkdownText(md);
    setMode("markdown");
  }, [editor]);

  const switchToRich = useCallback(() => {
    const html = marked.parse(markdownText, { async: false }) as string;
    if (editor) {
      lastSetContent.current = html;
      editor.commands.setContent(html, false);
      onUpdateRef.current(html);
    }
    setMode("rich");
  }, [editor, markdownText]);

  const handleMarkdownChange = useCallback(
    (value: string) => {
      setMarkdownText(value);
      const html = marked.parse(value, { async: false }) as string;
      onUpdateRef.current(html);
    },
    [],
  );

  return (
    <div
      className={`group relative rounded-lg border border-border bg-card shadow-card overflow-hidden ${className}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Mode toggle — top right, shown on hover */}
      <div
        className={`absolute top-2 right-2 z-10 transition-opacity ${
          hovering ? "opacity-100" : "opacity-0"
        }`}
      >
        <button
          onClick={() => (mode === "rich" ? switchToMarkdown() : switchToRich())}
          className="rounded-md bg-muted/80 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title={mode === "rich" ? "Switch to Markdown" : "Switch to Rich Text"}
        >
          {mode === "rich" ? "MD" : "Rich"}
        </button>
      </div>

      {mode === "rich" ? (
        <EditorContent editor={editor} className="flex-1" />
      ) : (
        <textarea
          value={markdownText}
          onChange={(e) => handleMarkdownChange(e.target.value)}
          placeholder={placeholder}
          className="w-full flex-1 min-h-[120px] px-4 py-3 text-sm text-foreground bg-transparent font-mono leading-relaxed resize-none focus:outline-none placeholder:text-muted-foreground"
        />
      )}
    </div>
  );
}

"use client";

import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Quote,
  CodeSquare,
  Undo,
  Redo,
  Minus,
} from "lucide-react";

interface EditorToolbarProps {
  editor: Editor;
  onImageInsert?: (url: string) => void;
}

export function EditorToolbar({ editor, onImageInsert }: EditorToolbarProps) {
  const addImage = () => {
    if (onImageInsert) {
      onImageInsert("");
      return;
    }
    const url = window.prompt("Enter image URL:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL:", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const groups = [
    {
      items: [
        {
          icon: Bold,
          action: () => editor.chain().focus().toggleBold().run(),
          active: editor.isActive("bold"),
          title: "Bold",
        },
        {
          icon: Italic,
          action: () => editor.chain().focus().toggleItalic().run(),
          active: editor.isActive("italic"),
          title: "Italic",
        },
        {
          icon: UnderlineIcon,
          action: () => editor.chain().focus().toggleUnderline().run(),
          active: editor.isActive("underline"),
          title: "Underline",
        },
        {
          icon: Strikethrough,
          action: () => editor.chain().focus().toggleStrike().run(),
          active: editor.isActive("strike"),
          title: "Strikethrough",
        },
        {
          icon: Code,
          action: () => editor.chain().focus().toggleCode().run(),
          active: editor.isActive("code"),
          title: "Code",
        },
      ],
    },
    {
      items: [
        {
          icon: Heading1,
          action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
          active: editor.isActive("heading", { level: 1 }),
          title: "Heading 1",
        },
        {
          icon: Heading2,
          action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          active: editor.isActive("heading", { level: 2 }),
          title: "Heading 2",
        },
        {
          icon: Heading3,
          action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
          active: editor.isActive("heading", { level: 3 }),
          title: "Heading 3",
        },
      ],
    },
    {
      items: [
        {
          icon: List,
          action: () => editor.chain().focus().toggleBulletList().run(),
          active: editor.isActive("bulletList"),
          title: "Bullet List",
        },
        {
          icon: ListOrdered,
          action: () => editor.chain().focus().toggleOrderedList().run(),
          active: editor.isActive("orderedList"),
          title: "Ordered List",
        },
        {
          icon: Quote,
          action: () => editor.chain().focus().toggleBlockquote().run(),
          active: editor.isActive("blockquote"),
          title: "Quote",
        },
        {
          icon: CodeSquare,
          action: () => editor.chain().focus().toggleCodeBlock().run(),
          active: editor.isActive("codeBlock"),
          title: "Code Block",
        },
      ],
    },
    {
      items: [
        {
          icon: AlignLeft,
          action: () => editor.chain().focus().setTextAlign("left").run(),
          active: editor.isActive({ textAlign: "left" }),
          title: "Align Left",
        },
        {
          icon: AlignCenter,
          action: () => editor.chain().focus().setTextAlign("center").run(),
          active: editor.isActive({ textAlign: "center" }),
          title: "Align Center",
        },
        {
          icon: AlignRight,
          action: () => editor.chain().focus().setTextAlign("right").run(),
          active: editor.isActive({ textAlign: "right" }),
          title: "Align Right",
        },
      ],
    },
    {
      items: [
        {
          icon: LinkIcon,
          action: setLink,
          active: editor.isActive("link"),
          title: "Link",
        },
        {
          icon: ImageIcon,
          action: addImage,
          active: false,
          title: "Image",
        },
        {
          icon: Minus,
          action: () => editor.chain().focus().setHorizontalRule().run(),
          active: false,
          title: "Horizontal Rule",
        },
      ],
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 p-2">
      {groups.map((group, i) => (
        <div key={i} className="flex items-center gap-0.5">
          {group.items.map((item) => (
            <button
              key={item.title}
              onClick={item.action}
              title={item.title}
              className={`rounded p-1.5 transition-colors ${
                item.active
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              }`}
            >
              <item.icon className="h-4 w-4" />
            </button>
          ))}
          {i < groups.length - 1 && <div className="mx-1 h-5 w-px bg-gray-200" />}
        </div>
      ))}
      <div className="ms-auto flex items-center gap-0.5">
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
        >
          <Undo className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
        >
          <Redo className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

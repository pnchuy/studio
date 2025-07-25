
"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapLink from '@tiptap/extension-link';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Pilcrow,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link as LinkIcon,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCallback, useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

interface EditorToolbarProps {
  editor: any;
}

const EditorToolbar = ({ editor }: EditorToolbarProps) => {
  if (!editor) {
    return null;
  }
  
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const handleLinkPopoverOpenChange = (open: boolean) => {
    setIsLinkPopoverOpen(open);
    if (open) {
      const existingUrl = editor.getAttributes('link').href;
      setLinkUrl(existingUrl || '');
      // Try to paste from clipboard
      if (!existingUrl) {
          navigator.clipboard.readText().then(text => {
            if(text && (text.startsWith('http') || text.startsWith('https'))){
                setLinkUrl(text);
            }
          }).catch(err => {
            // Permissions might not be granted, fail silently
          });
      }
    }
  }

  const handleSetLink = () => {
    if (linkUrl === null) {
      return;
    }
    // empty
    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      setIsLinkPopoverOpen(false);
      setLinkUrl('');
      return;
    }
    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    setIsLinkPopoverOpen(false);
    setLinkUrl('');
  };


  const ToggleButton = ({
    pressed,
    onPressedChange,
    disabled,
    title,
    children,
  }: {
    pressed: boolean;
    onPressedChange: () => void;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <Button
        type="button"
        size="sm"
        variant="ghost"
        className={cn("h-9 px-2.5", pressed && "bg-accent text-accent-foreground")}
        onClick={onPressedChange}
        disabled={disabled}
        title={title}
    >
        {children}
    </Button>
  );

  return (
    <div className="border border-input rounded-t-md p-1 flex flex-wrap items-center gap-1">
      <ToggleButton
        pressed={editor.isActive('heading', { level: 2 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Heading"
      >
        H
      </ToggleButton>
      <ToggleButton
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </ToggleButton>
      <ToggleButton
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </ToggleButton>
      <ToggleButton
        pressed={editor.isActive('strike')}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </ToggleButton>

      <Popover open={isLinkPopoverOpen} onOpenChange={handleLinkPopoverOpenChange}>
          <PopoverTrigger asChild>
              <Button type="button" size="sm" variant="ghost" className={cn("h-9 px-2.5", editor.isActive('link') && "bg-accent text-accent-foreground")} title="Link">
                  <LinkIcon className="h-4 w-4" />
              </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-2">
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSetLink();
                  }
                }}
              />
              <Button size="icon" onClick={handleSetLink}>
                <Check className="h-4 w-4" />
              </Button>
            </div>
          </PopoverContent>
      </Popover>

       <ToggleButton
        pressed={editor.isActive('paragraph')}
        onPressedChange={() => editor.chain().focus().setParagraph().run()}
        title="Paragraph"
      >
        <Pilcrow className="h-4 w-4" />
      </ToggleButton>
      <ToggleButton
        pressed={editor.isActive('bulletList')}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </ToggleButton>
      <ToggleButton
        pressed={editor.isActive('orderedList')}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        title="Ordered List"
      >
        <ListOrdered className="h-4 w-4" />
      </ToggleButton>
      <ToggleButton
        pressed={editor.isActive('codeBlock')}
        onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
        title="Code Block"
      >
        <Code className="h-4 w-4" />
      </ToggleButton>
       <ToggleButton
        pressed={editor.isActive('blockquote')}
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
         title="Blockquote"
      >
        <Quote className="h-4 w-4" />
      </ToggleButton>
       <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-9 px-2.5"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule"
      >
        <Minus className="h-4 w-4" />
      </Button>
    </div>
  );
};


interface RichTextEditorProps {
    value: string | undefined;
    onChange: (value: string) => void;
}

export const RichTextEditor = ({ value, onChange }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: {
          HTMLAttributes: {
            class: 'bg-muted text-muted-foreground rounded-sm p-2 text-sm',
          },
        },
        blockquote: {
          HTMLAttributes: {
              class: 'border-l-4 border-primary pl-4 my-2',
          }
        }
      }),
      TiptapLink.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: 'text-primary underline hover:text-primary/80',
          rel: 'noopener noreferrer nofollow',
          target: '_blank',
        },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose-base min-h-[150px] w-full max-w-none rounded-b-md border border-input bg-background px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  return (
    <div>
        <EditorToolbar editor={editor} />
        <EditorContent editor={editor} />
    </div>
  );
};

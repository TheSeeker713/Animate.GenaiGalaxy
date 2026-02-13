// Rich Text Editor Component using Tiptap
// WYSIWYG editor with formatting toolbar for Story Builder

import React, { useEffect } from 'react'
import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import CharacterCount from '@tiptap/extension-character-count'
import Placeholder from '@tiptap/extension-placeholder'
import type { TiptapJSON } from '../../types/story'
import { debounce } from 'lodash-es'

interface RichTextEditorProps {
  content: TiptapJSON | string | undefined
  onChange: (json: TiptapJSON, html: string, text: string) => void
  placeholder?: string
  maxLength?: number       // Soft limit, shows warning
  showWordCount?: boolean
  compact?: boolean        // Smaller toolbar for inspectors
  className?: string
  disabled?: boolean
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start typing...',
  maxLength,
  showWordCount = true,
  compact = false,
  className = '',
  disabled = false,
}: RichTextEditorProps) {
  // Create debounced onChange handler (500ms delay)
  const debouncedOnChange = React.useMemo(
    () =>
      debounce((editor: Editor) => {
        const json = editor.getJSON()
        onChange(
          json as TiptapJSON,
          editor.getHTML(),
          editor.getText()
        )
      }, 500),
    [onChange]
  )

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],  // Only H2 and H3 for dialogue
        },
      }),
      Underline,
      TextStyle,
      Color,
      CharacterCount.configure({
        limit: maxLength,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: content || '',
    editable: !disabled,
    onUpdate: ({ editor }) => {
      debouncedOnChange(editor)
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none min-h-[100px] p-3 ${disabled ? 'opacity-50' : ''}`,
      },
    },
  })

  // Update content when prop changes (for external updates)
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentContent = editor.getJSON()
      // Only update if content is different to avoid cursor jumping
      if (JSON.stringify(currentContent) !== JSON.stringify(content)) {
        editor.commands.setContent(content)
      }
    }
  }, [content, editor])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      editor?.destroy()
      debouncedOnChange.cancel()
    }
  }, [editor, debouncedOnChange])

  if (!editor) {
    return <div className="border rounded p-3 bg-gray-50 animate-pulse h-24" />
  }

  const charCount = editor.storage.characterCount.characters()
  const wordCount = editor.storage.characterCount.words()
  const isNearLimit = maxLength && charCount > maxLength * 0.9

  return (
    <div className={`border rounded bg-white ${className}`}>
      {/* Toolbar */}
      <RichTextToolbar editor={editor} compact={compact} disabled={disabled} />

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Footer: Word/Char count, warnings */}
      {showWordCount && (
        <div className="border-t px-3 py-2 text-xs text-gray-600 flex justify-between items-center bg-gray-50">
          <div>
            {wordCount} word{wordCount !== 1 ? 's' : ''} • {charCount} character{charCount !== 1 ? 's' : ''}
          </div>
          {isNearLimit && (
            <div className="text-orange-600 font-medium">
              ⚠️ Approaching recommended length ({maxLength} chars)
            </div>
          )}
          {maxLength && charCount > maxLength && (
            <div className="text-red-600 font-medium">
              ⚠️ Exceeds recommended length by {charCount - maxLength} chars
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Toolbar Component
interface RichTextToolbarProps {
  editor: Editor | null
  compact?: boolean
  disabled?: boolean
}

function RichTextToolbar({ editor, compact = false, disabled = false }: RichTextToolbarProps) {
  if (!editor) return null

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b bg-gray-50">
      {/* Text styling */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        disabled={disabled}
        title="Bold (Ctrl+B)"
      >
        <strong className="text-sm font-bold">B</strong>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        disabled={disabled}
        title="Italic (Ctrl+I)"
      >
        <em className="text-sm italic">I</em>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive('underline')}
        disabled={disabled}
        title="Underline (Ctrl+U)"
      >
        <span className="text-sm underline">U</span>
      </ToolbarButton>

      {!compact && (
        <>
          <div className="w-px bg-gray-300 mx-1" />

          {/* Headings */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            disabled={disabled}
            title="Heading"
          >
            <span className="text-sm font-bold">H2</span>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })}
            disabled={disabled}
            title="Subheading"
          >
            <span className="text-sm font-bold">H3</span>
          </ToolbarButton>

          <div className="w-px bg-gray-300 mx-1" />

          {/* Lists */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            disabled={disabled}
            title="Bullet List"
          >
            <span className="text-sm">• List</span>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            disabled={disabled}
            title="Numbered List"
          >
            <span className="text-sm">1. List</span>
          </ToolbarButton>

          <div className="w-px bg-gray-300 mx-1" />

          {/* Text color picker */}
          <ColorPicker
            editor={editor}
            disabled={disabled}
          />
        </>
      )}

      <div className="w-px bg-gray-300 mx-1" />

      {/* Clear formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        disabled={disabled}
        title="Clear Formatting"
      >
        <span className="text-xs">Clear</span>
      </ToolbarButton>
    </div>
  )
}

// Toolbar Button Component
interface ToolbarButtonProps {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title?: string
  children: React.ReactNode
}

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        px-2 py-1 rounded text-sm font-medium transition-colors
        ${active ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-700'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}
        border border-gray-300
      `}
    >
      {children}
    </button>
  )
}

// Color Picker Component
interface ColorPickerProps {
  editor: Editor
  disabled?: boolean
}

function ColorPicker({ editor, disabled }: ColorPickerProps) {
  const colors = [
    { name: 'Black', value: '#000000' },
    { name: 'Gray', value: '#6B7280' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Yellow', value: '#EAB308' },
    { name: 'Green', value: '#10B981' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Pink', value: '#EC4899' },
  ]

  const [showPicker, setShowPicker] = React.useState(false)
  const currentColor = editor.getAttributes('textStyle').color || '#000000'

  return (
    <div className="relative">
      <ToolbarButton
        onClick={() => setShowPicker(!showPicker)}
        disabled={disabled}
        title="Text Color"
      >
        <div className="flex items-center gap-1">
          <span className="text-sm">A</span>
          <div
            className="w-3 h-3 rounded border border-gray-300"
            style={{ backgroundColor: currentColor }}
          />
        </div>
      </ToolbarButton>

      {showPicker && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-white border rounded shadow-lg z-10 grid grid-cols-3 gap-1">
          {colors.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => {
                editor.chain().focus().setColor(color.value).run()
                setShowPicker(false)
              }}
              title={color.name}
              className="w-8 h-8 rounded border-2 border-gray-300 hover:border-blue-500"
              style={{ backgroundColor: color.value }}
            />
          ))}
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().unsetColor().run()
              setShowPicker(false)
            }}
            title="Reset Color"
            className="col-span-3 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  )
}

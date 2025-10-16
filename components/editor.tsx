'use client'

import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/mantine/style.css'
import { useTheme } from 'next-themes'

interface EditorProps {
  onChange: (content: string) => void
  initialContent?: string
}

export function Editor({ onChange, initialContent }: EditorProps) {
  const { theme } = useTheme()

  const editor = useCreateBlockNote({
    initialContent: initialContent ? JSON.parse(initialContent) : undefined,
  })

  const handleChange = () => {
    const content = JSON.stringify(editor.document)
    onChange(content)
  }

  return (
    <div className="rounded-md border border-input min-h-[400px] [&_*]:!outline-none">
      <BlockNoteView
        editor={editor}
        onChange={handleChange}
        theme={theme === 'dark' ? 'dark' : 'light'}
        className="min-h-[400px]"
        spellCheck={false}
      />
    </div>
  )
}

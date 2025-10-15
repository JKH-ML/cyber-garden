"use client"

import { useCreateBlockNote } from "@blocknote/react"
import { BlockNoteView } from "@blocknote/react"
import "@blocknote/react/style.css"
import { useTheme } from "next-themes"

type BlockEditorProps = {
  initialContent?: any
  onChange?: (content: any) => void
  editable?: boolean
}

export function BlockEditor({ initialContent, onChange, editable = true }: BlockEditorProps) {
  const { resolvedTheme } = useTheme()

  const editor = useCreateBlockNote({
    initialContent: initialContent || undefined,
  })

  const handleChange = () => {
    if (onChange) {
      onChange(editor.document)
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <BlockNoteView
        editor={editor}
        onChange={handleChange}
        editable={editable}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
      />
    </div>
  )
}

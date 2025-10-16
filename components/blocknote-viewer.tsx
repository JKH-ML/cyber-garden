'use client'

import { useEffect } from 'react'
import { BlockNoteView } from '@blocknote/mantine'
import { useCreateBlockNote } from '@blocknote/react'

interface BlockNoteViewerProps {
  content: any
}

export default function BlockNoteViewer({ content }: BlockNoteViewerProps) {
  const editor = useCreateBlockNote()

  useEffect(() => {
    if (content && editor) {
      try {
        // content가 문자열이면 파싱, 배열이면 그대로 사용
        const blocks = typeof content === 'string'
          ? JSON.parse(content)
          : content

        if (Array.isArray(blocks) && blocks.length > 0) {
          editor.replaceBlocks(editor.document, blocks)
        }
      } catch (error) {
        console.error('Error loading content:', error)
      }
    }
  }, [content, editor])

  return <BlockNoteView editor={editor} editable={false} theme="light" />
}

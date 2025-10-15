"use client"

import { useState, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  value?: File | null
  onChange: (file: File | null) => void
  preview?: string
  fallbackColor?: string
  fallbackText?: string
  className?: string
}

export function ImageUpload({
  value,
  onChange,
  preview,
  fallbackColor = "#888",
  fallbackText = "?",
  className,
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(preview)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("파일 크기는 5MB를 초과할 수 없습니다")
        return
      }

      if (!file.type.startsWith("image/")) {
        alert("이미지 파일만 업로드 가능합니다")
        return
      }

      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      onChange(file)
    }
  }

  const handleRemove = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(undefined)
    onChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <Avatar className="h-24 w-24">
        <AvatarImage src={previewUrl} />
        <AvatarFallback style={{ backgroundColor: fallbackColor }}>
          {fallbackText}
        </AvatarFallback>
      </Avatar>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          {previewUrl ? "변경" : "업로드"}
        </Button>

        {previewUrl && (
          <Button type="button" variant="outline" size="sm" onClick={handleRemove}>
            <X className="mr-2 h-4 w-4" />
            제거
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        JPG, PNG, WebP (최대 5MB)
      </p>
    </div>
  )
}

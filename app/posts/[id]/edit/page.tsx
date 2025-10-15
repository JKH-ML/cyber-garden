"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/auth-store"
import { useCategories } from "@/hooks/use-categories"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BlockEditor } from "@/components/editor/block-editor"
import { PageSpinner } from "@/components/common/spinner"
import { ErrorState } from "@/components/common/error-state"
import { toast } from "sonner"
import { ArrowLeft, Loader2, Upload, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const editPostSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요").max(100, "제목은 100자 이하여야 합니다"),
  categoryId: z.string().min(1, "카테고리를 선택해주세요"),
})

type EditPostInput = z.infer<typeof editPostSchema>

type ImageFile = {
  file?: File
  preview: string
  id: string
  url?: string
}

export default function EditPostPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const { categories, loading: categoriesLoading } = useCategories()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [content, setContent] = useState<any>(null)
  const [initialContent, setInitialContent] = useState<any>(null)
  const [images, setImages] = useState<ImageFile[]>([])
  const [thumbnailIndex, setThumbnailIndex] = useState<number>(0)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EditPostInput>({
    resolver: zodResolver(editPostSchema),
  })

  const categoryId = watch("categoryId")

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    async function fetchPost() {
      try {
        const { data: postData, error: postError } = await supabase
          .from("posts")
          .select(`
            *,
            images:post_images (
              id,
              image_url,
              display_order
            )
          `)
          .eq("id", params.id)
          .single()

        if (postError) throw postError

        // Check if user is the author
        if (postData.author_id !== user.id) {
          toast.error("게시글 수정 권한이 없습니다")
          router.push(`/posts/${params.id}`)
          return
        }

        setValue("title", postData.title)
        setValue("categoryId", postData.category_id)
        setInitialContent(postData.content)
        setContent(postData.content)

        // Load existing images
        const existingImages = postData.images
          .sort((a: any, b: any) => a.display_order - b.display_order)
          .map((img: any) => ({
            id: img.id,
            preview: img.image_url,
            url: img.image_url,
          }))

        setImages(existingImages)

        // Find thumbnail index
        const thumbIndex = existingImages.findIndex(
          (img: any) => img.url === postData.thumbnail_url
        )
        setThumbnailIndex(thumbIndex !== -1 ? thumbIndex : 0)
      } catch (err) {
        setError(err as Error)
        console.error("Error fetching post:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPost()
  }, [params.id, user, router, supabase, setValue])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newImages: ImageFile[] = []

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name}은(는) 이미지 파일이 아닙니다`)
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}의 크기가 10MB를 초과합니다`)
        return
      }

      newImages.push({
        file,
        preview: URL.createObjectURL(file),
        id: Math.random().toString(36).substr(2, 9),
      })
    })

    setImages((prev) => [...prev, ...newImages])
  }

  const removeImage = (id: string) => {
    setImages((prev) => {
      const newImages = prev.filter((img) => img.id !== id)
      const removedIndex = prev.findIndex((img) => img.id === id)

      if (removedIndex === thumbnailIndex) {
        setThumbnailIndex(0)
      } else if (removedIndex < thumbnailIndex) {
        setThumbnailIndex(thumbnailIndex - 1)
      }

      return newImages
    })
  }

  const onSubmit = async (data: EditPostInput) => {
    if (!user) return

    if (!content) {
      toast.error("내용을 입력해주세요")
      return
    }

    if (images.length === 0) {
      toast.error("최소 1개의 이미지를 업로드해주세요")
      return
    }

    setIsSaving(true)

    try {
      // Upload new images
      const uploadedImages: Array<{ url: string; order: number; id?: string }> = []

      for (let i = 0; i < images.length; i++) {
        const image = images[i]

        if (image.file) {
          // New image - upload it
          const fileExt = image.file.name.split(".").pop()
          const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
          const filePath = `${user.id}/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from("post-images")
            .upload(filePath, image.file)

          if (uploadError) throw uploadError

          const { data: urlData } = supabase.storage
            .from("post-images")
            .getPublicUrl(filePath)

          uploadedImages.push({
            url: urlData.publicUrl,
            order: i,
          })
        } else {
          // Existing image - keep it
          uploadedImages.push({
            url: image.url!,
            order: i,
            id: image.id,
          })
        }
      }

      // Update post
      const { error: postError } = await supabase
        .from("posts")
        .update({
          title: data.title,
          content: content,
          category_id: data.categoryId,
          thumbnail_url: uploadedImages[thumbnailIndex].url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)

      if (postError) throw postError

      // Delete old images that are not in the new list
      const existingImageIds = images.filter((img) => img.url).map((img) => img.id)
      const { error: deleteError } = await supabase
        .from("post_images")
        .delete()
        .eq("post_id", params.id as string)
        .not("id", "in", `(${existingImageIds.join(",")})`)

      if (deleteError && deleteError.code !== "PGRST116") {
        // PGRST116 means no rows to delete, which is fine
        throw deleteError
      }

      // Update or insert post_images
      for (const img of uploadedImages) {
        if (img.id) {
          // Update existing
          await supabase
            .from("post_images")
            .update({ display_order: img.order })
            .eq("id", img.id)
        } else {
          // Insert new
          await supabase.from("post_images").insert({
            post_id: params.id as string,
            image_url: img.url,
            display_order: img.order,
          })
        }
      }

      toast.success("게시글이 수정되었습니다")
      router.push(`/posts/${params.id}`)
    } catch (error: any) {
      console.error("Error updating post:", error)
      toast.error(error.message || "게시글 수정 중 오류가 발생했습니다")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || categoriesLoading) return <PageSpinner />
  if (error)
    return (
      <ErrorState
        title="게시글을 찾을 수 없습니다"
        description="삭제되었거나 존재하지 않는 게시글입니다"
        action={
          <Button onClick={() => router.push("/posts")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            목록으로
          </Button>
        }
      />
    )

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/posts/${params.id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">게시글 수정</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
            <CardDescription>게시글의 제목과 카테고리를 설정하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                placeholder="게시글 제목을 입력하세요"
                {...register("title")}
                disabled={isSaving}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">카테고리</Label>
              <Select
                value={categoryId}
                onValueChange={(value) => setValue("categoryId", value)}
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="카테고리를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-sm text-destructive">{errors.categoryId.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>이미지</CardTitle>
            <CardDescription>
              최소 1개의 이미지를 업로드해주세요 (최대 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={isSaving}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("image-upload")?.click()}
                disabled={isSaving}
              >
                <Upload className="mr-2 h-4 w-4" />
                이미지 추가
              </Button>
            </div>

            {images.length > 0 && (
              <div className="space-y-4">
                <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
                  {images.map((image, index) => (
                    <div
                      key={image.id}
                      className={`relative aspect-video rounded-lg overflow-hidden border-2 ${
                        thumbnailIndex === index
                          ? "border-primary"
                          : "border-transparent"
                      }`}
                    >
                      <Image
                        src={image.preview}
                        alt={`Upload ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {thumbnailIndex !== index && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setThumbnailIndex(index)}
                          >
                            썸네일로 설정
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeImage(image.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {thumbnailIndex === index && (
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-semibold">
                          썸네일
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  이미지를 클릭하여 썸네일을 변경할 수 있습니다
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>내용</CardTitle>
            <CardDescription>게시글의 내용을 작성하세요</CardDescription>
          </CardHeader>
          <CardContent>
            {initialContent && (
              <BlockEditor initialContent={initialContent} onChange={setContent} />
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSaving}
          >
            취소
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            게시글 수정
          </Button>
        </div>
      </form>
    </div>
  )
}

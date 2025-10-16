'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, ImagePlus, Star, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { Editor } from '@/components/editor'
import { useAuthStore } from '@/lib/store/auth-store'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
}

export default function NewPostPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const loading = useAuthStore((state) => state.loading)

  const [title, setTitle] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [category, setCategory] = useState('')
  const [content, setContent] = useState('')
  const [images, setImages] = useState<{ file: File; preview: string; id: string }[]>([])
  const [thumbnailId, setThumbnailId] = useState<string>('')
  const [isClient, setIsClient] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 인증 체크
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // 클라이언트 사이드에서만 에디터 렌더링
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 카테고리 불러오기
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching categories:', error)
    }

    if (data) {
      console.log('Categories loaded:', data)
      setCategories(data)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newImages = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(7),
    }))

    setImages((prev) => [...prev, ...newImages])

    // 첫 이미지를 자동으로 썸네일로 설정
    if (images.length === 0 && newImages.length > 0) {
      setThumbnailId(newImages[0].id)
    }
  }

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id))
    if (thumbnailId === id) {
      setThumbnailId(images[0]?.id || '')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error('로그인이 필요합니다.')
      return
    }

    if (!title.trim()) {
      toast.error('제목을 입력하세요.')
      return
    }

    if (images.length === 0) {
      toast.error('최소 1장의 이미지를 업로드해야 합니다.')
      return
    }

    if (!content.trim()) {
      toast.error('내용을 입력하세요.')
      return
    }

    setIsSubmitting(true)

    try {
      // 1. 이미지 업로드
      const uploadedImageUrls: { url: string; id: string }[] = []

      for (const image of images) {
        const fileExt = image.file.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(fileName, image.file)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          throw new Error('이미지 업로드에 실패했습니다.')
        }

        const { data: { publicUrl } } = supabase.storage
          .from('post-images')
          .getPublicUrl(fileName)

        uploadedImageUrls.push({ url: publicUrl, id: image.id })
      }

      // 2. 썸네일 URL 찾기
      const thumbnailUrl = uploadedImageUrls.find(img => img.id === thumbnailId)?.url || uploadedImageUrls[0].url

      // 3. 게시글 생성
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          title,
          content,
          thumbnail_url: thumbnailUrl,
          category_id: category,
          author_id: user.id,
        })
        .select()
        .single()

      if (postError) {
        console.error('Post creation error:', postError)
        throw new Error('게시글 작성에 실패했습니다.')
      }

      // 4. 이미지 메타데이터 저장
      const imageRecords = uploadedImageUrls.map((img) => ({
        post_id: post.id,
        image_url: img.url,
        is_thumbnail: img.id === thumbnailId,
      }))

      const { error: imagesError } = await supabase
        .from('post_images')
        .insert(imageRecords)

      if (imagesError) {
        console.error('Images metadata error:', imagesError)
      }

      toast.success('게시글이 작성되었습니다.')
      router.push('/')
    } catch (error: any) {
      console.error('Post creation error:', error)
      toast.error(error.message || '게시글 작성에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container px-4 py-8">
        <Card className="mx-auto max-w-4xl">
          <CardHeader>
            <CardTitle className="text-2xl">새 글 작성</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 제목 */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  제목 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="제목을 입력하세요"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* 카테고리 */}
              <div className="space-y-2">
                <Label htmlFor="category">
                  카테고리 <span className="text-destructive">*</span>
                </Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 이미지 업로드 */}
              <div className="space-y-2">
                <Label>
                  이미지 <span className="text-destructive">*</span>
                  <span className="ml-2 text-sm text-muted-foreground">
                    (최소 1장 필수, 별표는 썸네일)
                  </span>
                </Label>

                <div className="grid gap-4">
                  {images.length > 0 && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {images.map((image) => (
                        <div
                          key={image.id}
                          className="relative aspect-video overflow-hidden rounded-lg border"
                        >
                          <Image
                            src={image.preview}
                            alt="업로드된 이미지"
                            fill
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(image.id)}
                            className="absolute right-2 top-2 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setThumbnailId(image.id)}
                            className={`absolute left-2 top-2 rounded-full p-1 ${
                              thumbnailId === image.id
                                ? 'bg-yellow-500 text-white'
                                : 'bg-background/80 text-muted-foreground hover:bg-background'
                            }`}
                          >
                            <Star className="h-4 w-4" fill={thumbnailId === image.id ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 hover:border-primary">
                    <ImagePlus className="h-6 w-6" />
                    <span>이미지 추가</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
              </div>

              {/* 내용 */}
              <div className="space-y-2">
                <Label>
                  내용 <span className="text-destructive">*</span>
                </Label>
                {isClient && <Editor onChange={setContent} />}
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={!title || !category || !content || images.length === 0 || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      작성 중...
                    </>
                  ) : (
                    '작성하기'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
}

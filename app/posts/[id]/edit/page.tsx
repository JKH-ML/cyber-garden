'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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

interface PostImage {
  id: string
  image_url: string
  is_thumbnail: boolean
}

export default function EditPostPage() {
  const router = useRouter()
  const params = useParams()
  const user = useAuthStore((state) => state.user)
  const loading = useAuthStore((state) => state.loading)

  const [title, setTitle] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [category, setCategory] = useState('')
  const [content, setContent] = useState('')
  const [existingImages, setExistingImages] = useState<PostImage[]>([])
  const [newImages, setNewImages] = useState<{ file: File; preview: string; id: string }[]>([])
  const [thumbnailId, setThumbnailId] = useState<string>('')
  const [isClient, setIsClient] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  // 인증 및 권한 체크
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

  // 게시글 데이터 불러오기
  useEffect(() => {
    if (params.id && user) {
      fetchPost()
    }
  }, [params.id, user])

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching categories:', error)
    }

    if (data) {
      setCategories(data)
    }
  }

  const fetchPost = async () => {
    try {
      // 게시글 정보 가져오기
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', params.id)
        .single()

      if (postError) throw postError

      // 권한 체크
      if (post.author_id !== user?.id) {
        toast.error('수정 권한이 없습니다.')
        router.push(`/posts/${params.id}`)
        return
      }

      setTitle(post.title)
      setContent(post.content)
      setCategory(post.category_id)

      // 게시글 이미지 가져오기
      const { data: images, error: imagesError } = await supabase
        .from('post_images')
        .select('*')
        .eq('post_id', params.id)
        .order('created_at', { ascending: true })

      if (imagesError) throw imagesError

      setExistingImages(images || [])

      // 썸네일 설정
      const thumbnail = images?.find(img => img.is_thumbnail)
      if (thumbnail) {
        setThumbnailId(thumbnail.id)
      } else if (images && images.length > 0) {
        setThumbnailId(images[0].id)
      }
    } catch (error) {
      console.error('Error fetching post:', error)
      toast.error('게시글을 불러올 수 없습니다.')
      router.push('/')
    } finally {
      setPageLoading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newImgs = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: `new-${Math.random().toString(36).substring(7)}`,
    }))

    setNewImages((prev) => [...prev, ...newImgs])

    // 첫 이미지를 자동으로 썸네일로 설정 (기존 이미지가 없을 때만)
    if (existingImages.length === 0 && newImages.length === 0 && newImgs.length > 0) {
      setThumbnailId(newImgs[0].id)
    }
  }

  const removeExistingImage = (id: string) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== id))
    if (thumbnailId === id) {
      const remaining = existingImages.filter((img) => img.id !== id)
      if (remaining.length > 0) {
        setThumbnailId(remaining[0].id)
      } else if (newImages.length > 0) {
        setThumbnailId(newImages[0].id)
      } else {
        setThumbnailId('')
      }
    }
  }

  const removeNewImage = (id: string) => {
    setNewImages((prev) => prev.filter((img) => img.id !== id))
    if (thumbnailId === id) {
      if (existingImages.length > 0) {
        setThumbnailId(existingImages[0].id)
      } else {
        const remaining = newImages.filter((img) => img.id !== id)
        setThumbnailId(remaining[0]?.id || '')
      }
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

    if (existingImages.length === 0 && newImages.length === 0) {
      toast.error('최소 1장의 이미지를 업로드해야 합니다.')
      return
    }

    if (!content.trim()) {
      toast.error('내용을 입력하세요.')
      return
    }

    setIsSubmitting(true)

    try {
      // 1. 새 이미지 업로드
      const uploadedImageUrls: { url: string; id: string }[] = []

      for (const image of newImages) {
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

      // 2. 썸네일 URL 결정
      let thumbnailUrl = ''

      // 썸네일이 기존 이미지인 경우
      const existingThumbnail = existingImages.find(img => img.id === thumbnailId)
      if (existingThumbnail) {
        thumbnailUrl = existingThumbnail.image_url
      } else {
        // 썸네일이 새 이미지인 경우
        const newThumbnail = uploadedImageUrls.find(img => img.id === thumbnailId)
        if (newThumbnail) {
          thumbnailUrl = newThumbnail.url
        } else {
          // 썸네일이 지정되지 않은 경우 첫 번째 이미지 사용
          if (existingImages.length > 0) {
            thumbnailUrl = existingImages[0].image_url
          } else if (uploadedImageUrls.length > 0) {
            thumbnailUrl = uploadedImageUrls[0].url
          }
        }
      }

      // 3. 게시글 업데이트
      const { error: postError } = await supabase
        .from('posts')
        .update({
          title,
          content,
          thumbnail_url: thumbnailUrl,
          category_id: category,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)

      if (postError) {
        console.error('Post update error:', postError)
        throw new Error('게시글 수정에 실패했습니다.')
      }

      // 4. 기존 이미지 메타데이터에서 삭제된 이미지 제거
      const { data: currentImages } = await supabase
        .from('post_images')
        .select('*')
        .eq('post_id', params.id)

      const existingImageIds = existingImages.map(img => img.id)
      const imagesToDelete = currentImages?.filter(img => !existingImageIds.includes(img.id)) || []

      for (const image of imagesToDelete) {
        await supabase
          .from('post_images')
          .delete()
          .eq('id', image.id)
      }

      // 5. 새 이미지 메타데이터 추가
      if (uploadedImageUrls.length > 0) {
        const imageRecords = uploadedImageUrls.map((img) => ({
          post_id: params.id as string,
          image_url: img.url,
          is_thumbnail: img.id === thumbnailId,
        }))

        const { error: imagesError } = await supabase
          .from('post_images')
          .insert(imageRecords)

        if (imagesError) {
          console.error('Images metadata error:', imagesError)
        }
      }

      // 6. 썸네일 플래그 업데이트
      await supabase
        .from('post_images')
        .update({ is_thumbnail: false })
        .eq('post_id', params.id)

      if (existingThumbnail) {
        await supabase
          .from('post_images')
          .update({ is_thumbnail: true })
          .eq('id', thumbnailId)
      }

      toast.success('게시글이 수정되었습니다.')
      router.push(`/posts/${params.id}`)
    } catch (error: any) {
      console.error('Post update error:', error)
      toast.error(error.message || '게시글 수정에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container px-4 py-8">
        <Card className="mx-auto max-w-4xl">
          <CardHeader>
            <CardTitle className="text-2xl">글 수정</CardTitle>
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
                  {(existingImages.length > 0 || newImages.length > 0) && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {/* 기존 이미지 */}
                      {existingImages.map((image) => (
                        <div
                          key={image.id}
                          className="relative aspect-video overflow-hidden rounded-lg border"
                        >
                          <Image
                            src={image.image_url}
                            alt="업로드된 이미지"
                            fill
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(image.id)}
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

                      {/* 새 이미지 */}
                      {newImages.map((image) => (
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
                            onClick={() => removeNewImage(image.id)}
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
                {isClient && <Editor initialContent={content} onChange={setContent} />}
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/posts/${params.id}`)}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={!title || !category || !content || (existingImages.length === 0 && newImages.length === 0) || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      수정 중...
                    </>
                  ) : (
                    '수정하기'
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

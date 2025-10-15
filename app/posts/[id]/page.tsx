"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/auth-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { PageSpinner } from "@/components/common/spinner"
import { ErrorState } from "@/components/common/error-state"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { toast } from "sonner"
import { ArrowLeft, Edit, Trash2, ThumbsUp } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CommentsSection } from "@/components/posts/comments-section"

type Post = {
  id: string
  title: string
  content: any
  thumbnail_url: string
  created_at: string
  updated_at: string
  author_id: string
  author: {
    nickname: string
    avatar_url: string | null
    avatar_color: string | null
  }
  category: {
    name: string
    slug: string
  }
  images: Array<{
    id: string
    image_url: string
    display_order: number
  }>
  ups_count: number
  comments_count: number
  user_has_upped: boolean
}

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpping, setIsUpping] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function fetchPost() {
      try {
        const { data: postData, error: postError } = await supabase
          .from("posts")
          .select(`
            *,
            author:author_id (
              nickname,
              avatar_url,
              avatar_color
            ),
            category:category_id (
              name,
              slug
            ),
            images:post_images (
              id,
              image_url,
              display_order
            )
          `)
          .eq("id", params.id)
          .single()

        if (postError) throw postError

        // Fetch counts
        const [upsRes, commentsRes] = await Promise.all([
          supabase
            .from("post_ups")
            .select("id", { count: "exact", head: true })
            .eq("post_id", params.id as string),
          supabase
            .from("comments")
            .select("id", { count: "exact", head: true })
            .eq("post_id", params.id as string),
        ])

        // Check if user has upped
        let userHasUpped = false
        if (user) {
          const { data: upData } = await supabase
            .from("post_ups")
            .select("id")
            .eq("post_id", params.id as string)
            .eq("user_id", user.id)
            .single()

          userHasUpped = !!upData
        }

        setPost({
          ...postData,
          ups_count: upsRes.count || 0,
          comments_count: commentsRes.count || 0,
          user_has_upped: userHasUpped,
        } as any)
      } catch (err) {
        setError(err as Error)
        console.error("Error fetching post:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [params.id, user, supabase])

  const handleUp = async () => {
    if (!user) {
      toast.error("로그인이 필요합니다")
      return
    }

    if (!post) return

    setIsUpping(true)

    try {
      if (post.user_has_upped) {
        // Remove up
        const { error } = await supabase
          .from("post_ups")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", user.id)

        if (error) throw error

        setPost({
          ...post,
          ups_count: post.ups_count - 1,
          user_has_upped: false,
        })
      } else {
        // Add up
        const { error } = await supabase
          .from("post_ups")
          .insert({ post_id: post.id, user_id: user.id })

        if (error) throw error

        setPost({
          ...post,
          ups_count: post.ups_count + 1,
          user_has_upped: true,
        })
      }
    } catch (error) {
      console.error("Error toggling up:", error)
      toast.error("UP 처리 중 오류가 발생했습니다")
    } finally {
      setIsUpping(false)
    }
  }

  const handleDelete = async () => {
    if (!post) return

    setIsDeleting(true)

    try {
      const { error } = await supabase.from("posts").delete().eq("id", post.id)

      if (error) throw error

      toast.success("게시글이 삭제되었습니다")
      router.push("/posts")
    } catch (error) {
      console.error("Error deleting post:", error)
      toast.error("게시글 삭제 중 오류가 발생했습니다")
      setIsDeleting(false)
    }
  }

  if (loading) return <PageSpinner />
  if (error || !post)
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

  const isAuthor = user?.id === post.author_id

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/posts">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <Badge variant="secondary">{post.category.name}</Badge>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold">{post.title}</h1>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={post.author.avatar_url || ""} />
                  <AvatarFallback
                    style={{
                      backgroundColor: post.author.avatar_color || "#888",
                    }}
                  >
                    {post.author.nickname.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{post.author.nickname}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(post.created_at), {
                      addSuffix: true,
                      locale: ko,
                    })}
                  </p>
                </div>
              </div>

              {isAuthor && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/posts/${post.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      수정
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    삭제
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Thumbnail */}
          <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted">
            <Image
              src={post.thumbnail_url}
              alt={post.title}
              fill
              className="object-cover"
            />
          </div>

          {/* Content */}
          <div className="prose dark:prose-invert max-w-none">
            {/* TODO: Render BlockNote content properly */}
            <div>{JSON.stringify(post.content)}</div>
          </div>

          {/* Additional Images */}
          {post.images.length > 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold">첨부 이미지</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {post.images
                  .sort((a, b) => a.display_order - b.display_order)
                  .filter((img) => img.image_url !== post.thumbnail_url)
                  .map((image) => (
                    <div
                      key={image.id}
                      className="relative aspect-video rounded-lg overflow-hidden bg-muted"
                    >
                      <Image
                        src={image.image_url}
                        alt="게시글 이미지"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              variant={post.user_has_upped ? "default" : "outline"}
              onClick={handleUp}
              disabled={isUpping || !user}
            >
              <ThumbsUp className="mr-2 h-4 w-4" />
              UP {post.ups_count}
            </Button>

            <div className="text-sm text-muted-foreground">
              💬 댓글 {post.comments_count}개
            </div>
          </div>

          {/* Comments Section */}
          <CommentsSection postId={post.id} />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>게시글 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

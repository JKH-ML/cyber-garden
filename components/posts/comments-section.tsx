"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { toast } from "sonner"
import { Heart, Edit, Trash2, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const commentSchema = z.object({
  content: z.string().min(1, "댓글 내용을 입력해주세요").max(500, "댓글은 500자 이하여야 합니다"),
})

type CommentInput = z.infer<typeof commentSchema>

type Comment = {
  id: string
  content: string
  created_at: string
  updated_at: string
  author_id: string
  author: {
    nickname: string
    avatar_url: string | null
    avatar_color: string | null
  }
  likes_count: number
  user_has_liked: boolean
}

type CommentsSectionProps = {
  postId: string
}

export function CommentsSection({ postId }: CommentsSectionProps) {
  const { user } = useAuthStore()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CommentInput>({
    resolver: zodResolver(commentSchema),
  })

  useEffect(() => {
    fetchComments()

    // Subscribe to new comments
    const channel = supabase
      .channel(`comments:${postId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        async (payload) => {
          // Fetch the full comment with author info
          const { data } = await supabase
            .from("comments")
            .select(`
              *,
              author:author_id (
                nickname,
                avatar_url,
                avatar_color
              )
            `)
            .eq("id", payload.new.id)
            .single()

          if (data) {
            setComments((prev) => [
              {
                ...data,
                likes_count: 0,
                user_has_liked: false,
              } as any,
              ...prev,
            ])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [postId, supabase])

  async function fetchComments() {
    try {
      const { data: commentsData, error } = await supabase
        .from("comments")
        .select(`
          *,
          author:author_id (
            nickname,
            avatar_url,
            avatar_color
          )
        `)
        .eq("post_id", postId)
        .is("parent_id", null)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Fetch likes count and user likes for each comment
      const commentsWithLikes = await Promise.all(
        (commentsData || []).map(async (comment) => {
          const { count } = await supabase
            .from("comment_likes")
            .select("id", { count: "exact", head: true })
            .eq("comment_id", comment.id)

          let userHasLiked = false
          if (user) {
            const { data: likeData } = await supabase
              .from("comment_likes")
              .select("id")
              .eq("comment_id", comment.id)
              .eq("user_id", user.id)
              .single()

            userHasLiked = !!likeData
          }

          return {
            ...comment,
            likes_count: count || 0,
            user_has_liked: userHasLiked,
          }
        })
      )

      setComments(commentsWithLikes as any)
    } catch (error) {
      console.error("Error fetching comments:", error)
      toast.error("댓글을 불러오는데 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: CommentInput) => {
    if (!user) {
      toast.error("로그인이 필요합니다")
      return
    }

    setIsSubmitting(true)

    try {
      if (editingId) {
        // Update comment
        const { error } = await supabase
          .from("comments")
          .update({
            content: data.content,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingId)

        if (error) throw error

        setComments((prev) =>
          prev.map((comment) =>
            comment.id === editingId
              ? { ...comment, content: data.content, updated_at: new Date().toISOString() }
              : comment
          )
        )

        toast.success("댓글이 수정되었습니다")
        setEditingId(null)
      } else {
        // Create comment
        const { error } = await supabase.from("comments").insert({
          post_id: postId,
          author_id: user.id,
          content: data.content,
        })

        if (error) throw error

        toast.success("댓글이 작성되었습니다")
        // Refresh comments to get the new one
        await fetchComments()
      }

      reset()
    } catch (error) {
      console.error("Error submitting comment:", error)
      toast.error("댓글 작성 중 오류가 발생했습니다")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (comment: Comment) => {
    setEditingId(comment.id)
    setValue("content", comment.content)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    reset()
  }

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)

    try {
      const { error } = await supabase.from("comments").delete().eq("id", deleteId)

      if (error) throw error

      setComments((prev) => prev.filter((comment) => comment.id !== deleteId))
      toast.success("댓글이 삭제되었습니다")
      setDeleteId(null)
    } catch (error) {
      console.error("Error deleting comment:", error)
      toast.error("댓글 삭제 중 오류가 발생했습니다")
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleLike = async (commentId: string) => {
    if (!user) {
      toast.error("로그인이 필요합니다")
      return
    }

    const comment = comments.find((c) => c.id === commentId)
    if (!comment) return

    try {
      if (comment.user_has_liked) {
        // Remove like
        const { error } = await supabase
          .from("comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id)

        if (error) throw error

        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? { ...c, likes_count: c.likes_count - 1, user_has_liked: false }
              : c
          )
        )
      } else {
        // Add like
        const { error } = await supabase
          .from("comment_likes")
          .insert({ comment_id: commentId, user_id: user.id })

        if (error) throw error

        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? { ...c, likes_count: c.likes_count + 1, user_has_liked: true }
              : c
          )
        )
      }
    } catch (error) {
      console.error("Error toggling like:", error)
      toast.error("좋아요 처리 중 오류가 발생했습니다")
    }
  }

  return (
    <div className="space-y-6">
      <Separator />

      <div>
        <h3 className="text-xl font-semibold mb-4">
          댓글 {comments.length}개
        </h3>

        {/* Comment Form */}
        {user ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-6">
            <Textarea
              placeholder="댓글을 입력하세요"
              {...register("content")}
              disabled={isSubmitting}
              rows={3}
            />
            {errors.content && (
              <p className="text-sm text-destructive">{errors.content.message}</p>
            )}
            <div className="flex gap-2 justify-end">
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                >
                  취소
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "수정" : "댓글 작성"}
              </Button>
            </div>
          </form>
        ) : (
          <Card className="mb-6">
            <CardContent className="p-4 text-center text-muted-foreground">
              댓글을 작성하려면 로그인이 필요합니다
            </CardContent>
          </Card>
        )}

        {/* Comments List */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">댓글을 불러오는 중...</div>
        ) : comments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              첫 번째 댓글을 작성해보세요
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => {
              const isAuthor = user?.id === comment.author_id

              return (
                <Card key={comment.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={comment.author.avatar_url || ""} />
                          <AvatarFallback
                            style={{
                              backgroundColor: comment.author.avatar_color || "#888",
                            }}
                          >
                            {comment.author.nickname.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{comment.author.nickname}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), {
                              addSuffix: true,
                              locale: ko,
                            })}
                            {comment.created_at !== comment.updated_at && " (수정됨)"}
                          </p>
                        </div>
                      </div>

                      {isAuthor && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(comment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(comment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <p className="text-sm whitespace-pre-wrap">{comment.content}</p>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleLike(comment.id)}
                        disabled={!user}
                        className={comment.user_has_liked ? "text-red-500" : ""}
                      >
                        <Heart
                          className="mr-1 h-4 w-4"
                          fill={comment.user_has_liked ? "currentColor" : "none"}
                        />
                        {comment.likes_count}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>댓글 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 댓글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
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

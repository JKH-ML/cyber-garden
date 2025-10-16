'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { useAuthStore } from '@/lib/store/auth-store'
import { supabase } from '@/lib/supabase'
import { formatKoreanDate } from '@/lib/utils'
import { ThumbsUp, MessageCircle, Edit, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'

// BlockNote를 동적으로 import (SSR 방지)
const BlockNoteViewer = dynamic(
  () => import('@/components/blocknote-viewer'),
  { ssr: false }
)

interface Post {
  id: string
  title: string
  content: any
  thumbnail_url: string
  category_id: string
  author_id: string
  up_count: number
  created_at: string
  profiles: {
    nickname: string
    profile_image: string | null
    profile_color: string | null
  }
  categories: {
    name: string
  }
}

interface PostImage {
  id: string
  image_url: string
  is_thumbnail: boolean
}

interface Comment {
  id: string
  content: string
  like_count: number
  created_at: string
  author_id: string
  profiles: {
    nickname: string
    profile_image: string | null
    profile_color: string | null
  }
}

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const user = useAuthStore((state) => state.user)

  const [post, setPost] = useState<Post | null>(null)
  const [postImages, setPostImages] = useState<PostImage[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [isUpped, setIsUpped] = useState(false)
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [highlightedComment, setHighlightedComment] = useState<string | null>(null)

  const commentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  useEffect(() => {
    if (params.id) {
      fetchPost()
      fetchPostImages()
      fetchComments()
    }
  }, [params.id])


  useEffect(() => {
    if (user && params.id) {
      checkIfUpped()
      checkLikedComments()
    }
  }, [user, params.id])

  // URL에서 comment 파라미터 확인하고 스크롤 및 하이라이트
  useEffect(() => {
    const commentId = searchParams.get('comment')
    if (commentId && comments.length > 0) {
      // 약간의 지연 후 스크롤 (DOM이 완전히 렌더링될 때까지 기다림)
      const timer = setTimeout(() => {
        const commentElement = commentRefs.current[commentId]
        if (commentElement) {
          // 스크롤
          commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          // 하이라이트
          setHighlightedComment(commentId)
          // 3초 후 하이라이트 제거
          setTimeout(() => {
            setHighlightedComment(null)
          }, 3000)
        }
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [searchParams, comments])

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            nickname,
            profile_image,
            profile_color
          ),
          categories (
            name
          )
        `)
        .eq('id', params.id)
        .single()

      if (error) throw error
      setPost(data)
    } catch (error) {
      console.error('Error fetching post:', error)
      toast.error('게시글을 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  const fetchPostImages = async () => {
    try {
      const { data, error } = await supabase
        .from('post_images')
        .select('*')
        .eq('post_id', params.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setPostImages(data || [])
    } catch (error) {
      console.error('Error fetching post images:', error)
    }
  }

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles (
            nickname,
            profile_image,
            profile_color
          )
        `)
        .eq('post_id', params.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const checkIfUpped = async () => {
    if (!user) return

    const { data } = await supabase
      .from('post_ups')
      .select('id')
      .eq('post_id', params.id)
      .eq('user_id', user.id)
      .single()

    setIsUpped(!!data)
  }

  const checkLikedComments = async () => {
    if (!user) return

    const { data } = await supabase
      .from('comment_likes')
      .select('comment_id')
      .eq('user_id', user.id)

    if (data) {
      setLikedComments(new Set(data.map(d => d.comment_id)))
    }
  }

  const handleUp = async () => {
    if (!user) {
      toast.error('로그인이 필요합니다.')
      return
    }

    try {
      if (isUpped) {
        // UP 취소
        await supabase
          .from('post_ups')
          .delete()
          .eq('post_id', params.id)
          .eq('user_id', user.id)

        await supabase
          .from('posts')
          .update({ up_count: (post?.up_count || 1) - 1 })
          .eq('id', params.id)

        setIsUpped(false)
        setPost(prev => prev ? { ...prev, up_count: prev.up_count - 1 } : null)
      } else {
        // UP 추가
        await supabase
          .from('post_ups')
          .insert({ post_id: params.id, user_id: user.id })

        await supabase
          .from('posts')
          .update({ up_count: (post?.up_count || 0) + 1 })
          .eq('id', params.id)

        setIsUpped(true)
        setPost(prev => prev ? { ...prev, up_count: prev.up_count + 1 } : null)

        // 알림 생성 (본인이 아닐 때만)
        if (post && post.author_id !== user.id) {
          await supabase
            .from('notifications')
            .insert({
              user_id: post.author_id,
              type: 'up',
              content: `${user.nickname}님이 게시글을 UP했습니다.`,
              post_id: params.id,
            })
        }
      }
    } catch (error) {
      console.error('Error toggling up:', error)
      toast.error('오류가 발생했습니다.')
    }
  }

  const handleCommentLike = async (commentId: string, authorId: string, currentLikes: number) => {
    if (!user) {
      toast.error('로그인이 필요합니다.')
      return
    }

    try {
      const isLiked = likedComments.has(commentId)

      if (isLiked) {
        // 좋아요 취소
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id)

        await supabase
          .from('comments')
          .update({ like_count: currentLikes - 1 })
          .eq('id', commentId)

        setLikedComments(prev => {
          const newSet = new Set(prev)
          newSet.delete(commentId)
          return newSet
        })

        setComments(prev => prev.map(c =>
          c.id === commentId ? { ...c, like_count: c.like_count - 1 } : c
        ))
      } else {
        // 좋아요 추가
        await supabase
          .from('comment_likes')
          .insert({ comment_id: commentId, user_id: user.id })

        await supabase
          .from('comments')
          .update({ like_count: currentLikes + 1 })
          .eq('id', commentId)

        setLikedComments(prev => new Set([...prev, commentId]))

        setComments(prev => prev.map(c =>
          c.id === commentId ? { ...c, like_count: c.like_count + 1 } : c
        ))

        // 알림 생성 (본인이 아닐 때만)
        if (authorId !== user.id) {
          await supabase
            .from('notifications')
            .insert({
              user_id: authorId,
              type: 'like',
              content: `${user.nickname}님이 댓글을 좋아합니다.`,
              post_id: params.id,
              comment_id: commentId,
            })
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      toast.error('오류가 발생했습니다.')
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error('로그인이 필요합니다.')
      return
    }

    if (!newComment.trim()) {
      toast.error('댓글 내용을 입력하세요.')
      return
    }

    setSubmitting(true)

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: params.id,
          author_id: user.id,
          content: newComment,
        })
        .select(`
          *,
          profiles (
            nickname,
            profile_image,
            profile_color
          )
        `)
        .single()

      if (error) throw error

      setComments(prev => [data, ...prev])
      setNewComment('')
      toast.success('댓글이 작성되었습니다.')

      // 알림 생성 (본인이 아닐 때만)
      if (post && post.author_id !== user.id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: post.author_id,
            type: 'comment',
            content: `${user.nickname}님이 댓글을 남겼습니다.`,
            post_id: params.id,
            comment_id: data.id,
          })
      }
    } catch (error) {
      console.error('Error creating comment:', error)
      toast.error('댓글 작성에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePost = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', params.id)

      if (error) throw error

      toast.success('게시글이 삭제되었습니다.')
      router.push('/')
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error('삭제에 실패했습니다.')
    }
  }


  if (loading) {
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

  if (!post) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p>게시글을 찾을 수 없습니다.</p>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container px-4 py-8">
        <article className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">{post.categories.name}</Badge>
              <span className="text-sm text-muted-foreground">{formatKoreanDate(post.created_at)}</span>
            </div>

            <h1 className="text-4xl font-bold mb-6">{post.title}</h1>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  {post.profiles.profile_image ? (
                    <AvatarImage src={post.profiles.profile_image} alt={post.profiles.nickname} />
                  ) : (
                    <AvatarFallback style={{ backgroundColor: post.profiles.profile_color || '#FFB3BA' }}>
                      {post.profiles.nickname[0].toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span className="font-medium">{post.profiles.nickname}</span>
              </div>

              {user?.id === post.author_id && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => router.push(`/posts/${post.id}/edit`)}>
                    <Edit className="h-4 w-4 mr-1" />
                    수정
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDeletePost}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    삭제
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Separator className="mb-6" />

          {/* 이미지 캐러셀 */}
          {postImages.length > 0 ? (
            <div className="mb-8">
              <Carousel className="w-full max-w-4xl mx-auto">
                <CarouselContent>
                  {postImages.map((image, index) => (
                    <CarouselItem key={image.id}>
                      <div className="relative aspect-video w-full rounded-lg overflow-hidden">
                        <Image
                          src={image.image_url}
                          alt={`${post.title} - 이미지 ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {postImages.length > 1 && (
                  <>
                    <CarouselPrevious className="left-2" />
                    <CarouselNext className="right-2" />
                  </>
                )}
              </Carousel>
            </div>
          ) : (
            <div className="relative aspect-video w-full mb-8 rounded-lg overflow-hidden">
              <Image
                src={post.thumbnail_url}
                alt={post.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* 본문 */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <BlockNoteViewer content={post.content} />
            </CardContent>
          </Card>

          {/* UP 버튼 */}
          <div className="flex justify-center mb-8">
            <Button
              variant={isUpped ? "default" : "outline"}
              size="lg"
              onClick={handleUp}
              className="min-w-[120px]"
            >
              <ThumbsUp className="h-5 w-5 mr-2" />
              UP {post.up_count}
            </Button>
          </div>

          <Separator className="mb-8" />

          {/* 댓글 섹션 */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <MessageCircle className="h-6 w-6" />
              댓글 {comments.length}
            </h2>

            {/* 댓글 작성 */}
            {user ? (
              <form onSubmit={handleCommentSubmit} className="mb-8">
                <Textarea
                  placeholder="댓글을 입력하세요..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="mb-2"
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? '작성 중...' : '댓글 작성'}
                  </Button>
                </div>
              </form>
            ) : (
              <Card className="mb-8 bg-muted/50">
                <CardContent className="p-4 text-center">
                  <p className="text-muted-foreground mb-2">댓글을 작성하려면 로그인이 필요합니다.</p>
                  <Button onClick={() => router.push('/login')}>로그인</Button>
                </CardContent>
              </Card>
            )}

            {/* 댓글 목록 */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <Card
                  key={comment.id}
                  ref={(el) => { commentRefs.current[comment.id] = el }}
                  className={`transition-all duration-300 ${
                    highlightedComment === comment.id
                      ? 'ring-2 ring-primary shadow-lg bg-primary/5'
                      : ''
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {comment.profiles.profile_image ? (
                            <AvatarImage src={comment.profiles.profile_image} alt={comment.profiles.nickname} />
                          ) : (
                            <AvatarFallback style={{ backgroundColor: comment.profiles.profile_color || '#FFB3BA' }}>
                              {comment.profiles.nickname[0].toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="font-medium">{comment.profiles.nickname}</p>
                          <p className="text-xs text-muted-foreground">{formatKoreanDate(comment.created_at)}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCommentLike(comment.id, comment.author_id, comment.like_count)}
                        className={likedComments.has(comment.id) ? 'text-primary' : ''}
                      >
                        <ThumbsUp className={`h-4 w-4 mr-1 ${likedComments.has(comment.id) ? 'fill-current' : ''}`} />
                        {comment.like_count}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{comment.content}</p>
                  </CardContent>
                </Card>
              ))}

              {comments.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  첫 댓글을 작성해보세요!
                </p>
              )}
            </div>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  )
}

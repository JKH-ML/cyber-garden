"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useCategories } from "@/hooks/use-categories"
import { usePostsStore } from "@/stores/posts-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PageSpinner } from "@/components/common/spinner"
import { EmptyState } from "@/components/common/empty-state"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import Link from "next/link"
import Image from "next/image"
import { PenSquare } from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"

type Post = {
  id: string
  title: string
  content: any
  thumbnail_url: string
  created_at: string
  author: {
    nickname: string
    avatar_url: string | null
    avatar_color: string | null
  }
  category: {
    name: string
    slug: string
  }
  ups_count: number
  comments_count: number
}

export default function PostsPage() {
  const { user } = useAuthStore()
  const { categories, loading: categoriesLoading } = useCategories()
  const { selectedCategory, setSelectedCategory } = usePostsStore()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchPosts() {
      try {
        let query = supabase
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
            )
          `)
          .order("created_at", { ascending: false })

        if (selectedCategory) {
          query = query.eq("category.slug", selectedCategory)
        }

        const { data, error } = await query

        if (error) throw error

        // Fetch counts for each post
        const postsWithCounts = await Promise.all(
          (data || []).map(async (post) => {
            const [upsRes, commentsRes] = await Promise.all([
              supabase
                .from("post_ups")
                .select("id", { count: "exact", head: true })
                .eq("post_id", post.id),
              supabase
                .from("comments")
                .select("id", { count: "exact", head: true })
                .eq("post_id", post.id),
            ])

            return {
              ...post,
              ups_count: upsRes.count || 0,
              comments_count: commentsRes.count || 0,
            }
          })
        )

        setPosts(postsWithCounts as any)
      } catch (error) {
        console.error("Error fetching posts:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [selectedCategory, supabase])

  if (loading || categoriesLoading) return <PageSpinner />

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">게시글</h1>
          <p className="text-muted-foreground">커뮤니티의 다양한 이야기를 확인하세요</p>
        </div>
        {user && (
          <Button asChild>
            <Link href="/posts/create">
              <PenSquare className="mr-2 h-4 w-4" />
              글쓰기
            </Link>
          </Button>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          onClick={() => setSelectedCategory(null)}
        >
          전체
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.slug ? "default" : "outline"}
            onClick={() => setSelectedCategory(category.slug)}
          >
            {category.name}
          </Button>
        ))}
      </div>

      {/* Posts Grid */}
      {posts.length === 0 ? (
        <EmptyState
          title="게시글이 없습니다"
          description={
            selectedCategory
              ? "이 카테고리에 게시글이 없습니다"
              : "아직 작성된 게시글이 없습니다"
          }
          action={
            user ? (
              <Button asChild>
                <Link href="/posts/create">첫 번째 글 작성하기</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.id} href={`/posts/${post.id}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="relative aspect-video w-full bg-muted">
                  <Image
                    src={post.thumbnail_url}
                    alt={post.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{post.category.name}</Badge>
                  </div>

                  <h3 className="font-semibold text-lg line-clamp-2">
                    {post.title}
                  </h3>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={post.author.avatar_url || ""} />
                        <AvatarFallback
                          style={{
                            backgroundColor: post.author.avatar_color || "#888",
                          }}
                        >
                          {post.author.nickname.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{post.author.nickname}</span>
                    </div>
                    <span>
                      {formatDistanceToNow(new Date(post.created_at), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>👍 {post.ups_count}</span>
                    <span>💬 {post.comments_count}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { Footer } from '@/components/footer'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThumbsUp, MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatKoreanDate } from '@/lib/utils'

interface Post {
  id: string
  title: string
  content: string
  thumbnail_url: string
  category_id: string
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

interface Comment {
  id: string
  content: string
  created_at: string
  post_id: string
  author_id: string
  profiles: {
    nickname: string
    profile_image: string | null
    profile_color: string | null
  }
  posts: {
    title: string
  }
}

interface SearchContentProps {
  isSidebarOpen: boolean
  onCloseSidebar: () => void
}

function SearchContent({ isSidebarOpen, onCloseSidebar }: SearchContentProps) {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const [posts, setPosts] = useState<Post[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('posts')

  useEffect(() => {
    if (query) {
      searchContent()
    }
  }, [query])

  const searchContent = async () => {
    setLoading(true)
    try {
      // 게시글 검색 (제목만 - content는 JSON이므로 제외)
      const { data: postsData, error: postsError } = await supabase
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
        .ilike('title', `%${query}%`)
        .order('created_at', { ascending: false })

      if (!postsError && postsData) {
        setPosts(postsData)
      }

      // 댓글 검색
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select(`
          *,
          profiles (
            nickname,
            profile_image,
            profile_color
          ),
          posts (
            title
          )
        `)
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })

      if (!commentsError && commentsData) {
        setComments(commentsData)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex">
      <Sidebar isOpen={isSidebarOpen} onClose={onCloseSidebar} />
      <main className={`flex-1 px-4 py-8 transition-all duration-300 ${
        isSidebarOpen ? 'ml-64' : 'ml-0'
      } overflow-x-hidden`}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">검색 결과</h1>
          <p className="text-muted-foreground mb-6">
            &quot;{query}&quot; 검색 결과
          </p>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="posts">
                게시글 ({posts.length})
              </TabsTrigger>
              <TabsTrigger value="comments">
                댓글 ({comments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="mt-6">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-2/3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <Link key={post.id} href={`/posts/${post.id}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader className="flex flex-row gap-4">
                          <div className="relative w-32 h-20 flex-shrink-0 rounded-md overflow-hidden">
                            <Image
                              src={post.thumbnail_url}
                              alt={post.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary">{post.categories.name}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatKoreanDate(post.created_at)}
                              </span>
                            </div>
                            <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                              {post.title}
                            </h3>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  {post.profiles.profile_image ? (
                                    <AvatarImage src={post.profiles.profile_image} alt={post.profiles.nickname} />
                                  ) : (
                                    <AvatarFallback style={{ backgroundColor: post.profiles.profile_color || '#FFB3BA' }}>
                                      {post.profiles.nickname[0].toUpperCase()}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <span className="text-sm">{post.profiles.nickname}</span>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <ThumbsUp className="h-4 w-4" />
                                {post.up_count}
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">검색 결과가 없습니다.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="comments" className="mt-6">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-4 w-1/2" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-3/4" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <Link key={comment.id} href={`/posts/${comment.post_id}?comment=${comment.id}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader>
                          <div className="flex items-center gap-2 mb-2">
                            <MessageCircle className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {comment.posts.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              {comment.profiles.profile_image ? (
                                <AvatarImage src={comment.profiles.profile_image} alt={comment.profiles.nickname} />
                              ) : (
                                <AvatarFallback style={{ backgroundColor: comment.profiles.profile_color || '#FFB3BA' }}>
                                  {comment.profiles.nickname[0].toUpperCase()}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <span className="text-sm font-medium">{comment.profiles.nickname}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatKoreanDate(comment.created_at)}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm line-clamp-2">{comment.content}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">검색 결과가 없습니다.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

export default function SearchPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Suspense fallback={
        <div className="flex w-full flex-1">
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          <main className={`flex-1 px-4 py-8 transition-all duration-300 ${
            isSidebarOpen ? 'ml-64' : 'ml-0'
          } overflow-x-hidden`}>
            <Skeleton className="h-10 w-64 mb-8" />
            <Skeleton className="h-96 w-full" />
          </main>
        </div>
      }>
        <SearchContent isSidebarOpen={isSidebarOpen} onCloseSidebar={() => setIsSidebarOpen(false)} />
      </Suspense>
      <Footer />
    </div>
  )
}

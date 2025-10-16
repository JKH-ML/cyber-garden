'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThumbsUp, MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatKoreanDate } from '@/lib/utils'

interface Category {
  id: string
  name: string
}

interface Post {
  id: string
  title: string
  thumbnail_url: string
  category_id: string
  up_count: number
  created_at: string
  profiles: {
    nickname: string
    profile_image: string | null
    profile_color: string | null
  }
  comments: { count: number }[]
}

function PostCardSkeleton() {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-video w-full">
        <Skeleton className="h-full w-full" />
      </div>
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-6 w-3/4" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      </CardHeader>
    </Card>
  )
}

interface PostsContentProps {
  isSidebarOpen: boolean
  onCloseSidebar: () => void
}

function PostsContent({ isSidebarOpen, onCloseSidebar }: PostsContentProps) {
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get('category')
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam)
    }
  }, [categoryParam])

  const fetchData = async () => {
    try {
      // 카테고리 불러오기
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (categoriesData) {
        setCategories(categoriesData)
      }

      // 게시글 불러오기
      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            nickname,
            profile_image,
            profile_color
          ),
          comments (count)
        `)
        .order('created_at', { ascending: false })

      if (postsData) {
        setPosts(postsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredPosts = () => {
    if (selectedCategory === 'all') {
      return posts
    }
    return posts.filter(post => post.category_id === selectedCategory)
  }


  const filteredPosts = getFilteredPosts()

  return (
    <div className="flex">
      <Sidebar isOpen={isSidebarOpen} onClose={onCloseSidebar} />
      <main className={`flex-1 px-4 py-8 transition-all duration-300 ${
        isSidebarOpen ? 'ml-64' : 'ml-0'
      } overflow-x-hidden`}>
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full max-w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="all">전체</TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id}>
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6">

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <PostCardSkeleton key={i} />
              ))
            ) : filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <Link key={post.id} href={`/posts/${post.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="aspect-video w-full relative">
                      <Image
                        src={post.thumbnail_url}
                        alt={post.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <CardHeader className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">
                          {categories.find(c => c.id === post.category_id)?.name}
                        </Badge>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="h-4 w-4" />
                            {post.up_count}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            {post.comments[0]?.count || 0}
                          </div>
                        </div>
                      </div>
                      <h3 className="font-semibold line-clamp-2">{post.title}</h3>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          {post.profiles.profile_image ? (
                            <AvatarImage src={post.profiles.profile_image} alt={post.profiles.nickname} />
                          ) : (
                            <AvatarFallback style={{ backgroundColor: post.profiles.profile_color || '#FFB3BA' }}>
                              {post.profiles.nickname[0].toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="text-sm">
                          <p className="font-medium">{post.profiles.nickname}</p>
                          <p className="text-muted-foreground">{formatKoreanDate(post.created_at)}</p>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <p className="text-lg text-muted-foreground">
                  아직 작성된 글이 없습니다
                </p>
                <Link href="/posts/new">
                  <Button className="mt-4">
                    첫 글 작성하기
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </Tabs>
    </main>
    </div>
  )
}

export default function PostsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Suspense fallback={
        <div className="flex w-full">
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          <main className={`flex-1 px-4 py-8 transition-all duration-300 ${
            isSidebarOpen ? 'ml-64' : 'ml-0'
          } overflow-x-hidden`}>
            <Skeleton className="h-10 w-40 mb-8" />
            <Skeleton className="h-10 w-full mb-6" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <PostCardSkeleton key={i} />
              ))}
            </div>
          </main>
        </div>
      }>
        <PostsContent isSidebarOpen={isSidebarOpen} onCloseSidebar={() => setIsSidebarOpen(false)} />
      </Suspense>
      <Footer />
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { PenSquare, FileText } from "lucide-react"

export default function DashboardPage() {
  const { user, profile } = useAuthStore()
  const [stats, setStats] = useState({ posts: 0, comments: 0, ups: 0 })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!user) return

    async function fetchStats() {
      try {
        const [postsRes, commentsRes, upsRes] = await Promise.all([
          supabase
            .from("posts")
            .select("id", { count: "exact", head: true })
            .eq("author_id", user!.id),
          supabase
            .from("comments")
            .select("id", { count: "exact", head: true })
            .eq("author_id", user!.id),
          supabase
            .from("post_ups")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user!.id),
        ])

        setStats({
          posts: postsRes.count || 0,
          comments: commentsRes.count || 0,
          ups: upsRes.count || 0,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user, supabase])

  if (!profile) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">대시보드</h1>
        <p className="text-muted-foreground">프로필 정보와 활동 현황을 확인하세요</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>프로필</CardTitle>
          <CardDescription>내 프로필 정보</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url || ""} />
              <AvatarFallback style={{ backgroundColor: profile.avatar_color || "#888" }}>
                {profile.nickname.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-xl font-semibold">{profile.nickname}</p>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/settings">프로필 편집</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">작성한 게시글</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.posts}</div>
              <p className="text-xs text-muted-foreground">내가 작성한 게시글 수</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">작성한 댓글</CardTitle>
              <PenSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.comments}</div>
              <p className="text-xs text-muted-foreground">내가 작성한 댓글 수</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">UP 누른 게시글</CardTitle>
              <span className="text-lg">👍</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.ups}</div>
              <p className="text-xs text-muted-foreground">UP을 누른 게시글 수</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>빠른 작업</CardTitle>
          <CardDescription>자주 사용하는 기능</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button asChild>
            <Link href="/posts/create">
              <PenSquare className="mr-2 h-4 w-4" />
              새 게시글 작성
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/notifications">알림 확인</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

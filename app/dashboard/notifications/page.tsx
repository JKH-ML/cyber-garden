"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/common/empty-state"
import { PageSpinner } from "@/components/common/spinner"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { toast } from "sonner"
import Link from "next/link"

type Notification = {
  id: string
  type: string
  content: string
  post_id: string | null
  is_read: boolean
  created_at: string
  actor: {
    nickname: string
    avatar_url: string | null
    avatar_color: string | null
  } | null
}

export default function NotificationsPage() {
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!user) return

    async function fetchNotifications() {
      try {
        const { data, error } = await supabase
          .from("notifications")
          .select(`
            *,
            actor:actor_id (
              nickname,
              avatar_url,
              avatar_color
            )
          `)
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(50)

        if (error) throw error

        setNotifications(data as any)
      } catch (error) {
        console.error("Error fetching notifications:", error)
        toast.error("알림을 불러오는데 실패했습니다")
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()

    // Subscribe to new notifications
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as any, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)

      if (error) throw error

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      )
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user!.id)
        .eq("is_read", false)

      if (error) throw error

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      toast.success("모든 알림을 읽음 처리했습니다")
    } catch (error) {
      console.error("Error marking all as read:", error)
      toast.error("알림 처리 중 오류가 발생했습니다")
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">알림</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `읽지 않은 알림 ${unreadCount}개` : "모든 알림을 확인했습니다"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            모두 읽음 처리
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          title="알림이 없습니다"
          description="아직 받은 알림이 없습니다"
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={notification.is_read ? "opacity-60" : ""}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {notification.actor && (
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={notification.actor.avatar_url || ""} />
                      <AvatarFallback
                        style={{
                          backgroundColor: notification.actor.avatar_color || "#888",
                        }}
                      >
                        {notification.actor.nickname.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className="flex-1 space-y-1">
                    <p className="text-sm">{notification.content}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </span>
                      {!notification.is_read && (
                        <Badge variant="default" className="h-5">
                          NEW
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {notification.post_id && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/posts/${notification.post_id}`}>보기</Link>
                      </Button>
                    )}
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                      >
                        읽음
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

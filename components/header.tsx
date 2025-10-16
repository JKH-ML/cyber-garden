'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/lib/store/auth-store'
import { supabase } from '@/lib/supabase'
import { Bell, Settings, LogOut, MessageCircle, ThumbsUp, Trash2, X, Menu, PenSquare, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'

interface Notification {
  id: string
  type: 'comment' | 'up' | 'like'
  content: string
  post_id: string
  comment_id?: string | null
  is_read: boolean
  created_at: string
  posts: {
    title: string
  }
}

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const user = useAuthStore((state) => state.user)
  const signOut = useAuthStore((state) => state.signOut)
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (user) {
      fetchNotifications()
      // 실시간 알림 구독
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchNotifications()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user])

  const fetchNotifications = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        posts (
          title
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (!error && data) {
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.is_read).length)
    }
  }

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    if (!user) return

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  const handleNotificationClick = (notification: Notification) => {
    if (isSelectionMode) {
      // 선택 모드에서는 토글
      toggleSelectNotification(notification.id)
    } else {
      // 일반 모드에서는 읽음 처리 후 이동
      markAsRead(notification.id)
      // 댓글 관련 알림이면 comment_id를 URL에 포함
      if (notification.comment_id && (notification.type === 'comment' || notification.type === 'like')) {
        router.push(`/posts/${notification.post_id}?comment=${notification.comment_id}`)
      } else {
        router.push(`/posts/${notification.post_id}`)
      }
    }
  }

  const toggleSelectNotification = (notificationId: string) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev)
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId)
      } else {
        newSet.add(notificationId)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedNotifications.size === notifications.length) {
      // 모두 선택된 경우 모두 해제
      setSelectedNotifications(new Set())
    } else {
      // 일부만 선택되거나 하나도 선택되지 않은 경우 모두 선택
      setSelectedNotifications(new Set(notifications.map(n => n.id)))
    }
  }

  const deleteSelectedNotifications = async () => {
    if (selectedNotifications.size === 0) return

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', Array.from(selectedNotifications))

      if (error) throw error

      // UI에서 삭제
      setNotifications(prev => prev.filter(n => !selectedNotifications.has(n.id)))
      setUnreadCount(prev => {
        const deletedUnreadCount = notifications.filter(
          n => !n.is_read && selectedNotifications.has(n.id)
        ).length
        return Math.max(0, prev - deletedUnreadCount)
      })
      setSelectedNotifications(new Set())
      setIsSelectionMode(false)
    } catch (error) {
      console.error('Error deleting notifications:', error)
    }
  }

  const deleteReadNotifications = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user?.id)
        .eq('is_read', true)

      if (error) throw error

      // UI에서 삭제
      setNotifications(prev => prev.filter(n => !n.is_read))
    } catch (error) {
      console.error('Error deleting read notifications:', error)
    }
  }

  const cancelSelectionMode = () => {
    setIsSelectionMode(false)
    setSelectedNotifications(new Set())
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}일 전`
    if (hours > 0) return `${hours}시간 전`
    return '방금 전'
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <MessageCircle className="h-4 w-4" />
      case 'up':
        return <ThumbsUp className="h-4 w-4" />
      case 'like':
        return <ThumbsUp className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="https://github.com/JKH-ML.png"
              alt="Cyber Garden Logo"
              width={40}
              height={40}
              className="rounded-full"
            />
            <span className="text-xl font-bold hidden sm:inline">cyber garden</span>
          </Link>
        </div>

        {/* 검색창 */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </form>

        <nav className="flex items-center gap-4">
          {user ? (
            <>
              {/* 글쓰기 버튼 */}
              <Link href="/posts/new">
                <Button>
                  <PenSquare className="mr-2 h-4 w-4" />
                  글쓰기
                </Button>
              </Link>

              {/* 알림 버튼 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>알림</span>
                    <div className="flex gap-1">
                      {isSelectionMode ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-1 text-xs"
                            onClick={cancelSelectionMode}
                          >
                            <X className="h-3 w-3 mr-1" />
                            취소
                          </Button>
                          {selectedNotifications.size > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-1 text-xs text-destructive"
                              onClick={deleteSelectedNotifications}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              삭제 ({selectedNotifications.size})
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          {unreadCount > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-1 text-xs"
                              onClick={markAllAsRead}
                            >
                              모두 읽음
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-1 text-xs"
                            onClick={() => setIsSelectionMode(true)}
                          >
                            선택
                          </Button>
                          {notifications.some(n => n.is_read) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-1 text-xs text-destructive"
                              onClick={deleteReadNotifications}
                            >
                              모두 삭제
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isSelectionMode && notifications.length > 0 && (
                    <>
                      <div className="px-3 py-2 flex items-center gap-2 bg-muted/50">
                        <Checkbox
                          checked={selectedNotifications.size === notifications.length}
                          onCheckedChange={toggleSelectAll}
                        />
                        <span className="text-sm">
                          전체 선택 ({selectedNotifications.size}/{notifications.length})
                        </span>
                      </div>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <ScrollArea className="h-[400px]">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <DropdownMenuItem
                          key={notification.id}
                          className={`flex flex-col items-start gap-2 p-3 cursor-pointer ${
                            !notification.is_read ? 'bg-muted/50' : ''
                          } ${
                            isSelectionMode && selectedNotifications.has(notification.id)
                              ? 'bg-primary/10'
                              : ''
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start gap-2 w-full">
                            {isSelectionMode && (
                              <Checkbox
                                checked={selectedNotifications.has(notification.id)}
                                onCheckedChange={() => toggleSelectNotification(notification.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            )}
                            <div className="mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium line-clamp-1">
                                {notification.posts?.title || '게시글'}
                              </p>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {notification.content}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDate(notification.created_at)}
                              </p>
                            </div>
                            {!notification.is_read && !isSelectionMode && (
                              <div className="h-2 w-2 rounded-full bg-primary mt-1" />
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Bell className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">알림이 없습니다</p>
                      </div>
                    )}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* 프로필 드롭다운 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative h-9 w-9 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                    <Avatar>
                      {user.profile_image ? (
                        <AvatarImage src={user.profile_image} alt={user.nickname} />
                      ) : (
                        <AvatarFallback style={{ backgroundColor: user.profile_color || '#FFB3BA' }}>
                          {user.nickname?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.nickname}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                    <Settings className="mr-2 h-4 w-4" />
                    대시보드
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button>로그인</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

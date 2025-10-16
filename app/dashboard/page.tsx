'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/lib/store/auth-store'
import { supabase } from '@/lib/supabase'
import { Upload, Loader2, ThumbsUp, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { getRandomPastelColor } from '@/lib/auth'
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { formatKoreanDate } from '@/lib/utils'

export default function DashboardPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const loading = useAuthStore((state) => state.loading)
  const initialize = useAuthStore((state) => state.initialize)

  const [nickname, setNickname] = useState(user?.nickname || '')
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profilePreview, setProfilePreview] = useState<string>(user?.profile_image || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 알림 설정
  const [notifyComments, setNotifyComments] = useState(true)
  const [notifyUps, setNotifyUps] = useState(true)
  const [notifyLikes, setNotifyLikes] = useState(true)

  // 내가 쓴 글, 댓글
  const [myPosts, setMyPosts] = useState<any[]>([])
  const [myComments, setMyComments] = useState<any[]>([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [commentsLoading, setCommentsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      setNickname(user.nickname)
      setProfilePreview(user.profile_image || '')
      fetchMyPosts()
      fetchMyComments()
    }
  }, [user])

  const fetchMyPosts = async () => {
    if (!user) return
    setPostsLoading(true)
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          categories (name),
          comments (count)
        `)
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMyPosts(data || [])
    } catch (error) {
      console.error('Error fetching my posts:', error)
    } finally {
      setPostsLoading(false)
    }
  }

  const fetchMyComments = async () => {
    if (!user) return
    setCommentsLoading(true)
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          posts (
            id,
            title
          )
        `)
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMyComments(data || [])
    } catch (error) {
      console.error('Error fetching my comments:', error)
    } finally {
      setCommentsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('파일 크기는 5MB 이하여야 합니다.')
      return
    }

    // 파일 형식 제한
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다.')
      return
    }

    setProfileImage(file)
    setProfilePreview(URL.createObjectURL(file))
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      let profileImageUrl = user.profile_image

      // 프로필 이미지 업로드
      if (profileImage) {
        const fileExt = profileImage.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('profile-images')
          .upload(fileName, profileImage)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('profile-images')
          .getPublicUrl(fileName)

        profileImageUrl = publicUrl
      }

      // 프로필 정보 업데이트
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          nickname,
          profile_image: profileImageUrl,
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      toast.success('프로필이 업데이트되었습니다.')
      await initialize()
    } catch (error: any) {
      console.error('Profile update error:', error)
      toast.error(error.message || '프로필 업데이트에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error('새 비밀번호가 일치하지 않습니다.')
      return
    }

    if (newPassword.length < 6) {
      toast.error('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      toast.success('비밀번호가 변경되었습니다.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      console.error('Password change error:', error)
      toast.error(error.message || '비밀번호 변경에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">대시보드</h1>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="profile">프로필 설정</TabsTrigger>
              <TabsTrigger value="password">비밀번호 변경</TabsTrigger>
              <TabsTrigger value="notifications">알림 설정</TabsTrigger>
              <TabsTrigger value="my-posts">내가 쓴 글</TabsTrigger>
              <TabsTrigger value="my-comments">내가 쓴 댓글</TabsTrigger>
            </TabsList>

            {/* 프로필 설정 */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>프로필 설정</CardTitle>
                  <CardDescription>
                    닉네임과 프로필 사진을 변경할 수 있습니다.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    {/* 프로필 이미지 */}
                    <div className="space-y-2">
                      <Label>프로필 사진</Label>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                          {profilePreview ? (
                            <AvatarImage src={profilePreview} alt="프로필" />
                          ) : (
                            <AvatarFallback style={{ backgroundColor: user.profile_color || '#FFB3BA' }}>
                              {nickname ? nickname[0].toUpperCase() : '?'}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <label className="cursor-pointer">
                          <div className="flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 hover:bg-accent hover:text-accent-foreground">
                            <Upload className="h-4 w-4" />
                            <span className="text-sm">업로드</span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        5MB 이하, 이미지 파일만 가능
                      </p>
                    </div>

                    <Separator />

                    {/* 닉네임 */}
                    <div className="space-y-2">
                      <Label htmlFor="nickname">닉네임</Label>
                      <Input
                        id="nickname"
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        required
                        maxLength={20}
                      />
                    </div>

                    {/* 이메일 (읽기 전용) */}
                    <div className="space-y-2">
                      <Label htmlFor="email">이메일</Label>
                      <Input
                        id="email"
                        type="email"
                        value={user.email}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        이메일은 변경할 수 없습니다.
                      </p>
                    </div>

                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? '저장 중...' : '변경사항 저장'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 비밀번호 변경 */}
            <TabsContent value="password">
              <Card>
                <CardHeader>
                  <CardTitle>비밀번호 변경</CardTitle>
                  <CardDescription>
                    새로운 비밀번호를 입력하세요.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">새 비밀번호</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="최소 6자 이상"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="비밀번호를 다시 입력하세요"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>

                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? '변경 중...' : '비밀번호 변경'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 알림 설정 */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>알림 설정</CardTitle>
                  <CardDescription>
                    받고 싶은 알림을 선택하세요.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notify-comments">댓글 알림</Label>
                      <p className="text-sm text-muted-foreground">
                        내 게시글에 댓글이 달리면 알림을 받습니다.
                      </p>
                    </div>
                    <Switch
                      id="notify-comments"
                      checked={notifyComments}
                      onCheckedChange={setNotifyComments}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notify-ups">UP 알림</Label>
                      <p className="text-sm text-muted-foreground">
                        내 게시글이 UP을 받으면 알림을 받습니다.
                      </p>
                    </div>
                    <Switch
                      id="notify-ups"
                      checked={notifyUps}
                      onCheckedChange={setNotifyUps}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notify-likes">좋아요 알림</Label>
                      <p className="text-sm text-muted-foreground">
                        내 댓글이 좋아요를 받으면 알림을 받습니다.
                      </p>
                    </div>
                    <Switch
                      id="notify-likes"
                      checked={notifyLikes}
                      onCheckedChange={setNotifyLikes}
                    />
                  </div>

                  <Button
                    onClick={() => toast.success('알림 설정이 저장되었습니다.')}
                  >
                    설정 저장
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 내가 쓴 글 */}
            <TabsContent value="my-posts">
              <Card>
                <CardHeader>
                  <CardTitle>내가 쓴 글</CardTitle>
                  <CardDescription>
                    총 {myPosts.length}개의 글을 작성했습니다.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {postsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : myPosts.length > 0 ? (
                    <div className="space-y-4">
                      {myPosts.map((post) => (
                        <Link key={post.id} href={`/posts/${post.id}`}>
                          <Card className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardHeader className="flex flex-row gap-4 p-4">
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
                                  <Badge variant="secondary">{post.categories?.name}</Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {formatKoreanDate(post.created_at)}
                                  </span>
                                </div>
                                <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                                  {post.title}
                                </h3>
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
                            </CardHeader>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">작성한 글이 없습니다.</p>
                      <Link href="/posts/new">
                        <Button>첫 글 작성하기</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 내가 쓴 댓글 */}
            <TabsContent value="my-comments">
              <Card>
                <CardHeader>
                  <CardTitle>내가 쓴 댓글</CardTitle>
                  <CardDescription>
                    총 {myComments.length}개의 댓글을 작성했습니다.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {commentsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : myComments.length > 0 ? (
                    <div className="space-y-4">
                      {myComments.map((comment) => (
                        <Link key={comment.id} href={`/posts/${comment.posts?.id}?comment=${comment.id}`}>
                          <Card className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardHeader className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground line-clamp-1">
                                  {comment.posts?.title || '게시글'}
                                </span>
                              </div>
                              <p className="text-sm mb-2 line-clamp-2 whitespace-pre-wrap">
                                {comment.content}
                              </p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>{formatKoreanDate(comment.created_at)}</span>
                                <div className="flex items-center gap-1">
                                  ❤️ {comment.like_count}
                                </div>
                              </div>
                            </CardHeader>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">작성한 댓글이 없습니다.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  )
}

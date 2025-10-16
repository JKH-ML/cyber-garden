'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Upload } from 'lucide-react'
import { signUp, PASTEL_COLORS } from '@/lib/auth'
import { toast } from 'sonner'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profilePreview, setProfilePreview] = useState<string>('')
  const [randomColor] = useState(() => PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)])
  const [isLoading, setIsLoading] = useState(false)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.')
      return
    }

    // 파일 형식 제한
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.')
      return
    }

    setProfileImage(file)
    setProfilePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다.')
      return
    }

    if (password.length < 6) {
      toast.error('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    setIsLoading(true)

    try {
      const result = await signUp(email, password, nickname, profileImage || undefined)

      if (result.success) {
        toast.success('회원가입이 완료되었습니다. 이메일을 확인해주세요.')
        router.push('/login')
      } else {
        toast.error(result.error || '회원가입에 실패했습니다.')
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error('회원가입 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">회원가입</CardTitle>
            <CardDescription className="text-center">
              cyber garden의 일원이 되어보세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 프로필 사진 */}
              <div className="space-y-2">
                <Label>프로필 사진</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20" style={{ backgroundColor: profilePreview ? 'transparent' : randomColor }}>
                    {profilePreview ? (
                      <AvatarImage src={profilePreview} alt="프로필" />
                    ) : (
                      <AvatarFallback style={{ backgroundColor: randomColor }}>
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
                  업로드하지 않으면 랜덤 컬러가 적용됩니다 (5MB 이하, 이미지 파일만)
                </p>
              </div>

              {/* 이메일 */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  이메일 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              {/* 닉네임 */}
              <div className="space-y-2">
                <Label htmlFor="nickname">
                  닉네임 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nickname"
                  type="text"
                  placeholder="닉네임을 입력하세요"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  required
                  maxLength={20}
                />
              </div>

              {/* 비밀번호 */}
              <div className="space-y-2">
                <Label htmlFor="password">
                  비밀번호 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="최소 6자 이상"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              {/* 비밀번호 확인 */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  비밀번호 확인 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="비밀번호를 다시 입력하세요"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? '가입 중...' : '회원가입'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">이미 계정이 있으신가요? </span>
              <Link href="/login" className="text-primary hover:underline">
                로그인
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
}

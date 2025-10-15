"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { signupSchema, type SignupInput } from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageUpload } from "@/components/common/image-upload"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

// Generate random color for avatar
function generateRandomColor() {
  const colors = [
    "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
    "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
    "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
    "#ec4899", "#f43f5e",
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarColor] = useState(generateRandomColor())

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  })

  const nickname = watch("nickname", "?")

  const onSubmit = async (data: SignupInput) => {
    setIsLoading(true)

    try {
      // Check if username already exists
      const { data: existingUser, error: checkError } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", data.username)
        .maybeSingle()

      if (checkError && checkError.code !== "PGRST116") {
        console.error("Username check error:", checkError)
        throw new Error("사용자 확인 중 오류가 발생했습니다")
      }

      if (existingUser) {
        toast.error("이미 사용 중인 아이디입니다")
        setIsLoading(false)
        return
      }

      // Sign up user with email confirmation disabled for development
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            nickname: data.nickname,
            avatar_color: avatarColor,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        console.error("SignUp error:", signUpError)
        throw signUpError
      }

      if (!authData.user) {
        throw new Error("사용자 생성에 실패했습니다")
      }

      console.log("User created:", authData.user.id)

      // Wait a bit for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Upload avatar if provided
      let avatarUrl = null
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop()
        const fileName = `${authData.user.id}.${fileExt}`
        const filePath = `${authData.user.id}/${fileName}`

        console.log("Uploading avatar to:", filePath)

        const { error: uploadError } = await supabase.storage
          .from("profile-images")
          .upload(filePath, avatarFile)

        if (uploadError) {
          console.error("Avatar upload error:", uploadError)
          // Don't throw error, just log it
        } else {
          const { data: urlData } = supabase.storage
            .from("profile-images")
            .getPublicUrl(filePath)

          avatarUrl = urlData.publicUrl
          console.log("Avatar uploaded:", avatarUrl)
        }
      }

      // Update profile with avatar URL
      if (avatarUrl) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            avatar_url: avatarUrl,
          })
          .eq("id", authData.user.id)

        if (profileError) {
          console.error("Profile update error:", profileError)
          // Don't throw error, continue
        }
      }

      toast.success("회원가입이 완료되었습니다! 로그인해주세요.")
      router.push("/login")
    } catch (error: any) {
      console.error("Signup error:", error)
      toast.error(error.message || "회원가입 중 오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-8rem)] py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>회원가입</CardTitle>
          <CardDescription>Cyber Garden에 가입하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex justify-center">
              <ImageUpload
                value={avatarFile}
                onChange={setAvatarFile}
                fallbackColor={avatarColor}
                fallbackText={nickname?.charAt(0) || "?"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">아이디</Label>
              <Input
                id="username"
                placeholder="영문 소문자, 숫자, _ 사용 가능"
                {...register("username")}
                disabled={isLoading}
              />
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                {...register("email")}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nickname">닉네임</Label>
              <Input
                id="nickname"
                placeholder="표시될 이름"
                {...register("nickname")}
                disabled={isLoading}
              />
              {errors.nickname && (
                <p className="text-sm text-destructive">{errors.nickname.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="8자 이상, 대/소문자, 숫자 포함"
                {...register("password")}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
              <Input
                id="passwordConfirm"
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                {...register("passwordConfirm")}
                disabled={isLoading}
              />
              {errors.passwordConfirm && (
                <p className="text-sm text-destructive">{errors.passwordConfirm.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              회원가입
            </Button>

            <div className="text-center text-sm">
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="text-primary hover:underline">
                로그인
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

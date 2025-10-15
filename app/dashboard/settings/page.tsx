"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { createClient } from "@/lib/supabase/client"
import { updateProfileSchema, changePasswordSchema, type UpdateProfileInput, type ChangePasswordInput } from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageUpload } from "@/components/common/image-upload"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export default function SettingsPage() {
  const router = useRouter()
  const { user, profile, setAuth } = useAuthStore()
  const supabase = createClient()
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      nickname: profile?.nickname || "",
    },
  })

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  })

  const onSubmitProfile = async (data: UpdateProfileInput) => {
    if (!user || !profile) return
    setIsProfileLoading(true)

    try {
      let avatarUrl = profile.avatar_url

      // Upload new avatar if provided
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop()
        const fileName = `${user.id}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from("profile-images")
          .upload(filePath, avatarFile, { upsert: true })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from("profile-images")
          .getPublicUrl(filePath)

        avatarUrl = urlData.publicUrl
      }

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          nickname: data.nickname,
          avatar_url: avatarUrl,
        })
        .eq("id", user.id)

      if (updateError) throw updateError

      // Refresh profile data
      const { data: updatedProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      setAuth(user, updatedProfile)
      toast.success("프로필이 업데이트되었습니다")
      router.refresh()
    } catch (error: any) {
      console.error("Profile update error:", error)
      toast.error(error.message || "프로필 업데이트 중 오류가 발생했습니다")
    } finally {
      setIsProfileLoading(false)
    }
  }

  const onSubmitPassword = async (data: ChangePasswordInput) => {
    setIsPasswordLoading(true)

    try {
      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user!.email!,
        password: data.currentPassword,
      })

      if (signInError) {
        toast.error("현재 비밀번호가 올바르지 않습니다")
        setIsPasswordLoading(false)
        return
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      })

      if (updateError) throw updateError

      toast.success("비밀번호가 변경되었습니다")
      resetPasswordForm()
    } catch (error: any) {
      console.error("Password change error:", error)
      toast.error(error.message || "비밀번호 변경 중 오류가 발생했습니다")
    } finally {
      setIsPasswordLoading(false)
    }
  }

  if (!profile) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">설정</h1>
        <p className="text-muted-foreground">프로필과 계정 설정을 관리하세요</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>프로필 정보</CardTitle>
          <CardDescription>닉네임과 프로필 사진을 변경할 수 있습니다</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-6">
            <div className="flex justify-center">
              <ImageUpload
                value={avatarFile}
                onChange={setAvatarFile}
                preview={profile.avatar_url || undefined}
                fallbackColor={profile.avatar_color || "#888"}
                fallbackText={profile.nickname.charAt(0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nickname">닉네임</Label>
              <Input
                id="nickname"
                placeholder="표시될 이름"
                {...registerProfile("nickname")}
                disabled={isProfileLoading}
              />
              {profileErrors.nickname && (
                <p className="text-sm text-destructive">{profileErrors.nickname.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>아이디</Label>
              <Input value={profile.username} disabled />
              <p className="text-xs text-muted-foreground">아이디는 변경할 수 없습니다</p>
            </div>

            <Button type="submit" disabled={isProfileLoading}>
              {isProfileLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              프로필 업데이트
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>비밀번호 변경</CardTitle>
          <CardDescription>계정 비밀번호를 변경할 수 있습니다</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">현재 비밀번호</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="현재 비밀번호를 입력하세요"
                {...registerPassword("currentPassword")}
                disabled={isPasswordLoading}
              />
              {passwordErrors.currentPassword && (
                <p className="text-sm text-destructive">{passwordErrors.currentPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">새 비밀번호</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="8자 이상, 대/소문자, 숫자 포함"
                {...registerPassword("newPassword")}
                disabled={isPasswordLoading}
              />
              {passwordErrors.newPassword && (
                <p className="text-sm text-destructive">{passwordErrors.newPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPasswordConfirm">새 비밀번호 확인</Label>
              <Input
                id="newPasswordConfirm"
                type="password"
                placeholder="새 비밀번호를 다시 입력하세요"
                {...registerPassword("newPasswordConfirm")}
                disabled={isPasswordLoading}
              />
              {passwordErrors.newPasswordConfirm && (
                <p className="text-sm text-destructive">{passwordErrors.newPasswordConfirm.message}</p>
              )}
            </div>

            <Button type="submit" disabled={isPasswordLoading}>
              {isPasswordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              비밀번호 변경
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

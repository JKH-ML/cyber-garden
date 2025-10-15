import { z } from "zod"

export const signupSchema = z.object({
  username: z
    .string()
    .min(3, "아이디는 최소 3자 이상이어야 합니다")
    .max(20, "아이디는 최대 20자까지 가능합니다")
    .regex(/^[a-z0-9_]+$/, "아이디는 소문자, 숫자, 언더스코어만 사용 가능합니다"),
  email: z
    .string()
    .email("올바른 이메일 주소를 입력해주세요"),
  password: z
    .string()
    .min(8, "비밀번호는 최소 8자 이상이어야 합니다")
    .regex(/[A-Z]/, "비밀번호는 대문자를 포함해야 합니다")
    .regex(/[a-z]/, "비밀번호는 소문자를 포함해야 합니다")
    .regex(/[0-9]/, "비밀번호는 숫자를 포함해야 합니다"),
  passwordConfirm: z.string(),
  nickname: z
    .string()
    .min(2, "닉네임은 최소 2자 이상이어야 합니다")
    .max(20, "닉네임은 최대 20자까지 가능합니다"),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["passwordConfirm"],
})

export const loginSchema = z.object({
  email: z
    .string()
    .email("올바른 이메일 주소를 입력해주세요"),
  password: z
    .string()
    .min(1, "비밀번호를 입력해주세요"),
  rememberMe: z.boolean().optional(),
})

export const updateProfileSchema = z.object({
  nickname: z
    .string()
    .min(2, "닉네임은 최소 2자 이상이어야 합니다")
    .max(20, "닉네임은 최대 20자까지 가능합니다"),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "현재 비밀번호를 입력해주세요"),
  newPassword: z
    .string()
    .min(8, "비밀번호는 최소 8자 이상이어야 합니다")
    .regex(/[A-Z]/, "비밀번호는 대문자를 포함해야 합니다")
    .regex(/[a-z]/, "비밀번호는 소문자를 포함해야 합니다")
    .regex(/[0-9]/, "비밀번호는 숫자를 포함해야 합니다"),
  newPasswordConfirm: z.string(),
}).refine((data) => data.newPassword === data.newPasswordConfirm, {
  message: "새 비밀번호가 일치하지 않습니다",
  path: ["newPasswordConfirm"],
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

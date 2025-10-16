import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 날짜를 한국 시간으로 포맷팅합니다.
 * 예: 2025-10-16 오후 7:48
 */
export function formatKoreanDate(dateString: string): string {
  // Supabase에서 받은 UTC 시간 문자열을 파싱
  // "2025-10-16 19:58:51.269495+00" 형식
  const utcDate = new Date(dateString)

  // UTC 시간을 그대로 사용 (시간대 변환하지 않음)
  const year = utcDate.getUTCFullYear()
  const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0')
  const day = String(utcDate.getUTCDate()).padStart(2, '0')
  const hours = utcDate.getUTCHours()
  const minutes = String(utcDate.getUTCMinutes()).padStart(2, '0')

  const period = hours < 12 ? '오전' : '오후'
  const displayHours = hours % 12 || 12

  return `${year}-${month}-${day} ${period} ${displayHours}:${minutes}`
}

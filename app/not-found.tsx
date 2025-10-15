import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileQuestion } from "lucide-react"

export default function NotFound() {
  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <FileQuestion className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">404 - 페이지를 찾을 수 없습니다</CardTitle>
          <CardDescription>
            요청하신 페이지를 찾을 수 없습니다. URL을 확인해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild>
            <Link href="/">홈으로 돌아가기</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

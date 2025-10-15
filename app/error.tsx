"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl">오류가 발생했습니다</CardTitle>
          <CardDescription>
            문제가 발생했습니다. 잠시 후 다시 시도해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error.message && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground font-mono break-all">
                {error.message}
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={() => reset()} className="flex-1">
              다시 시도
            </Button>
            <Button variant="outline" onClick={() => window.location.href = "/"} className="flex-1">
              홈으로
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

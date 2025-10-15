import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ErrorStateProps {
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function ErrorState({
  title = "오류가 발생했습니다",
  description = "문제가 지속되면 관리자에게 문의해주세요.",
  action,
}: ErrorStateProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {action && (
          <CardContent className="flex justify-center">
            <Button onClick={action.onClick}>{action.label}</Button>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

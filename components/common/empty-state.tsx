import { FileQuestion } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface EmptyStateProps {
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({
  title = "데이터가 없습니다",
  description = "아직 표시할 내용이 없습니다.",
  action,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <FileQuestion className="h-12 w-12 text-muted-foreground" />
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

import { PostCardSkeleton } from "@/components/common/post-card-skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="h-20 w-full" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

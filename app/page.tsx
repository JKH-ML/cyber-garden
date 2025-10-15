import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Code, Dumbbell, Music } from "lucide-react"

export default function Home() {
  const categories = [
    {
      title: "일상",
      description: "일상 이야기를 나눠보세요",
      icon: FileText,
      slug: "daily",
    },
    {
      title: "개발",
      description: "개발 경험과 지식을 공유하세요",
      icon: Code,
      slug: "dev",
    },
    {
      title: "운동",
      description: "운동 루틴과 팁을 공유하세요",
      icon: Dumbbell,
      slug: "fitness",
    },
    {
      title: "음악",
      description: "좋아하는 음악을 추천하세요",
      icon: Music,
      slug: "music",
    },
  ]

  return (
    <div className="container px-4 py-10">
      {/* Hero Section */}
      <section className="flex flex-col items-center gap-6 py-12 md:py-24 text-center">
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Cyber Garden
          </h1>
          <p className="max-w-[700px] mx-auto text-lg text-muted-foreground sm:text-xl">
            일상, 개발, 운동, 음악을 공유하는 커뮤니티 웹사이트
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
          <Button size="lg" asChild className="min-w-[140px]">
            <Link href="/signup">시작하기</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="min-w-[140px]">
            <Link href="/posts">둘러보기</Link>
          </Button>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 md:py-16">
        <h2 className="text-3xl font-bold tracking-tight text-center mb-10">카테고리</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category, index) => {
            const Icon = category.icon
            return (
              <Link
                key={category.slug}
                href={`/posts?category=${category.slug}`}
                className="group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Card className="h-full transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-primary/50">
                  <CardHeader>
                    <div className="mb-2">
                      <Icon className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
                    </div>
                    <CardTitle className="group-hover:text-primary transition-colors">
                      {category.title}
                    </CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-3">
          <Card className="border-none bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">실시간 알림</CardTitle>
              <CardDescription>
                댓글과 좋아요를 실시간으로 받아보세요
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-none bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">리치 에디터</CardTitle>
              <CardDescription>
                BlockNote 에디터로 멋진 글을 작성하세요
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-none bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">다크모드</CardTitle>
              <CardDescription>
                눈에 편한 다크모드를 지원합니다
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16">
        <Card className="bg-primary text-primary-foreground border-none">
          <CardHeader className="text-center space-y-4 pb-8">
            <CardTitle className="text-2xl md:text-3xl">
              지금 바로 시작하세요
            </CardTitle>
            <CardDescription className="text-primary-foreground/80 text-base">
              회원가입하고 커뮤니티에 참여하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/signup">회원가입</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

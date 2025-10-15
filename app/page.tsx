import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="container py-10">
      <section className="flex flex-col items-center gap-4 py-10 md:py-20">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          Cyber Garden
        </h1>
        <p className="max-w-[700px] text-center text-lg text-muted-foreground sm:text-xl">
          일상, 개발, 운동, 음악을 공유하는 커뮤니티 웹사이트
        </p>
        <div className="flex gap-4 mt-6">
          <Button size="lg" asChild>
            <Link href="/signup">시작하기</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/posts">둘러보기</Link>
          </Button>
        </div>
      </section>

      <section className="py-10">
        <h2 className="text-3xl font-bold tracking-tight text-center mb-8">카테고리</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>일상</CardTitle>
              <CardDescription>일상 이야기를 나눠보세요</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>개발</CardTitle>
              <CardDescription>개발 경험과 지식을 공유하세요</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>운동</CardTitle>
              <CardDescription>운동 루틴과 팁을 공유하세요</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>음악</CardTitle>
              <CardDescription>좋아하는 음악을 추천하세요</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <section className="py-10">
        <Card className="bg-muted">
          <CardHeader>
            <CardTitle>지금 바로 시작하세요</CardTitle>
            <CardDescription>
              회원가입하고 커뮤니티에 참여하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/signup">회원가입</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

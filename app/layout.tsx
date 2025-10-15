import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Cyber Garden",
    template: "%s | Cyber Garden",
  },
  description: "일상, 개발, 운동, 음악을 공유하는 커뮤니티 웹사이트. BlockNote 에디터로 멋진 글을 작성하고, 실시간으로 소통하세요.",
  keywords: ["커뮤니티", "블로그", "일상", "개발", "운동", "음악", "게시판", "Next.js"],
  authors: [{ name: "Cyber Garden Team" }],
  creator: "Cyber Garden Team",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://cyber-garden.vercel.app",
    title: "Cyber Garden",
    description: "일상, 개발, 운동, 음악을 공유하는 커뮤니티 웹사이트",
    siteName: "Cyber Garden",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cyber Garden",
    description: "일상, 개발, 운동, 음악을 공유하는 커뮤니티 웹사이트",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <div className="relative flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

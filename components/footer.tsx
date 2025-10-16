'use client'

import { Moon, Sun, Github } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function Footer() {
  const { theme, setTheme } = useTheme()

  return (
    <footer className="w-full border-t border-border/40 bg-background">
      <div className="container flex h-12 items-center justify-between px-4">
        <Link
          href="https://github.com/JKH-ML/cyber-garden"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Github className="h-5 w-5" />
          <span>GitHub</span>
        </Link>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">테마 토글</span>
        </Button>
      </div>
    </footer>
  )
}

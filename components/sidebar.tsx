'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'
import { Home, FolderOpen } from 'lucide-react'

interface Category {
  id: string
  name: string
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    const category = searchParams.get('category')
    if (category) {
      setSelectedCategory(category)
    } else {
      setSelectedCategory('all')
    }
  }, [searchParams])

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (!error && data) {
      setCategories(data)
    }
  }

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId)
    if (categoryId === 'all') {
      router.push('/')
    } else {
      router.push(`/?category=${categoryId}`)
    }
    onClose()
  }

  return (
    <>
      {/* 사이드바 */}
      <aside
        className={`fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r bg-background transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <ScrollArea className="h-full py-6 px-4">
          <div className="space-y-4">
            <div>
              <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
                메뉴
              </h2>
              <div className="space-y-1">
                <Button
                  variant={selectedCategory === 'all' ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => handleCategoryClick('all')}
                >
                  <Home className="mr-2 h-4 w-4" />
                  전체
                </Button>
              </div>
            </div>

            <Separator />

            <div>
              <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
                카테고리
              </h2>
              <div className="space-y-1">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    <FolderOpen className="mr-2 h-4 w-4" />
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </aside>
    </>
  )
}

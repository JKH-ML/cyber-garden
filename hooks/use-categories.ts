import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export type Category = {
  id: string
  name: string
  slug: string
  is_default: boolean
  created_at: string
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .order("is_default", { ascending: false })
          .order("name")

        if (error) throw error

        setCategories(data || [])
      } catch (err) {
        setError(err as Error)
        console.error("Error fetching categories:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [supabase])

  return { categories, loading, error }
}

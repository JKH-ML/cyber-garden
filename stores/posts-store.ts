import { create } from "zustand"

type PostsState = {
  selectedCategory: string | null
  setSelectedCategory: (category: string | null) => void
}

export const usePostsStore = create<PostsState>((set) => ({
  selectedCategory: null,
  setSelectedCategory: (category) => set({ selectedCategory: category }),
}))

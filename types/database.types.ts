export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          nickname: string
          avatar_url: string | null
          avatar_color: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          nickname: string
          avatar_url?: string | null
          avatar_color?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          nickname?: string
          avatar_url?: string | null
          avatar_color?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          created_by: string | null
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_by?: string | null
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_by?: string | null
          is_default?: boolean
          created_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          title: string
          content: Json
          author_id: string
          category_id: string | null
          thumbnail_url: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: Json
          author_id: string
          category_id?: string | null
          thumbnail_url: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: Json
          author_id?: string
          category_id?: string | null
          thumbnail_url?: string
          created_at?: string
          updated_at?: string
        }
      }
      post_images: {
        Row: {
          id: string
          post_id: string
          image_url: string
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          image_url: string
          display_order: number
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          image_url?: string
          display_order?: number
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          author_id: string
          content: string
          parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          author_id: string
          content: string
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          author_id?: string
          content?: string
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      post_ups: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          created_at?: string
        }
      }
      comment_likes: {
        Row: {
          id: string
          comment_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          comment_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          comment_id?: string
          user_id?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          content: string
          post_id: string | null
          comment_id: string | null
          actor_id: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          content: string
          post_id?: string | null
          comment_id?: string | null
          actor_id?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          content?: string
          post_id?: string | null
          comment_id?: string | null
          actor_id?: string | null
          is_read?: boolean
          created_at?: string
        }
      }
    }
  }
}

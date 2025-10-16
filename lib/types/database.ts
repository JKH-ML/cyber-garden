export interface Profile {
  id: string;
  email: string;
  nickname: string;
  profile_image: string | null;
  profile_color: string | null;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  title: string;
  content: any;
  thumbnail_url: string;
  category_id: string;
  author_id: string;
  up_count: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  like_count: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'comment' | 'up' | 'like';
  content: string;
  post_id: string | null;
  comment_id: string | null;
  is_read: boolean;
  created_at: string;
}

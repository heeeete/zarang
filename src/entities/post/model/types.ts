/**
 * 게시글(Post)의 기본 인터페이스입니다.
 * DB 뷰(explore_posts_with_author) 및 JOIN 결과를 기반으로 합니다.
 */
export interface Post {
  id: string;
  author_id: string;
  description: string | null;
  thumbnail_url: string | null;
  audio_url?: string | null;
  width: number | null;
  height: number | null;
  created_at: string;
  author: {
    id?: string;
    username: string;
    avatar_url?: string | null;
  };
  categories?: {
    id?: string;
    slug?: string;
    label: string;
  } | null;
  _count?: {
    post_likes: number;
    comments: number;
  };
}

export interface PostComment {
  id: string;
  content: string;
  author_id: string;
  created_at: string;
  parent_id: string | null;
  author: {
    username: string;
    avatar_url: string | null;
  } | null;
}

/**
 * 게시글 상세 정보 인터페이스입니다.
 */
export interface DetailPost extends Post {
  images: {
    id: string;
    image_url: string;
    width: number | null;
    height: number | null;
  }[];
  likes: { count: number }[];
  comments: { count: number }[];
}

/**
 * Supabase로부터 받는 원시 데이터 형태를 정의합니다.
 */
export interface RawPostResponse {
  id: string;
  author_id: string;
  description: string | null;
  thumbnail_url: string | null;
  audio_url: string | null;
  author_username?: string | null;
  author_avatar_url?: string | null;
  author?: { username: string; avatar_url?: string | null } | null;
  images: { width: number | null; height: number | null }[];
  post_likes: { count: number }[];
  comments: { count: number }[];
  created_at: string;
  categories?: { label: string } | null;
}

/**
 * 추천 알고리즘 RPC(get_home_feed)로부터 받는 원시 데이터 형태입니다.
 */
export interface RawHomePostResponse {
  id: string;
  author_id: string;
  description: string | null;
  thumbnail_url: string | null;
  audio_url: string | null;
  category_id: string;
  created_at: string;
  author_username: string | null;
  author_avatar_url: string | null;
  likes_count: number;
  comments_count: number;
  score: number;
  width: number;
  height: number;
}

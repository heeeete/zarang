export interface ExplorePost {
  id: string;
  title: string | null;
  thumbnail_url: string | null;
  audio_url?: string | null; // 추가
  width: number | null;
  height: number | null;
  author: {
    username: string;
  };
  _count?: {
    post_likes: number;
    comments: number;
  };
}

export interface RawExplorePost {
  id: string;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  audio_url?: string | null; // 추가
  author_username: string | null;
  images: { width: number | null; height: number | null }[];
  post_likes: { count: number }[];
  comments: { count: number }[];
}

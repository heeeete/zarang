import { Post, RawPostResponse } from '../model/types';
import { PostFormInput } from '../model/schema';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * 게시글 목록을 조회하는 통합 API입니다.
 * 서버와 클라이언트 모두에서 사용하므로 React.cache는 호출부(서버 컴포넌트)에서 필요 시 적용합니다.
 */
export const fetchPostsData = async (
  supabase: SupabaseClient,
  options: {
    from: number;
    to: number;
    categoryId?: string | null;
    keyword?: string;
    authorId?: string;
    useView?: boolean; // explore_posts_with_author 뷰 사용 여부
  },
): Promise<Post[]> => {
  const { from, to, categoryId, keyword, authorId, useView = true } = options;

  let query = supabase
    .from(useView ? 'explore_posts_with_author' : 'posts')
    .select(
      `
      id,
      description,
      thumbnail_url,
      audio_url,
      ${useView ? 'author_username,' : 'author:profiles!posts_author_id_fkey(username),'}
      images:post_images(width, height),
      post_likes:post_likes!post_likes_post_id_fkey(count),
      comments:comments!comments_post_id_fkey(count),
      created_at
    `,
    )
    .order('created_at', { ascending: false })
    .order('sort_order', { foreignTable: 'post_images', ascending: true })
    .range(from, to);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  if (authorId) {
    query = query.eq('author_id', authorId);
  }

  if (keyword?.trim()) {
    query = query.or(
      `description.ilike.%${keyword}%,${useView ? 'author_username' : 'profiles.username'}.ilike.%${keyword}%`,
    );
  }

  const { data, error } = await query;

  if (error) throw error;

  const rawPosts = (data as unknown as RawPostResponse[]) || [];
  return rawPosts.map((post) => ({
    id: post.id,
    description: post.description,
    thumbnail_url: post.thumbnail_url,
    audio_url: post.audio_url,
    created_at: post.created_at,
    width: post.images?.[0]?.width || 800,
    height: post.images?.[0]?.height || 800,
    author: {
      username: useView
        ? post.author_username || '알 수 없음'
        : post.author?.username || '알 수 없음',
    },
    _count: {
      post_likes: post.post_likes?.[0]?.count ?? 0,
      comments: post.comments?.[0]?.count ?? 0,
    },
  }));
};

/**
 * 게시글을 생성합니다.
 */
export const createPost = async (
  data: PostFormInput,
  imageFiles: File[],
  audioFile: Blob | File | null,
) => {
  const formData = new FormData();
  formData.append('description', data.description || '');
  formData.append('category_id', data.category_id);

  if (audioFile) {
    const fileName = (audioFile as File).name || 'recording.webm';
    formData.append('audio', audioFile, fileName);
  }

  imageFiles.forEach((file) => {
    formData.append('images', file);
  });

  const response = await fetch('/api/posts', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || '게시글을 작성하지 못했어요.');
  }

  return response.json() as Promise<{ id: string }>;
};

/**
 * 게시글을 수정합니다.
 */
export const updatePost = async (
  postId: string,
  data: PostFormInput,
  imageOptions: {
    deletedImageIds: string[];
    remainingImageIds: string[];
    newImageFiles: File[];
  },
  audioOptions: {
    deleteExistingAudio: boolean;
    newAudioFile: Blob | File | null;
  },
) => {
  const formData = new FormData();
  formData.append('description', data.description || '');
  formData.append('category_id', data.category_id);

  formData.append('deletedImageIds', JSON.stringify(imageOptions.deletedImageIds));
  formData.append('remainingImageIds', JSON.stringify(imageOptions.remainingImageIds));
  imageOptions.newImageFiles.forEach((file) => formData.append('newImages', file));

  formData.append('deleteAudio', audioOptions.deleteExistingAudio.toString());
  if (audioOptions.newAudioFile) {
    const fileName = (audioOptions.newAudioFile as File).name || 'recording.webm';
    formData.append('audio', audioOptions.newAudioFile, fileName);
  }

  const response = await fetch(`/api/posts/${postId}`, {
    method: 'PATCH',
    body: formData,
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || '수정 내용을 저장하지 못했어요.');
  }

  return response.json();
};

import { unstable_cache } from 'next/cache';
import { SupabaseClient } from '@supabase/supabase-js';
import { Post, RawPostResponse, DetailPost, RawHomePostResponse } from '../model/types';
import { PostFormInput } from '../model/schema';

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
      author_id,
      description,
      thumbnail_url,
      audio_url,
      ${useView ? 'author_username, author_avatar_url,' : 'author:profiles!posts_author_id_fkey(username, avatar_url),'}
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
    author_id: post.author_id,
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
      avatar_url: useView
        ? post.author_avatar_url
        : post.author?.avatar_url,
    },
    _count: {
      post_likes: post.post_likes?.[0]?.count ?? 0,
      comments: post.comments?.[0]?.count ?? 0,
    },
  }));
};

/**
 * 추천 알고리즘이 적용된 홈 피드 게시글 목록을 조회합니다.
 */
export const fetchHomePosts = async (
  supabase: SupabaseClient,
  options: {
    from: number;
    to: number;
    userId?: string | null;
  },
): Promise<Post[]> => {
  const { from, to, userId } = options;
  const limit = to - from + 1;

  const { data, error } = await supabase.rpc('get_home_feed', {
    p_user_id: userId,
    p_limit: limit,
    p_offset: from,
  });

  if (error) throw error;

  const rawPosts = (data as unknown as RawHomePostResponse[]) || [];
  return rawPosts.map((post) => ({
    id: post.id,
    author_id: post.author_id,
    description: post.description,
    thumbnail_url: post.thumbnail_url,
    audio_url: post.audio_url,
    created_at: post.created_at,
    width: post.width,
    height: post.height,
    author: {
      username: post.author_username || '알 수 없음',
      avatar_url: post.author_avatar_url,
    },
    _count: {
      post_likes: Number(post.likes_count),
      comments: Number(post.comments_count),
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

  imageFiles.forEach((file, index) => {
    // 파일 이름을 안전한 형식으로 변경하여 append 합니다. (특히 Safari 호환성 및 특수문자 대응)
    const fileExt = file.name.split('.').pop() || 'jpg';
    const safeName = `image_${index}_${Date.now()}.${fileExt}`;
    formData.append('images', file, safeName);
  });

  const response = await fetch('/api/posts', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    let errorMessage = `에러 발생 (Status: ${response.status})`;

    try {
      if (contentType?.includes('application/json')) {
        const result = await response.json();
        errorMessage = result.error || errorMessage;
      } else {
        // JSON이 아닌 경우 (Vercel 413 에러 등 HTML 응답)
        const text = await response.text();
        if (response.status === 413) {
          errorMessage = '사진 용량이 너무 큽니다. (Vercel 4.5MB 제한)';
        } else {
          // HTML 응답인 경우 에러 메시지 식별을 위해 앞부분 100자만 추출
          errorMessage = `서버 응답(비-JSON): ${text.slice(0, 100)}...`;
        }
      }
    } catch (e) {
      errorMessage = `응답 처리 중 오류: ${e instanceof Error ? e.message : '알 수 없는 에러'}`;
    }
    
    throw new Error(errorMessage);
  }

  try {
    return await response.json() as { id: string };
  } catch (e) {
    throw new Error('응답 파싱 실패: 서버에서 올바른 JSON을 보내지 않았습니다.');
  }
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
  imageOptions.newImageFiles.forEach((file, index) => {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const safeName = `image_${index}_${Date.now()}.${fileExt}`;
    formData.append('newImages', file, safeName);
  });

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

/**
 * 게시글 상세 정보를 조회합니다 (캐싱 적용).
 * cookies() 등 동적 함수를 포함하는 클라이언트를 인자로 받아 에러를 방지합니다.
 */
export const getPostDetail = async (supabase: SupabaseClient, id: string) => {
  const fetcher = unstable_cache(
    async (postId: string) => {
      const { data: post, error } = await supabase
        .from('posts')
        .select(
          `
          *,
          author:profiles!posts_author_id_fkey(id, username, avatar_url),
          categories(label),
          audio_url,
          images:post_images(id, image_url, width, height),
          likes:post_likes(count),
          comments:comments(
            *,
            author:profiles!comments_author_id_fkey(username, avatar_url)
          )
        `,
        )
        .eq('id', postId)
        .order('sort_order', { foreignTable: 'post_images', ascending: true })
        .order('created_at', { foreignTable: 'comments', ascending: true })
        .single();

      if (error || !post) return null;
      return post as unknown as DetailPost;
    },
    [`post-detail-${id}`],
    {
      tags: [`post-${id}`],
      revalidate: 3600,
    },
  );

  return fetcher(id);
};

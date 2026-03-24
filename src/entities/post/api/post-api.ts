import { unstable_cache } from 'next/cache';
import { SupabaseClient } from '@supabase/supabase-js';
import { Post, RawPostResponse, DetailPost, RawHomePostResponse } from '../model/types';
import { PostFormInput } from '../model/schema';
import { v4 as uuidv4 } from 'uuid';
import { createClient as createBrowserClient } from '@/src/shared/lib/supabase/client';
import { processImage } from '@/src/shared/lib/image';
import { uploadPostImage, uploadToStorage } from '@/src/shared/lib/supabase/storage';

/**
 * 게시글 목록을 조회하는 통합 API입니다.
 */
export const fetchPostsData = async (
  supabase: SupabaseClient,
  options: {
    from: number;
    to: number;
    categoryId?: string | null;
    keyword?: string;
    authorId?: string;
    useView?: boolean;
  },
): Promise<Post[]> => {
  const { from, to, categoryId, keyword, authorId, useView = true } = options;

  let query = supabase
    .from(useView ? 'explore_posts_with_author' : 'posts')
    .select(`
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
    `)
    .order('created_at', { ascending: false })
    .order('sort_order', { foreignTable: 'post_images', ascending: true })
    .range(from, to);

  if (categoryId) query = query.eq('category_id', categoryId);
  if (authorId) query = query.eq('author_id', authorId);
  if (keyword?.trim()) {
    query = query.or(`description.ilike.%${keyword}%,${useView ? 'author_username' : 'profiles.username'}.ilike.%${keyword}%`);
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
      username: useView ? post.author_username || '알 수 없음' : post.author?.username || '알 수 없음',
      avatar_url: useView ? post.author_avatar_url : post.author?.avatar_url,
    },
    _count: {
      post_likes: post.post_likes?.[0]?.count ?? 0,
      comments: post.comments?.[0]?.count ?? 0,
    },
  }));
};

/**
 * 홈 피드 게시글 목록을 조회합니다.
 */
export const fetchHomePosts = async (
  supabase: SupabaseClient,
  options: { from: number; to: number; userId?: string | null }
): Promise<Post[]> => {
  const { from, to, userId } = options;
  const { data, error } = await supabase.rpc('get_home_feed', {
    p_user_id: userId,
    p_limit: to - from + 1,
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
 * 게시글을 생성합니다 (클라이언트 직접 업로드 방식).
 */
export const createPost = async (
  data: PostFormInput,
  imageFiles: File[],
  audioFile: Blob | File | null,
) => {
  const supabase = createBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('인증이 필요합니다.');

  const postId = uuidv4();
  const uploadedImages = [];

  // 1. 이미지 순차 처리 및 직접 업로드
  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    // EXIF 회전 및 WebP 변환
    const { blob, width, height } = await processImage(file);
    
    // 업로드
    const { publicUrl, storagePath } = await uploadPostImage(supabase, user.id, postId, i, blob);
    
    uploadedImages.push({
      image_url: publicUrl,
      storage_path: storagePath,
      width,
      height,
      sort_order: i,
    });
  }

  // 2. 오디오 업로드 (있는 경우)
  let audioUrl = null;
  let audioStoragePath = null;
  if (audioFile) {
    const fileExt = (audioFile as File).name?.split('.').pop() || 'webm';
    const fileName = `audio_${Date.now()}_${uuidv4()}.${fileExt}`;
    const path = `post-audios/${user.id}/${postId}/${fileName}`;
    
    const { publicUrl, storagePath } = await uploadToStorage(supabase, 'post-images', path, audioFile);
    audioUrl = publicUrl;
    audioStoragePath = storagePath;
  }

  // 3. 서버 API 호출 (DB 정보 기록)
  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: postId,
      description: data.description,
      category_id: data.category_id,
      audio_url: audioUrl,
      audio_storage_path: audioStoragePath,
      images: uploadedImages,
    }),
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || '게시글 작성을 완료하지 못했어요.');
  }

  return response.json() as Promise<{ id: string }>;
};

/**
 * 게시글 상세 정보를 조회합니다 (캐싱 적용).
 */
export const getPostDetail = async (supabase: SupabaseClient, id: string) => {
  const fetcher = unstable_cache(
    async (postId: string) => {
      const { data: post, error } = await supabase
        .from('posts')
        .select(`
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
        `)
        .eq('id', postId)
        .order('sort_order', { foreignTable: 'post_images', ascending: true })
        .order('created_at', { foreignTable: 'comments', ascending: true })
        .single();

      if (error || !post) return null;
      return post as unknown as DetailPost;
    },
    [`post-detail-${id}`],
    { tags: [`post-${id}`], revalidate: 3600 },
  );

  return fetcher(id);
};

import { unstable_cache } from 'next/cache';
import { SupabaseClient } from '@supabase/supabase-js';
import { Post, RawPostResponse, DetailPost, RawHomePostResponse } from '../model/types';
import { PostFormInput } from '../model/schema';
import { v4 as uuidv4 } from 'uuid';
import { createClient as createBrowserClient } from '@/src/shared/lib/supabase/client';
import { getImageMetadata } from '@/src/shared/lib/image';
import { uploadFile } from '@/src/shared/lib/supabase/storage';

/**
 * 게시글 목록 조회
 */
export const fetchPostsData = async (
  supabase: SupabaseClient,
  options: { from: number; to: number; categoryId?: string | null; keyword?: string; authorId?: string; useView?: boolean; }
): Promise<Post[]> => {
  const { from, to, categoryId, keyword, authorId, useView = true } = options;
  let query = supabase.from(useView ? 'explore_posts_with_author' : 'posts').select(`
    id, author_id, description, thumbnail_url, audio_url, created_at,
    ${useView ? 'author_username, author_avatar_url,' : 'author:profiles!posts_author_id_fkey(username, avatar_url),'}
    images:post_images(width, height),
    post_likes:post_likes!post_likes_post_id_fkey(count),
    comments:comments!comments_post_id_fkey(count)
  `).order('created_at', { ascending: false }).range(from, to);

  if (categoryId) query = query.eq('category_id', categoryId);
  if (authorId) query = query.eq('author_id', authorId);
  if (keyword?.trim()) query = query.or(`description.ilike.%${keyword}%,${useView ? 'author_username' : 'profiles.username'}.ilike.%${keyword}%`);

  const { data, error } = await query;
  if (error) throw error;

  return (data as unknown as RawPostResponse[]).map((post) => ({
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
 * 홈 피드 게시글 조회
 */
export const fetchHomePosts = async (supabase: SupabaseClient, options: { from: number; to: number; userId?: string | null }): Promise<Post[]> => {
  const { data, error } = await supabase.rpc('get_home_feed', { p_user_id: options.userId, p_limit: options.to - options.from + 1, p_offset: options.from });
  if (error) throw error;
  return (data as unknown as RawHomePostResponse[]).map((post) => ({
    id: post.id,
    author_id: post.author_id,
    description: post.description,
    thumbnail_url: post.thumbnail_url,
    audio_url: post.audio_url,
    created_at: post.created_at,
    width: post.width,
    height: post.height,
    author: { username: post.author_username || '알 수 없음', avatar_url: post.author_avatar_url },
    _count: { post_likes: Number(post.likes_count), comments: Number(post.comments_count) },
  }));
};

/**
 * 게시글 작성 (클라이언트 직접 업로드)
 */
export const createPost = async (data: PostFormInput, imageFiles: File[], audioFile: Blob | File | null) => {
  const supabase = createBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  const postId = uuidv4();
  const uploadedImages = [];

  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    const { width, height } = await getImageMetadata(file);
    const path = `post-images/${user.id}/${postId}/${i}_${uuidv4()}.${file.name.split('.').pop() || 'jpg'}`;
    const publicUrl = await uploadFile(supabase, 'post-images', path, file);
    
    uploadedImages.push({ image_url: publicUrl, storage_path: path, width, height, sort_order: i });
  }

  let audioInfo = null;
  if (audioFile) {
    const path = `post-audios/${user.id}/${postId}/${Date.now()}_${uuidv4()}.webm`;
    const publicUrl = await uploadFile(supabase, 'post-images', path, audioFile);
    audioInfo = { url: publicUrl, path };
  }

  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: postId,
      description: data.description,
      category_id: data.category_id,
      audio_url: audioInfo?.url,
      audio_storage_path: audioInfo?.path,
      images: uploadedImages,
    }),
  });

  if (!response.ok) throw new Error((await response.json()).error || '게시글 작성을 완료하지 못했어요.');
  return response.json() as Promise<{ id: string }>;
};

/**
 * 게시글 수정 (클라이언트 직접 업로드)
 */
export const updatePost = async (
  postId: string,
  data: PostFormInput,
  imageOptions: { deletedImageIds: string[]; remainingImageIds: string[]; newImageFiles: File[]; },
  audioOptions: { deleteExistingAudio: boolean; newAudioFile: Blob | File | null; }
) => {
  const supabase = createBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  const uploadedNewImages = [];
  for (const file of imageOptions.newImageFiles) {
    const { width, height } = await getImageMetadata(file);
    const path = `post-images/${user.id}/${postId}/${Date.now()}_${uuidv4()}.${file.name.split('.').pop() || 'jpg'}`;
    const publicUrl = await uploadFile(supabase, 'post-images', path, file);
    uploadedNewImages.push({ image_url: publicUrl, storage_path: path, width, height });
  }

  let newAudioInfo = null;
  if (audioOptions.newAudioFile) {
    const path = `post-audios/${user.id}/${postId}/${Date.now()}_${uuidv4()}.webm`;
    const publicUrl = await uploadFile(supabase, 'post-images', path, audioOptions.newAudioFile);
    newAudioInfo = { url: publicUrl, path };
  }

  const response = await fetch(`/api/posts/${postId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: data.description,
      category_id: data.category_id,
      deletedImageIds: imageOptions.deletedImageIds,
      newImages: uploadedNewImages,
      deleteAudio: audioOptions.deleteExistingAudio,
      newAudio: newAudioInfo ? { audio_url: newAudioInfo.url, audio_storage_path: newAudioInfo.path } : null,
    }),
  });

  if (!response.ok) throw new Error((await response.json()).error || '수정 내용을 저장하지 못했어요.');
  return response.json();
};

/**
 * 게시글 상세 조회
 */
export const getPostDetail = async (supabase: SupabaseClient, id: string) => {
  const fetcher = unstable_cache(async (postId: string) => {
    const { data: post, error } = await supabase.from('posts').select(`
      *, author:profiles!posts_author_id_fkey(id, username, avatar_url),
      categories(label), images:post_images(id, image_url, width, height),
      likes:post_likes(count),
      comments:comments(*, author:profiles!comments_author_id_fkey(username, avatar_url))
    `).eq('id', postId).order('sort_order', { foreignTable: 'post_images', ascending: true }).order('created_at', { foreignTable: 'comments', ascending: true }).single();
    return (error || !post) ? null : (post as unknown as DetailPost);
  }, [`post-detail-${id}`], { tags: [`post-${id}`], revalidate: 3600 });
  return fetcher(id);
};

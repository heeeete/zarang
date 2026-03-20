import { createClient } from '@/src/shared/lib/supabase/client';

export type ProfileListItem = {
  id: string;
  username: string;
  avatar_url: string | null;
  is_following?: boolean;   // 내가 이 사람을 팔로우하는지
  is_followed_by?: boolean; // 이 사람이 나를 팔로우하는지
};

export const getFollowers = async (userId: string, currentUserId?: string): Promise<ProfileListItem[]> => {
  const supabase = createClient();
  
  // 1. 대상 유저의 팔로워 목록 가져오기
  const { data, error } = await supabase
    .from('follows')
    .select(`
      follower:profiles!follows_follower_id_fkey (
        id,
        username,
        avatar_url
      )
    `)
    .eq('following_id', userId);

  if (error || !data) {
    console.error('Error fetching followers:', error);
    return [];
  }

  const profiles = (data as unknown as { follower: ProfileListItem }[]).map((item) => item.follower);

  // 2. 로그인 중이라면 배치 쿼리로 팔로우 관계 한꺼번에 조회
  if (currentUserId && profiles.length > 0) {
    const profileIds = profiles.map(p => p.id);

    // [배치 쿼리 1] 내가 이 사람들을 팔로우 중인지
    const { data: followingData } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', currentUserId)
      .in('following_id', profileIds);

    // [배치 쿼리 2] 이 사람들이 나를 팔로우 중인지
    const { data: followedByData } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('following_id', currentUserId)
      .in('follower_id', profileIds);

    const followingSet = new Set(followingData?.map(f => f.following_id));
    const followedBySet = new Set(followedByData?.map(f => f.follower_id));

    return profiles.map(p => ({
      ...p,
      is_following: followingSet.has(p.id),
      is_followed_by: followedBySet.has(p.id)
    }));
  }

  return profiles;
};

export const getFollowing = async (userId: string, currentUserId?: string): Promise<ProfileListItem[]> => {
  const supabase = createClient();
  
  // 1. 대상 유저의 팔로잉 목록 가져오기
  const { data, error } = await supabase
    .from('follows')
    .select(`
      following:profiles!follows_following_id_fkey (
        id,
        username,
        avatar_url
      )
    `)
    .eq('follower_id', userId);

  if (error || !data) {
    console.error('Error fetching following:', error);
    return [];
  }

  const profiles = (data as unknown as { following: ProfileListItem }[]).map((item) => item.following);

  // 2. 로그인 중이라면 배치 쿼리로 팔로우 관계 한꺼번에 조회
  if (currentUserId && profiles.length > 0) {
    const profileIds = profiles.map(p => p.id);

    const { data: followingData } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', currentUserId)
      .in('following_id', profileIds);

    const { data: followedByData } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('following_id', currentUserId)
      .in('follower_id', profileIds);

    const followingSet = new Set(followingData?.map(f => f.following_id));
    const followedBySet = new Set(followedByData?.map(f => f.follower_id));

    return profiles.map(p => ({
      ...p,
      is_following: followingSet.has(p.id),
      is_followed_by: followedBySet.has(p.id)
    }));
  }

  return profiles;
};

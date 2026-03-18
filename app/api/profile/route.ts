import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/shared/lib/supabase/server';
import { createAdminClient } from '@/src/shared/lib/supabase/admin';
import { v4 as uuidv4 } from 'uuid';

/**
 * 프로필 정보 수정 API
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const username = formData.get('username') as string;
    const avatarFile = formData.get('avatar') as File | null;

    if (!username) {
      return NextResponse.json({ error: '닉네임은 필수입니다.' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    let avatarUrl = undefined;

    // 1. 프로필 이미지 업로드 처리
    if (avatarFile) {
      // 기존 프로필 이미지 정보 가져오기 (삭제를 위해)
      const { data: oldProfile } = await adminSupabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

      // 새 이미지 업로드
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}_${uuidv4()}.${fileExt}`;
      const storagePath = `avatars/${fileName}`;

      const { error: uploadError } = await adminSupabase.storage
        .from('post-images') // 아바타 전용 버킷이 없다면 공용 사용
        .upload(storagePath, avatarFile, {
          contentType: avatarFile.type,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = adminSupabase.storage
        .from('post-images')
        .getPublicUrl(storagePath);

      avatarUrl = publicUrl;

      // 기존 이미지 삭제 (있다면)
      if (oldProfile?.avatar_url && oldProfile.avatar_url.includes('avatars/')) {
        const oldPath = oldProfile.avatar_url.split('public/').pop();
        if (oldPath) {
          await adminSupabase.storage.from('post-images').remove([oldPath]);
        }
      }
    }

    // 2. 프로필 정보 DB 업데이트
    const updateData: any = {
      username,
      updated_at: new Date().toISOString(),
    };
    if (avatarUrl) updateData.avatar_url = avatarUrl;

    const { error: updateError } = await adminSupabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);

    if (updateError) {
      if (updateError.code === '23505') {
        return NextResponse.json({ error: '이미 사용 중인 닉네임이에요.' }, { status: 400 });
      }
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: '프로필 수정 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

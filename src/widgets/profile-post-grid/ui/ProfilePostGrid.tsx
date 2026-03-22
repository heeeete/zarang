'use client';

import { ProfilePostCard } from '@/src/entities/post/ui/ProfilePostCard';
import { Post } from '@/src/entities/post/model/types';
import dynamic from 'next/dynamic';
import PostSkeleton from '@/src/entities/post/ui/PostSkeleton';

const ResponsiveMasonry = dynamic(
  () => import('react-responsive-masonry').then((mod) => mod.ResponsiveMasonry),
  {
    ssr: false,
    loading: () => <PostSkeleton columns={3} />,
  },
);

const Masonry = dynamic(() => import('react-responsive-masonry').then((mod) => mod.default), {
  ssr: false,
});

interface ProfilePostGridProps {
  posts: Post[];
  loading?: boolean;
}

/**
 * 프로필 페이지용 3열 Masonry 그리드 위젯입니다.
 */
export const ProfilePostGrid = ({ posts, loading }: ProfilePostGridProps) => {
  if (posts.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm font-medium text-neutral-400 italic">아직 자랑거리가 없어요.</p>
      </div>
    );
  }

  return (
    <div>
      <ResponsiveMasonry columnsCountBreakPoints={{ 300: 3, 600: 3 }}>
        <Masonry gutter="2px">
          {posts.map((post) => (
            <ProfilePostCard key={post.id} post={post} />
          ))}
        </Masonry>
      </ResponsiveMasonry>

      {loading && posts.length === 0 && <PostSkeleton columns={3} />}
    </div>
  );
};

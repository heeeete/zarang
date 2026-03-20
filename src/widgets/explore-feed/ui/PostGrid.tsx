'use client';
import { PostCard } from '@/src/entities/post/ui/PostCard';
import { Post } from '@/src/entities/post/model/types';
import dynamic from 'next/dynamic';
import PostSkeleton from '@/src/entities/post/ui/PostSkeleton';

const ResponsiveMasonry = dynamic(
  () => import('react-responsive-masonry').then((mod) => mod.ResponsiveMasonry),
  {
    ssr: false,
    loading: () => <PostSkeleton />,
  },
);

const Masonry = dynamic(() => import('react-responsive-masonry').then((mod) => mod.default), {
  ssr: false,
});

interface PostGridProps {
  posts: Post[];
  loading: boolean;
}

export const PostGrid = ({ posts, loading }: PostGridProps) => {
  if (posts.length === 0 && !loading) {
    return (
      <div className="py-32 text-center text-neutral-400">
        <p className="text-sm font-medium">검색 결과가 없어요.</p>
        <p className="mt-1 text-xs">다른 검색어로 찾아보시겠어요?</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveMasonry columnsCountBreakPoints={{ 300: 2, 600: 2 }}>
        <Masonry gutter="10px">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </Masonry>
      </ResponsiveMasonry>
    </div>
  );
};

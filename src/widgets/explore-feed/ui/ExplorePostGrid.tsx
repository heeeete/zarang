import { ExplorePostCard } from '@/src/entities/post/ui/ExplorePostCard';
import { ExplorePost } from '../model/types';
import dynamic from 'next/dynamic';

const ResponsiveMasonry = dynamic(
  () => import('react-responsive-masonry').then((mod) => mod.ResponsiveMasonry),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-2 gap-[10px]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl bg-neutral-100"
            style={{ height: i % 2 === 0 ? '200px' : '260px' }}
          />
        ))}
      </div>
    ),
  },
);

const Masonry = dynamic(() => import('react-responsive-masonry').then((mod) => mod.default), {
  ssr: false,
});

interface ExplorePostGridProps {
  posts: ExplorePost[];
  loading: boolean;
}

export const ExplorePostGrid = ({ posts, loading }: ExplorePostGridProps) => {
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
            <ExplorePostCard key={post.id} post={post} />
          ))}
        </Masonry>
      </ResponsiveMasonry>
    </div>
  );
};

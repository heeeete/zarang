'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/src/shared/lib/supabase/client';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import { ExplorePostCard } from '@/src/entities/post/ui/ExplorePostCard';
import { Category } from '@/src/features/post-creation/model/schema';
import { Loader2, ChevronDown, Check, Search, X } from 'lucide-react';
import { cn } from '@/src/shared/lib/utils';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/src/shared/ui/drawer';
import { Button } from '@/src/shared/ui/button';

interface ExplorePost {
  id: string;
  title: string | null;
  thumbnail_url: string | null;
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

interface RawExplorePost {
  id: string;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  author_username: string | null;
  images: { width: number | null; height: number | null }[];
  post_likes: { count: number }[];
  comments: { count: number }[];
}

interface ExploreFeedProps {
  categories: Category[];
  initialPosts: ExplorePost[];
}

const PAGE_SIZE = 12;

export const ExploreFeed = ({ categories, initialPosts }: ExploreFeedProps) => {
  const [posts, setPosts] = useState<ExplorePost[]>(initialPosts);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchKeyword, setSearchQuery] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length === PAGE_SIZE);
  const [page, setPage] = useState(1);

  // 초기 렌더링 여부를 추적하기 위한 ref
  const isInitialRender = useRef(true);
  const observerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  /**
   * 데이터를 가져오는 통합 함수입니다.
   */
  const fetchPosts = useCallback(
    async (pageNum: number, categoryId: string | null, keyword: string, isReset = false) => {
      if (loading && !isReset) return;

      setLoading(true);
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      try {
        let query = supabase
          .from('explore_posts_with_author')
          .select(
            `
            id,
            title,
            description,
            thumbnail_url,
            author_username,
            images:post_images(width, height),
            post_likes(count),
            comments(count)
          `,
          )
          .order('created_at', { ascending: false })
          .order('sort_order', { foreignTable: 'post_images', ascending: true })
          .range(from, to);

        if (categoryId) {
          query = query.eq('category_id', categoryId);
        }

        if (keyword.trim()) {
          query = query.or(
            `title.ilike.%${keyword}%,description.ilike.%${keyword}%,author_username.ilike.%${keyword}%`,
          );
        }

        const { data, error } = await query;

        if (error) throw error;

        const rawPosts = (data as unknown as RawExplorePost[]) || [];
        const newPosts: ExplorePost[] = rawPosts.map((post) => ({
          id: post.id,
          title: post.title,
          thumbnail_url: post.thumbnail_url,
          width: post.images?.[0]?.width || 800,
          height: post.images?.[0]?.height || 800,
          author: { username: post.author_username || '알 수 없음' },
          _count: {
            post_likes: post.post_likes?.[0]?.count ?? 0,
            comments: post.comments?.[0]?.count ?? 0,
          },
        }));

        if (isReset) {
          setPosts(newPosts);
          setPage(1);
          setHasMore(rawPosts.length === PAGE_SIZE);
        } else {
          setPosts((prev) => [...prev, ...newPosts]);
          setPage(pageNum + 1);
          setHasMore(rawPosts.length === PAGE_SIZE);
        }
      } catch (err) {
        console.error('구경하기 데이터 로드 실패:', err);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [loading, supabase],
  );

  // 검색어 디바운스 처리 (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(searchKeyword);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  // 검색어나 카테고리 변경 시 초기화 및 재조회
  useEffect(() => {
    // 초기 렌더링 시에는 서버에서 받은 데이터를 사용하므로 스킵합니다.
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    
    fetchPosts(0, selectedCategoryId, debouncedKeyword, true);
  }, [debouncedKeyword, selectedCategoryId]); // fetchPosts, initialPosts, posts를 의존성에서 제거하여 무한 루프 방지

  const selectedCategoryLabel = selectedCategoryId
    ? categories.find((c) => c.id === selectedCategoryId)?.label
    : '전체';

  /**
   * 무한 스크롤 관찰
   */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchPosts(page, selectedCategoryId, debouncedKeyword);
        }
      },
      { threshold: 0.1 },
    );

    const currentTarget = observerRef.current;
    if (currentTarget) observer.observe(currentTarget);
    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [fetchPosts, hasMore, loading, page, selectedCategoryId, debouncedKeyword]);

  return (
    <div className="flex min-h-full flex-col">
      {/* 상단 검색바 & 카테고리 필터 버튼 */}
      <div className="sticky top-0 z-40 flex flex-col gap-2.5 border-b bg-white/95 px-4 py-3 backdrop-blur-sm">
        {/* 통합 검색창 */}
        <div className="relative w-full">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="제목, 내용, 닉네임으로 검색"
            className="h-10 w-full rounded-xl bg-neutral-100 pr-10 pl-9 text-sm font-medium transition-all focus:bg-white focus:ring-2 focus:ring-primary/20 focus:outline-none"
          />
          {searchKeyword && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-neutral-200 p-0.5 text-neutral-500 hover:bg-neutral-300"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* 카테고리 버튼 */}
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerTrigger asChild>
            <button className="flex w-fit items-center gap-1.5 rounded-full bg-neutral-100 px-4 py-2 text-xs font-bold text-neutral-700 transition-all outline-none hover:bg-neutral-200 active:scale-95">
              {selectedCategoryLabel}
              <ChevronDown
                className={cn(
                  'size-3.5 text-neutral-400 transition-transform duration-200',
                  isDrawerOpen && 'rotate-180',
                )}
              />
            </button>
          </DrawerTrigger>
          <DrawerContent className="mx-auto max-w-[420px]">
            <DrawerHeader className="border-b pb-4">
              <DrawerTitle className="text-center text-base font-bold text-neutral-900">
                카테고리
              </DrawerTitle>
            </DrawerHeader>
            <div className="flex max-h-[60vh] flex-col gap-1.5 overflow-y-auto p-4">
              <button
                onClick={() => {
                  setSelectedCategoryId(null);
                  setIsDrawerOpen(false);
                }}
                className={cn(
                  'flex items-center justify-between rounded-xl px-4 py-3.5 text-sm font-semibold transition-colors',
                  selectedCategoryId === null
                    ? 'bg-primary/10 text-primary'
                    : 'text-neutral-600 hover:bg-neutral-50',
                )}
              >
                전체
                {selectedCategoryId === null && <Check className="size-4" />}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategoryId(cat.id);
                    setIsDrawerOpen(false);
                  }}
                  className={cn(
                    'flex items-center justify-between rounded-xl px-4 py-3.5 text-sm font-semibold transition-colors',
                    selectedCategoryId === cat.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-neutral-600 hover:bg-neutral-50',
                  )}
                >
                  {cat.label}
                  {selectedCategoryId === cat.id && <Check className="size-4" />}
                </button>
              ))}
            </div>
            <div className="p-4 pb-8">
              <Button
                variant="ghost"
                className="h-12 w-full rounded-xl font-medium text-neutral-400 hover:bg-neutral-50"
                onClick={() => setIsDrawerOpen(false)}
              >
                닫기
              </Button>
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Masonry 피드 영역 */}
      <div className="w-full flex-1 px-2 py-3">
        {posts.length === 0 && !loading ? (
          <div className="py-32 text-center text-neutral-400">
            <p className="text-sm font-medium">검색 결과가 없어요.</p>
            <p className="mt-1 text-xs">다른 검색어로 찾아보시겠어요?</p>
          </div>
        ) : (
          <div className="w-full">
            <ResponsiveMasonry columnsCountBreakPoints={{ 300: 2, 600: 2 }}>
              <Masonry gutter="10px">
                {posts.map((post) => (
                  <ExplorePostCard key={post.id} post={post} />
                ))}
              </Masonry>
            </ResponsiveMasonry>
          </div>
        )}

        {/* 로딩 표시 및 관찰 포인트 */}
        <div ref={observerRef} className="flex justify-center py-10">
          {loading && (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-[10px] font-medium text-muted-foreground">취향을 찾아보는 중...</p>
            </div>
          )}
          {!hasMore && posts.length > 0 && (
            <p className="text-[10px] text-muted-foreground italic">
              취향 지도의 끝에 도달했어요! ✨
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

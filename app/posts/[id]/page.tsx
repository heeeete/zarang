import { Metadata } from 'next';
import { PostDetailsPage } from '@/src/pages/post-details/ui/PostDetailsPage';
import { fetchPostDetail } from '@/src/entities/post/api/fetch-post-detail';

export async function generateStaticParams() {
  return [];
}

type Props = {
  params: Promise<{ id: string }>;
};

/**
 * 게시글 상세 페이지의 동적 메타데이터를 생성합니다.
 * fetchPostDetail은 React cache가 적용되어 있어 본문 렌더링 시 중복 호출되지 않습니다.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const post = await fetchPostDetail(id);

  if (!post) {
    return {
      title: '게시글을 찾을 수 없습니다 - ZARANG',
    };
  }

  // 게시글 본문(description)의 일부를 타이틀로 사용하여 인덱싱 품질을 높입니다.
  const contentSnippet = post.description?.slice(0, 50).trim() || '취향 아이템 자랑';
  const username = post.author?.username || '알 수 없는 사용자';
  const title = `${contentSnippet} | ${username}님의 자랑거리 - ZARANG`;

  const description = post.description
    ? post.description.slice(0, 160).replace(/\n/g, ' ').trim()
    : '당신의 취향 아이템을 공유하고 새로운 영감을 얻어보세요. ZARANG에서 더 많은 아이템을 구경할 수 있습니다.';

  // 썸네일 이미지가 있으면 OG 이미지로 사용합니다.
  const ogImage = post.thumbnail_url || undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default PostDetailsPage;

import Link from 'next/link';
import { FileSearch } from 'lucide-react';
import { SubHeader } from '@/src/shared/ui/SubHeader';

/**
 * 게시글을 찾을 수 없을 때 표시되는 404 페이지입니다.
 * 깔끔하고 정중한 어조로 사용자에게 안내합니다.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* 뒤로가기 버튼이 포함된 헤더 */}
      <SubHeader title="게시글 상세" />

      <div className="flex flex-1 flex-col items-center justify-center px-8 pb-32">
        {/* 시각적 포인트: 아이콘 */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-50">
          <FileSearch className="h-10 w-10 text-neutral-300" />
        </div>

        {/* 안내 메시지 */}
        <h2 className="mb-2 text-xl font-bold text-neutral-900">게시글을 찾을 수 없어요</h2>
        <p className="mb-10 text-center text-[15px] leading-relaxed text-neutral-500">
          삭제된 게시글이거나,
          <br />
          주소가 올바르지 않을 수 있습니다.
        </p>

        {/* 액션 버튼 */}
        <Link
          href="/"
          className="flex h-12 w-full max-w-[200px] items-center justify-center rounded-sm bg-primary text-[15px] font-bold text-white shadow-sm"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}

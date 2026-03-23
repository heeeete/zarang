'use client';

import { useAuth } from '@/src/app/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useCommentContext } from './CommentProvider';

interface ReplyButtonProps {
  parentId: string;
  targetId: string;
  targetUsername: string;
}

/**
 * 답글 달기 버튼 (Client)
 */
export const ReplyButton = ({ parentId, targetId, targetUsername }: ReplyButtonProps) => {
  const { user } = useAuth();
  const router = useRouter();
  const { setReplyingTo, setEditingComment } = useCommentContext();

  const handleClick = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setEditingComment(null);
    setReplyingTo({ parentId, username: targetUsername, targetId });

    // 스크롤 이동 (선택사항: 필요 시 Context에 스크롤 함수 추가 가능)
    const el = document.getElementById(`comment-${targetId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <button
      onClick={handleClick}
      className="mt-0.5 w-fit text-[11px] font-bold text-neutral-500 hover:text-neutral-900 transition-colors"
    >
      답글 달기
    </button>
  );
};

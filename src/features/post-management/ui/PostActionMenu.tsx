'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MoreVertical, Pencil, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/src/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/shared/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/src/shared/ui/alert-dialog';
import { toast } from 'sonner';

interface PostActionMenuProps {
  postId: string;
}

/**
 * 게시글 수정 및 삭제 액션을 제공하는 드롭다운 메뉴 컴포넌트입니다.
 */
export const PostActionMenu = ({ postId }: PostActionMenuProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsAlertOpen(false); // 즉시 다이얼로그를 닫아 반응을 보여줍니다.
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || '삭제하지 못했어요.');
      }

      router.back();

      // back()이 완료된 후 refresh() 실행
      setTimeout(() => {
        toast.success('게시글을 삭제했어요.');
        router.refresh();
      }, 100);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '삭제하는 중에 문제가 생겼어요.');
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="-mr-2 text-muted-foreground hover:bg-transparent hover:text-foreground"
            >
              {isDeleting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <MoreVertical className="h-5 w-5" />
              )}
              <span className="sr-only">게시글 관리</span>
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem render={<Link href={`/posts/${postId}/edit`} />}>
            <Pencil className="mr-2 h-4 w-4" />
            <span>수정</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setIsAlertOpen(true)}
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>삭제</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mb-2 flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <AlertDialogTitle>게시글 삭제</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              정말로 이 자랑거리를 삭제할까요? 삭제하면 다시 되돌릴 수 없어요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} variant="destructive" disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : '삭제하기'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

'use client';

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/src/shared/ui/drawer';
import { Button } from '@/src/shared/ui/button';
import { EllipsisIcon, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useCommentActions } from '../model/useCommentActions';

interface CommentActionMenuProps {
  commentId: string;
  content: string;
  isOwner: boolean; // 댓글 작성자 본인인지 여부
}

/**
 * 댓글 관리 메뉴 (Feature UI Component)
 * 비즈니스 로직은 useCommentActions 훅을 사용하여 내부적으로 처리합니다.
 */
export const CommentActionMenu = ({ commentId, content, isOwner }: CommentActionMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { handleEdit, handleDelete } = useCommentActions(commentId, content);

  const onEditClick = () => {
    setIsOpen(false);
    handleEdit();
  };

  const onDeleteClick = async () => {
    setIsOpen(false);
    await handleDelete();
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger className="rounded-full p-1 transition-colors outline-none hover:bg-neutral-100">
        <EllipsisIcon className="size-4 text-neutral-400" />
      </DrawerTrigger>
      <DrawerContent 
        className="mx-auto max-w-[420px] rounded-t-2xl pb-5"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DrawerHeader className="sr-only">
          <DrawerTitle>댓글 관리</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-2 p-4">
          {isOwner && (
            <Button
              variant="ghost"
              className="h-14 w-full justify-start gap-3 text-base font-medium"
              onClick={onEditClick}
            >
              <Pencil className="size-5" />
              수정하기
            </Button>
          )}
          <Button
            variant="ghost"
            className="h-14 w-full justify-start gap-3 text-base font-medium text-red-500 hover:bg-red-50 hover:text-red-600"
            onClick={onDeleteClick}
          >
            <Trash2 className="size-5" />
            삭제하기
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

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

interface CommentActionMenuProps {
  onEdit: () => void;
  onDelete: () => void;
  isOwner: boolean; // 댓글 작성자 본인인지 여부
}

export const CommentActionMenu = ({ onEdit, onDelete, isOwner }: CommentActionMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleEdit = () => {
    setIsOpen(false);
    onEdit();
  };

  const handleDelete = () => {
    setIsOpen(false);
    onDelete();
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger className="rounded-full p-1 transition-colors outline-none hover:bg-neutral-100">
        <EllipsisIcon className="size-4 text-neutral-400" />
      </DrawerTrigger>
      <DrawerContent className="mx-auto max-w-[420px] rounded-t-2xl pb-5">
        <DrawerHeader className="sr-only">
          <DrawerTitle>댓글 관리</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-2 p-4">
          {isOwner && (
            <Button
              variant="ghost"
              className="h-14 w-full justify-start gap-3 text-base font-medium"
              onClick={handleEdit}
            >
              <Pencil className="size-5" />
              수정하기
            </Button>
          )}
          <Button
            variant="ghost"
            className="h-14 w-full justify-start gap-3 text-base font-medium text-red-500 hover:bg-red-50 hover:text-red-600"
            onClick={handleDelete}
          >
            <Trash2 className="size-5" />
            삭제하기
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

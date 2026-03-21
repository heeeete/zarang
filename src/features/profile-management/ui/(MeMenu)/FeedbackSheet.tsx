import { ChevronRight, Headphones } from 'lucide-react';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/src/shared/ui/sheet';
import { Button } from '@/src/shared/ui/button';

/**
 * 의견 보내기 시트 컴포넌트입니다.
 */
export const FeedbackSheet = () => {
  return (
    <Sheet>
      <SheetTrigger className="flex w-full items-center justify-between rounded-lg px-2 py-4 text-left text-sm font-medium text-neutral-700 transition-colors outline-none hover:bg-neutral-50">
        <span>의견 보내기</span>
        <ChevronRight className="size-4 text-neutral-300" />
      </SheetTrigger>
      <SheetContent showCloseButton={false} side="right" className="border-none p-0 shadow-2xl">
        <SheetHeader className="p-4">
          <SheetTitle className="flex items-center justify-between gap-2">
            <SheetClose className="outline-none">
              <ChevronRight className="size-6 rotate-180" />
            </SheetClose>
            <p className="text-lg font-bold text-neutral-900">의견 보내기</p>
            <div className="size-6"></div>
          </SheetTitle>
        </SheetHeader>
        <div className="flex h-[80%] flex-col items-center justify-center gap-4 p-6 text-center">
          HI
        </div>
      </SheetContent>
    </Sheet>
  );
};

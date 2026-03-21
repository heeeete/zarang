import { ChevronRight } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/src/shared/ui/sheet';

import AppSheetHeader from '@/src/shared/ui/AppSheetHeader';

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
        <AppSheetHeader title="의견 보내기" />
        <div className="flex h-[80%] flex-col items-center justify-center gap-4 p-6 text-center">
          HI
        </div>
      </SheetContent>
    </Sheet>
  );
};

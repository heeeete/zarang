import { ChevronRight } from 'lucide-react';
import { SheetClose, SheetHeader, SheetTitle } from './sheet';

export default function AppSheetHeader({
  title,
  rightContent,
}: {
  title: string;
  rightContent?: React.ReactNode;
}) {
  return (
    <SheetHeader className="p-4">
      <SheetTitle className="flex items-center justify-between gap-2">
        <SheetClose className="outline-none">
          <ChevronRight className="size-6 rotate-180" />
        </SheetClose>
        <p className="text-lg font-bold text-neutral-900">{title}</p>
        {rightContent ? <div>{rightContent}</div> : <div className="size-6" />}
      </SheetTitle>
    </SheetHeader>
  );
}

import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/src/shared/lib/utils';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/src/shared/ui/drawer';
import { Button } from '@/src/shared/ui/button';
import { Category } from '@/src/entities/post/model/schema';

interface CategoryDrawerProps {
  categories: Category[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode;
  showAllOption?: boolean;
  title?: string;
}

export const CategoryDrawer = ({
  categories,
  selected,
  onSelect,
  open,
  onOpenChange,
  children,
  showAllOption = true,
  title = '카테고리',
}: CategoryDrawerProps) => {
  const selectedCategoryLabel = selected
    ? categories.find((c) => c.id === selected)?.label
    : '전체';

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger className="flex w-fit items-center gap-1.5 rounded-full bg-neutral-100 px-4 py-2 text-xs font-bold text-neutral-700 transition-all outline-none hover:bg-neutral-200 active:scale-95">
        {selectedCategoryLabel}
        <ChevronDown
          className={cn(
            'size-3.5 text-neutral-400 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </DrawerTrigger>
      <DrawerContent className="mx-auto max-w-[420px]">
        <DrawerHeader className="border-b pb-4">
          <DrawerTitle className="text-center text-base font-bold text-neutral-900">
            {title}
          </DrawerTitle>
        </DrawerHeader>
        <div className="flex max-h-[60vh] flex-col gap-1.5 overflow-y-auto p-4">
          {showAllOption && (
            <button
              onClick={() => {
                onSelect(null);
                onOpenChange(false);
              }}
              className={cn(
                'flex items-center justify-between rounded-xl px-4 py-3.5 text-sm font-semibold transition-colors',
                selected === null
                  ? 'bg-primary/10 text-primary'
                  : 'text-neutral-600 hover:bg-neutral-50',
              )}
            >
              전체
              {selected === null && <Check className="size-4" />}
            </button>
          )}
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                onSelect(cat.id);
                onOpenChange(false);
              }}
              className={cn(
                'flex items-center justify-between rounded-xl px-4 py-3.5 text-sm font-semibold transition-colors',
                selected === cat.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-neutral-600 hover:bg-neutral-50',
              )}
            >
              {cat.label}
              {selected === cat.id && <Check className="size-4" />}
            </button>
          ))}
        </div>
        <div className="p-4 pb-8">
          <Button
            variant="ghost"
            className="h-12 w-full rounded-xl font-medium text-neutral-400 hover:bg-neutral-50"
            onClick={() => onOpenChange(false)}
          >
            닫기
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
